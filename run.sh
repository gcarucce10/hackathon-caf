#!/usr/bin/env bash
# run.sh - script para iniciar backend, ngrok e frontend do projeto CAF
# Uso: ./run.sh
# (Não se esqueça de dar permissão: chmod +x run.sh)

set -o errexit -o pipefail

# ============================================
# CAF - PÓS-VENDA IA - SCRIPT DE INICIALIZAÇÃO
# ============================================

echo "🚀 Iniciando Solução de Pós-Venda da CAF..."

# 💠 Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ⏯️ PIDs dos processos em background
BACKEND_PID=""
FRONTEND_PID=""
NGROK_PID=""

# 🛑 Função de Limpeza (para Ctrl+C)
cleanup() {
    echo -e "\n${RED}🛑 Parando serviços...${NC}"
    # Mata os PIDs que este script iniciou
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    [ -n "$NGROK_PID" ] && kill "$NGROK_PID" 2>/dev/null || true
    
    # Garante que qualquer processo zumbi do node/ngrok seja morto
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "ngrok http 3001" 2>/dev/null || true
    pkill -f "npm --prefix frontend run dev" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Serviços parados!${NC}"
    exit 0
}

# Captura os sinais de interrupção (Ctrl+C) e chama a função de limpeza
trap cleanup SIGINT SIGTERM

# 🔍 Verifica dependências
echo -e "${BLUE}🔍 Verificando dependências básicas...${NC}"
command -v node >/dev/null || { echo -e "${RED}❌ Node.js não encontrado${NC}"; exit 1; }
command -v npm >/dev/null || { echo -e "${RED}❌ npm não encontrado${NC}"; exit 1; }
command -v ngrok >/dev/null || { echo -e "${RED}❌ ngrok não encontrado${NC}"; exit 1; }

# 🚪 Portas
BACKEND_PORT=3001
FRONTEND_PORT=3000 # Assumindo a porta padrão para o frontend

# 📁 Logs
LOG_DIR="$(pwd)/logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
NGROK_LOG="$LOG_DIR/ngrok.log"

# Limpa logs antigos
> "$BACKEND_LOG"
> "$FRONTEND_LOG"
> "$NGROK_LOG"

echo -e "${BLUE}ℹ️ Logs serão salvos em: $LOG_DIR${NC}"

# 📦 Configura o backend (na pasta atual)
echo -e "${BLUE}📦 Verificando dependências do backend...${NC}"
[ ! -d "node_modules" ] && { echo -e "${YELLOW}💡 Instalando dependências do backend...${NC}"; npm install; }

# 🚀 Inicia backend
echo -e "${GREEN}🚀 Iniciando backend na porta $BACKEND_PORT...${NC}"
npm start &> "$BACKEND_LOG" &
BACKEND_PID=$!

echo -e "${YELLOW}⏳ Aguardando backend inicializar...${NC}"
for i in {1..10}; do
    if curl -s --connect-timeout 2 "http://127.0.0.1:$BACKEND_PORT/" > /dev/null; then
        echo -e "${GREEN}✅ Backend ativo em http://127.0.0.1:$BACKEND_PORT${NC}"
        break
    fi
    echo -e "${YELLOW}Tentativa $i/10...${NC}"
    sleep 2
done
! kill -0 "$BACKEND_PID" 2>/dev/null && { echo -e "${RED}❌ Backend falhou ao iniciar! Verifique $BACKEND_LOG${NC}"; exit 1; }


# 🌐 Inicia ngrok
echo -e "${GREEN}🚀 Iniciando ngrok para expor a porta $BACKEND_PORT...${NC}"
ngrok http "$BACKEND_PORT" &> "$NGROK_LOG" &
NGROK_PID=$!

echo -e "${YELLOW}⏳ Aguardando URL pública do ngrok...${NC}"
NGROK_URL=""
for i in {1..10}; do
    # Tenta extrair a URL pública da API do ngrok (que roda na porta 4040)
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d '"' -f 4 | grep 'ngrok-free.dev')
    if [ -n "$NGROK_URL" ]; then
        echo -e "${GREEN}✅ ngrok ativo!${NC}"
        break
    fi
    sleep 1
done
[ -z "$NGROK_URL" ] && { echo -e "${RED}❌ ngrok falhou ao iniciar! Verifique $NGROK_LOG${NC}"; exit 1; }


# 🧭 Configura o frontend (na subpasta ./frontend)
if [ ! -d "frontend" ]; then
    echo -e "${YELLOW}⚠️ Diretório 'frontend' não encontrado. Pulando inicialização do frontend.${NC}"
else
    echo -e "${BLUE}📦 Verificando dependências do frontend...${NC}"
    [ ! -d "frontend/node_modules" ] && { echo -e "${YELLOW}💡 Instalando dependências do frontend...${NC}"; npm --prefix frontend install; }

    echo -e "${GREEN}🚀 Iniciando frontend na porta $FRONTEND_PORT...${NC}"
    npm --prefix frontend run dev &> "$FRONTEND_LOG" &
    FRONTEND_PID=$!

    echo -e "${YELLOW}⏳ Aguardando frontend inicializar...${NC}"
    for i in {1..10}; do
        if curl -s --connect-timeout 2 "http://127.0.0.1:$FRONTEND_PORT/" > /dev/null; then
            echo -e "${GREEN}✅ Frontend ativo em http://localhost:$FRONTEND_PORT${NC}"
            break
        fi
        echo -e "${YELLOW}Tentativa $i/10...${NC}"
        sleep 2
    done
fi


# ✅ Final
echo -e "\n${GREEN}🎉 APLICAÇÃO INICIADA COM SUCESSO!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
[ -n "$FRONTEND_PID" ] && echo -e "${GREEN}🖥️  Frontend (UI):${NC} http://localhost:$FRONTEND_PORT"
echo -e "${GREEN}⚙️  Backend (API Local):${NC} http://127.0.0.1:$BACKEND_PORT"
echo -e "${GREEN}🌍  Backend (Público p/ n8n):${NC} ${YELLOW}$NGROK_URL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💡 Pressione Ctrl+C para parar tudo${NC}"

# 📎 Abre navegador (opcional)
command -v xdg-open >/dev/null && xdg-open "http://localhost:$FRONTEND_PORT" &

# 🔄 Mantém o script ativo e monitora os serviços
while true; do
    ! kill -0 "$BACKEND_PID" 2>/dev/null && { echo -e "${RED}❌ Backend caiu! Verifique $BACKEND_LOG${NC}"; cleanup; }
    [ -n "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null && { echo -e "${RED}❌ Frontend caiu! Verifique $FRONTEND_LOG${NC}"; cleanup; }
    [ -n "$NGROK_PID" ] && ! kill -0 "$NGROK_PID" 2>/dev/null && { echo -e "${RED}❌ ngrok caiu! Verifique $NGROK_LOG${NC}"; cleanup; }
    sleep 5
done