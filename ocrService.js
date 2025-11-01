const { createWorker } = require('tesseract.js');
const fs = require('fs'); 

/**
 * Processa um ARQUIVO DE IMAGEM e extrai A DATA DE EMISSÃO.
 * @param {string} imagePath - O caminho local para o arquivo de imagem (ex: 'temp/nf-123.png')
 * @returns {Promise<string>} Uma string da data (ex: "22/10/2025") ou "Pendente" se falhar.
 */
async function processarNotaFiscal(imagePath) {
    console.log(`[OCR Service] Iniciando processamento (PÁGINA INTEIRA) para: ${imagePath}`);
    
    const worker = await createWorker('por');
    let textoExtraido = '';
    
    try {
        // 2. Reconhece o texto do CAMINHO DO ARQUIVO (imagePath)
        const { data: { text } } = await worker.recognize(imagePath);
        
        textoExtraido = text.trim();

    } catch (error) {
        console.error('[OCR Service] Erro ao reconhecer imagem:', error.message);
        return 'Pendente'; 
    
    } finally {
        await worker.terminate();
        // 4. Apaga o arquivo temporário
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        console.log(`[OCR Service] Arquivo temporário ${imagePath} removido.`);
    }

    // 5. O "Algoritmo" (Regex)
    const regexData = /(\d{2})\/(\d{2})\/(\d{4})/;
    const match = textoExtraido.match(regexData);

    if (!match) {
        console.log('[OCR Service] Formato de data não reconhecido no texto completo.');
        return 'Pendente';
    }

    console.log(`[OCR Service] Data extraída (primeira ocorrência): ${match[0]}`);
    return match[0];
}

module.exports = { processarNotaFiscal };