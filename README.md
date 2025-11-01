# CAF - README

Breve descrição
---------------

Este repositório contém o backend (API) e o frontend (Next.js) do hackathon CAF. O objetivo do repositório é gerenciar tickets de atendimento, processar OCR de notas fiscais e fornecer uma interface web para acompanhamento.

Estrutura principal
-------------------

- `index.js` - servidor backend em Express (porta 3001). Fornece endpoints REST em `/api/*`, usa `sqlite3` para persistência e chama `ocrService.js` para processar imagens de notas fiscais.
- `database.js` - inicialização/abstração do banco SQLite.
- `ocrService.js` - lógica de OCR/Tesseract usada pelo backend.
- `por.traineddata` - dados de idioma para o Tesseract (se aplicável).
- `frontend/` - aplicação Next.js (desenvolvimento em `next dev`, porta 3000 por padrão).

Requisitos
----------

- Node.js e npm (versões compatíveis com as dependências listadas em `package.json`).
- `ngrok` (opcional, usado para expor temporariamente o backend na internet). Se não estiver instalado, o `run.sh` continuará sem criar o túnel.
- Terminal gráfico (`gnome-terminal`) ou `tmux` (opcional). O script `run.sh` tenta abrir novas janelas com `gnome-terminal`, cai para `tmux` se presente, e por fim executa processos em background escrevendo logs em `logs/`.

Como rodar (apenas usar `run.sh`)
---------------------------------

O projeto inclui um script na raiz chamado `run.sh` que inicia automaticamente o backend, o `ngrok` e o frontend. Para rodar tudo usando o script:

1. Dê permissão executável (apenas da primeira vez):

```bash
chmod +x run.sh
```

2. Execute o script (isto inicia backend, ngrok e frontend):

```bash
./run.sh
```

Notas rápidas:

- O backend roda na porta 3001 (conforme `index.js`).
- O frontend (Next.js) roda na porta 3000 no modo de desenvolvimento.
- O `ngrok` é invocado com `ngrok http 3001` quando `ngrok` está disponível no PATH; caso contrário o script apenas avisa e continua.
- Logs são gravados em `logs/` (`backend.log`, `ngrok.log`, `frontend.log`) quando os processos são executados em background.




