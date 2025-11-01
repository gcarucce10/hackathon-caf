// Importa driver do SQLite3
const sqlite3 = require('sqlite3').verbose();

// Define o nome do arquivo do banco de dados
const DB_SOURCE = "caf_connect.db";

// SQL para criar a tabela de Tickets 
const SQL_CREATE_TICKETS_TABLE = `
    CREATE TABLE IF NOT EXISTS Tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT,
        client_contact TEXT,

        -- COLUNAS DE STATUS ATUALIZADAS CONFORME SUA SOLICITAÇÃO
        status_ticket TEXT DEFAULT 'Novo',         -- Ex: 'Novo', 'Aguardando análise de atendente', 'Resolvido'
        status_garantia TEXT DEFAULT 'Pendente',   -- Ex: 'Pendente', 'Sim', 'Não'
        atendimento_tipo TEXT DEFAULT 'automático', -- Ex: 'automático', 'atendente'

        -- DEMAIS CAMPOS
        raw_description TEXT,
        nf_url TEXT,
        suggested_part_sku TEXT,
        estimated_deadline_days INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

// Função que inicializa o banco de dados e cria tabela "Tickets"
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
        throw err;
    } else {
        console.log("Conectado ao banco de dados SQLite.");

        // Cria a tabela de Tickets se não existir
        db.run(SQL_CREATE_TICKETS_TABLE, (err) => {
            if (err) {
                // Erro ao criar a tabela Tickets
                console.error("Erro ao criar tabela Tickets:", err.message);
            } else {
                console.log("Tabela \"Tickets\" criada ou já existente.");
            }
        });
    }
});

// Exporta o objeto db para uso em outros módulos (arquivos)
module.exports = db;