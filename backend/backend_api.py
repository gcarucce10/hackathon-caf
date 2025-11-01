import chromadb
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import string

# --- PASSO 0.1: CONFIGURAR SINÔNIMOS ---
DICIONARIO_SINONIMOS = {
    "faca": "cruzeta",
    "facão": "cruzeta",
    "lâmina": "cruzeta",
    "estrela": "cruzeta",
    "saco": "ensacadeira",
    "linguiça": "ensacadeira",
    "tripa": "ensacadeira",
    "embutido": "ensacadeira",
    "peneira": "disco",
    "ralador": "disco",
    "chapa": "disco",
    "empurrador": "soquete",
}
# Remove pontuação
translator = str.maketrans('', '', string.punctuation)

# --- PASSO 0.2: CARREGAR CATÁLOGO ---
print("Carregando catálogo do arquivo 'catalogo_caf.json'...")
try:
    with open("catalogo_caf.json", "r", encoding="utf-8") as f:
        catalogo_caf = json.load(f) 
except FileNotFoundError:
    print("ERRO: Arquivo 'catalogo_caf.json' não encontrado.")
    print("Por favor, rode o script 'scraper.py' primeiro!")
    exit() 

# Prepara dados para IA Semântica (ChromaDB)
documentos = [f"{item['nome']}: {item.get('desc', '')}" for item in catalogo_caf]
ids_produtos = [item['id'] for item in catalogo_caf]
metadados_catalogo = [{"id_produto": item['id'], "nome": item['nome']} for item in catalogo_caf]
id_para_metadado = {meta['id_produto']: meta for meta in metadados_catalogo}

# --- PASSO 1: CONFIGURAR IA SEMÂNTICA (ChromaDB) ---
print("Carregando o modelo de IA (pode demorar na 1ª vez)...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2', device='cpu')
client = chromadb.Client()
try:
    collection = client.create_collection(name="produtos_caf")
except chromadb.errors.UniqueConstraintError:
    client.delete_collection(name="produtos_caf")
    collection = client.create_collection(name="produtos_caf")
print("Calculando 'coordenadas' (embeddings) para o catálogo...")

# --- PASSO 2: A "INDEXAÇÃO" SEMÂNTICA ---
embeddings = model.encode(documentos)
collection.add(
    embeddings=embeddings.tolist(),
    documents=documentos,
    metadatas=metadados_catalogo, 
    ids=ids_produtos
)
print(f"--- Catálogo com {len(catalogo_caf)} produtos indexado. API pronta! ---")

# --- PASSO 3: A API (Flask) ---
app = Flask(__name__)
CORS(app) 

@app.route('/buscar', methods=['GET'])
def buscar():
    termo_busca = request.args.get('termo')
    if not termo_busca:
        return jsonify({"erro": "Termo de busca não fornecido"}), 400

    print(f"Recebida busca HÍBRIDA 5.0 (Simples Keyword-First) por: '{termo_busca}'")
    
    # --- ETAPA 1: BUSCA POR KEYWORD (SUBSTRING) ---
    
    # 1. Limpa a busca e cria termos
    termo_busca_lower = termo_busca.lower().translate(translator)
    termos_para_buscar = set()
    
    # Adiciona o termo original e suas variações de plural/singular
    termos_busca_split = termo_busca_lower.split()
    for termo in termos_busca_split:
        termos_para_buscar.add(termo)
        if termo.endswith('s'):
            termos_para_buscar.add(termo[:-1]) # "ensacadeiras" -> "ensacadeira"
        else:
            termos_para_buscar.add(termo + 's') # "saco" -> "sacos"

    # 2. Adiciona Sinônimos (e seus plurais)
    termos_sinonimos = set()
    for termo in termos_para_buscar:
        termo_singular = termo[:-1] if termo.endswith('s') else termo
        if termo_singular in DICIONARIO_SINONIMOS:
            sinonimo = DICIONARIO_SINONIMOS[termo_singular] # "ensacadeira"
            termos_sinonimos.add(sinonimo)
            termos_sinonimos.add(sinonimo + 's')
    
    termos_para_buscar.update(termos_sinonimos)
            
    print(f"Etapa 1: Buscando por substrings: {termos_para_buscar}")
    
    # 3. Itera pelo catálogo e checa por SUBSTRING ('in')
    ids_encontrados_keyword = set()
    for item in catalogo_caf:
        texto_completo = (item.get('nome', '') + " " + item.get('desc', '')).lower()
        item_id = item['id']
        
        # A Mágica: "if any(termo in texto_completo...)"
        if any(termo in texto_completo for termo in termos_para_buscar):
            ids_encontrados_keyword.add(item_id)

    # --- A LÓGICA "KEYWORD-FIRST" ---
    if ids_encontrados_keyword:
        print(f"Etapa 1 (Keyword) teve SUCESSO. Retornando {len(ids_encontrados_keyword)} resultados.")
        resultados_etapa_1 = [id_para_metadado[item_id] for item_id in ids_encontrados_keyword]
        
        return jsonify({
            "resultados": resultados_etapa_1,
            "distancias": [] 
        })
    
    # --- ETAPA 2: BUSCA SEMÂNTICA (IA) - SÓ RODA SE A ETAPA 1 FALHAR ---
    print("Etapa 1 não encontrou nada. Executando Etapa 2 (Semântica)...")
    try:
        query_embedding = model.encode(termo_busca)
        results_semantica = collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=3 
        )
        resultados_etapa_2 = results_semantica['metadatas'][0]
        print(f"Etapa 2 (Semântica) encontrou {len(resultados_etapa_2)} resultados.")
        
        return jsonify({
            "resultados": resultados_etapa_2,
            "distancias": [] 
        })
            
    except Exception as e:
        print(f"Erro na busca semântica: {e}")
        return jsonify({"erro": "Falha na busca semântica", "resultados": [], "distancias": []}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)