# 🚀 Projeto de Busca Inteligente - Hackathon CAF Máquinas

## 🎯 O Desafio

Este protótipo foi desenvolvido para o hackathon da CAF Máquinas com o objetivo de resolver um problema crítico do e-commerce atual da empresa: **a falha na busca de produtos por nomes não-técnicos.**

Atualmente, um cliente que busca por "faca" (um termo popular) não encontra o produto "Cruzeta" (o termo técnico). Isso resulta em perda de vendas, frustração do cliente e aumento da carga de suporte.

## 💡 A Solução: Busca Híbrida "Keyword-First"

Em vez de uma busca simples, implementamos um **motor de busca híbrido** que combina o melhor de dois mundos: precisão e inteligência.

Nosso algoritmo funciona em duas etapas, seguindo a lógica "Keyword-First":

1.  **Etapa 1: Busca por Palavra-Chave (Precisa e Rápida)**
    * O sistema verifica se o termo buscado (ex: "ensacad", "ensacadeiras") existe no nome ou descrição dos produtos.
    * **Tratamento de Plural/Singular:** Busca por "saco" e "sacos" automaticamente.
    * **Dicionário de Sinônimos:** Entende que "faca", "lâmina" e "facão" são sinônimos de "cruzeta".
    * **Resultado:** Se resultados precisos são encontrados, eles são retornados *imediatamente*.

2.  **Etapa 2: Busca Semântica (IA - Conceitual)**
    * **Somente se a Etapa 1 falhar** (ou seja, o usuário não sabe o nome), a IA é ativada.
    * O modelo (`Sentence-Transformers`) entende o *conceito* da busca.
    * Uma busca por "equipamento para meu açougue" ou "para supermercado" retornará "Moedores", mesmo que essas palavras não estejam na descrição.

## ✨ Funcionalidades

* **Frontend Moderno:** Interface de busca limpa, centralizada e com a identidade visual da CAF.
* **Web Scraper:** Um script (`scraper.py`) que usa Selenium para extrair o catálogo de produtos *real* do site da CAF, lidando com carregamento dinâmico de JavaScript.
* **API Híbrida:** Backend em Flask que serve o motor de busca híbrido.
* **Dicionário de Sinônimos:** Mapeia termos populares para termos técnicos, resolvendo a dor principal do cliente.
* **Busca Semântica:** Permite que clientes encontrem produtos descrevendo *o que eles precisam*, não apenas *o que eles sabem*.

## 🛠️ Stack de Tecnologias

| Área | Tecnologias Utilizadas |
| :--- | :--- |
| **Backend** | Python, Flask, Selenium, ChromaDB, Sentence-Transformers, BeautifulSoup4 |
| **Frontend** | React (Vite), CSS Puro |
| **Extra** | `webdriver-manager` |

## 📦 Como Rodar o Projeto

Este projeto é dividido em `backend` e `frontend` e precisa de **dois terminais** rodando simultaneamente.

### 1. Backend (API de Busca)

1.  Navegue até a pasta `backend/`:
    ```bash
    cd backend
    ```
2.  Crie e ative um ambiente virtual (venv):
    ```bash
    # Criar
    python -m venv venv
    # Ativar (Linux/Mac)
    source venv/bin/activate
    # Ativar (Windows)
    .\venv\Scripts\activate
    ```
3.  Instale todas as dependências:
    ```bash
    pip install flask flask-cors sentence-transformers chromadb selenium webdriver-manager beautifulsoup4 requests
    ```
4.  **(Rodar apenas 1 vez)** Execute o Web Scraper para criar o catálogo:
    * *Este script vai abrir um navegador "robô" (Selenium), carregar os produtos e salvar o `catalogo_caf.json`.*
    ```bash
    python scraper.py
    ```
5.  Inicie a API:
    ```bash
    python backend_api.py
    ```
    * O backend estará rodando em `http://127.0.0.1:5000`.

### 2. Frontend (O Site)

1.  Abra um **novo terminal**.
2.  Navegue até a pasta `frontend/`:
    ```bash
    cd frontend
    ```
3.  **Atenção:** Certifique-se de ter o `logo-caf.png` (ou o nome que você usou) salvo na pasta `frontend/src/`.

4.  Instale as dependências (apenas 1 vez):
    ```bash
    npm install
    ```
5.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    * O frontend estará rodando em `http://localhost:5173` (ou similar).

6.  Abra `http://localhost:5173` no seu navegador para ver o protótipo!

## 🔮 Roadmap (Próximos Passos)

A Busca Inteligente é a **Fase 1** da transformação digital. O plano completo para resolver as dores da CAF inclui:

* **Fase 2: Motor de Triagem e SLA:** Atacar o problema dos 30 dias de espera no suporte. Criar um sistema (com n8n) que recebe o formulário de defeito, classifica a **Prioridade (P1, P2, P3)** e envia um **Prazo (SLA)** imediato para o cliente.
* **Fase 3: Portal de Garantia:** Um sistema de autoatendimento onde o cliente digita o número da Nota Fiscal e o sistema (integrado ao ERP) valida instantaneamente se o produto está na garantia, sem precisar de um atendente.

## 👥 Autores

Lucas Arruda Cazetto
Gabriel Freitas Carucce