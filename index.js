// Importa o express para criar o servidor web
const express = require('express');

// Importa o módulo de banco de dados
const db = require('./database.js');

// Port local que o servidor irá escutar
const PORT = 3001;

// Importa axios para possíveis requisições HTTP e fs/path para manipulação de arquivos
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const url = require('url');
const cors = require('cors');

// Inicializa o app
const app = express();

// Importa ocrService para processar imagens de NFs
const { processarNotaFiscal } = require('./ocrService.js');

// Cria uma pasta 'temp' para baixar as NFs, se não existir
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir);
}

// Configura o CORS para permitir requisições do frontend (React/Netx.js)   
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());


// -----------------------------------------------------------------
// 1. ENDPOINT: Criar um novo ticket 
// Rota: POST /api/tickets
// ---------------------------------------
// --------------------------
app.post('/api/tickets', (req, res) => {
    // Pega os dados do corpo (body) da requisição
    const { client_name, client_contact, raw_description, nf_url } = req.body;

    // Validação dos campos obrigatórios
    if (!client_name || !client_contact || !raw_description) {
        return res.status(400).json({ error: 'Faltam dados obrigatórios (nome, contato, descrição).' });
    }

    // --- LÓGICA DE ROTEAMENTO ---
    let statusTicket;
    let atendimentoTipo;
    // Garantia inicia como 'Pendente' para todos os tickets
    const statusGarantia = 'Pendente'; 

    // Testa se a NF foi fornecida
    if (nf_url && nf_url.trim() !== '') {
        // Se TEM NF: O fluxo automático continua
        statusTicket = 'Novo'; // (Status inicial para automação)
        atendimentoTipo = 'Automático';
    } else {
        // Se NÃO TEM NF: O fluxo é manual
        statusTicket = 'Aguardando análise de atendente';
        atendimentoTipo = 'atendente';
    }

    const sql = `INSERT INTO Tickets (
                    client_name, client_contact, raw_description, nf_url, 
                    status_ticket, status_garantia, atendimento_tipo
                 ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
                    client_name, client_contact, raw_description, nf_url || null,
                    statusTicket, statusGarantia, atendimentoTipo
                 ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Erro ao inserir no banco:', err.message);
            return res.status(500).json({ error: 'Erro interno ao salvar o ticket.' });
        }

        // Retorna o resultado do roteamento para o n8n
        res.status(201).json({
            message: 'Ticket criado com sucesso!',
            ticketId: this.lastID,
            status_ticket: statusTicket,
            atendimento_tipo: atendimentoTipo
        });
    });
});

// -----------------------------------------------------------------
// 2. ENDPOINT: Listar todos os tickets (para o painel do atendente)
// Rota: GET /api/tickets
// -----------------------------------------------------------------
app.get('/api/tickets', (req, res) => {
    // Seleciona todos os tickets, ordenando pelos mais novos primeiro
    const sql = `SELECT * FROM Tickets ORDER BY created_at DESC`;
    
    // db.all() é usado para SELECT que retorna múltiplas linhas
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar tickets:', err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar tickets.' });
        }
        
        // Retorna a lista de tickets como JSON
        res.json({
            message: 'Tickets recuperados com sucesso',
            data: rows
        });
    });
});

// -----------------------------------------------------------------
// 3. ENDPOINT: Atualizar um ticket (para o n8n usar após IA/OCR)
// Rota: PUT /api/tickets/:id
// -----------------------------------------------------------------
app.put('/api/tickets/:id', (req, res) => {
    // Pega os dados que o n8n vai enviar
    const { status_garantia, suggested_part_sku, estimated_deadline_days, status_ticket } = req.body;

    // Pega o ID do ticket da URL
    const ticketId = req.params.id;
    let fields = [];
    let params = [];

    // O n8n (OCR) vai atualizar o 'status_garantia'
    if (status_garantia) {
        fields.push("status_garantia = ?");
        params.push(status_garantia);
    }
    // O n8n (IA) vai atualizar o 'suggested_part_sku'
    if (suggested_part_sku) {
        fields.push("suggested_part_sku = ?");
        params.push(suggested_part_sku);
    }
    // O n8n (Estoque) vai atualizar o 'estimated_deadline_days'
    if (estimated_deadline_days) {
        fields.push("estimated_deadline_days = ?");
        params.push(estimated_deadline_days);
    }
    // O n8n podem atualizar o 'status_ticket'
    if (status_ticket) {
        fields.push("status_ticket = ?");
        params.push(status_ticket);
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum dado para atualizar foi fornecido.' });
    }

    params.push(ticketId); // Adiciona o ID ao final da lista de parâmetros

    const sql = `UPDATE Tickets SET ${fields.join(', ')} WHERE id = ?`;

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Erro ao atualizar ticket:', err.message);
            return res.status(500).json({ error: 'Erro interno ao atualizar o ticket.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }
        res.json({
            message: `Ticket ${ticketId} atualizado com sucesso.`,
            changes: this.changes
        });
    });
});

// -----------------------------------------------------------------
// 4. ENDPOINT: Processar o OCR (Versão de Download de URL Pública)
// -----------------------------------------------------------------
app.post('/api/process-ocr', async (req, res) => {
    
    // Agora recebemos 'nf_url' (que o Apps Script enviou)
    // O n8n deve enviar 'ticketId' e 'nf_url'
    const { ticketId, nf_url } = req.body;
    
    // Validação inicial
    if (!ticketId || !nf_url) {
        return res.status(400).json({ error: 'ticketId e nf_url são obrigatórios.' });
    }
    
    // Verifica se o Apps Script falhou
    if (nf_url === 'ERRO_DE_PERMISSAO_DRIVE') {
        return res.status(400).json({ error: 'O Apps Script falhou ao definir a permissão do Drive.' });
    }

    // --- LÓGICA DE CONVERSÃO DE URL DO GOOGLE DRIVE ---
    let downloadUrl = nf_url; 

    if (nf_url.includes('drive.google.com')) {
        try {
            // Regex que extrai o ID de "open?id=" OU "file/d/"
            const match = nf_url.match(/id=([a-zA-Z0-9_-]+)|file\/d\/([a-zA-Z0-9_-]+)/);
            const fileId = match[1] || match[2];
            
            if (fileId) {
                downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                console.log(`[API] URL do Google Drive convertida para: ${downloadUrl}`);
            }
        } catch (parseError) {
            console.error('[API] Falha ao parsear URL do Google Drive:', parseError.message);
            // Continua com a URL original se o parse falhar
        }
    }
    // --- FIM DA LÓGICA DE CONVERSÃO ---

    // 1. Baixar a imagem
    // (tempDir deve ser definido no topo do seu index.js: const tempDir = path.join(__dirname, 'temp');)
    const imagePath = path.join(tempDir, `nf-${ticketId}-${Date.now()}.png`);
    try {
        const response = await axios({
            method: 'GET',
            url: downloadUrl, // Usamos o link direto (convertido)
            responseType: 'stream',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
            }
        });
        
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                console.error('[API] Erro ao salvar stream no disco:', err);
                reject(err);
            });
        });

        console.log(`[API] Imagem para Ticket ${ticketId} baixada em: ${imagePath}`);

    } catch (downloadError) {
        console.error('[API] Erro ao baixar imagem:', downloadError.message);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        return res.status(500).json({ error: 'Falha ao baixar imagem da NF.' });
    }

    // 2. Chamar o Serviço de OCR (com try...catch para não quebrar o servidor)
    let dataExtraida;
    try {
        // Esta função deve ser do seu ocrService.js que lê um ARQUIVO (imagePath)
        dataExtraida = await processarNotaFiscal(imagePath); 
    } catch (ocrError) {
        console.error('[API] ERRO CRÍTICO NO TESSERACT:', ocrError.message);
        dataExtraida = 'Pendente'; 
        if (fs.existsSync(imagePath)) { // Garante que o arquivo seja apagado
            fs.unlinkSync(imagePath);
        }
    }
    
    console.log(`[API] Data recebida do OCR Service: ${dataExtraida}`);

    // 3. LÓGICA DE NEGÓCIO (CÁLCULO DE GARANTIA)
    let statusGarantia;
    let statusTicket;
    if (dataExtraida === 'Pendente') {
        statusGarantia = 'Pendente';
        statusTicket = 'Aguardando análise de atendente'; 
    } else {
        const partesData = dataExtraida.split('/');
        const dataEmissao = new Date(partesData[2], partesData[1] - 1, partesData[0]);
        const hoje = new Date();
        const diffTime = Math.abs(hoje - dataEmissao);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log(`[API] Dias desde a emissão: ${diffDays}`);
        
        // Sua regra de 180 dias
        statusGarantia = (diffDays <= 180) ? 'Sim' : 'Não';
        statusTicket = 'Em Análise';
    }

    // 4. Atualizar o ticket no banco de dados 
    const sql = `UPDATE Tickets SET status_garantia = ?, status_ticket = ? WHERE id = ?`;
    const params = [statusGarantia, statusTicket, ticketId];
    db.run(sql, params, function(err) {
        if (err) {
            console.error('[API] Erro ao atualizar ticket com OCR:', err.message);
            return res.status(500).json({ error: 'Erro interno ao atualizar o ticket pós-OCR.' });
        }
        res.json({
            message: `Ticket ${ticketId} processado pelo OCR.`,
            data_extraida: dataExtraida,
            status_garantia: statusGarantia
        });
    });
});


// -----------------------------------------------------------------
// Rota de teste 
app.get('/', (req, res) => {
    res.json({ message: 'API do CAF Connect está funcionando!' });
});
// -----------------------------------------------------------------

// Inicia o servidor e fica "escutando" na porta definida
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});