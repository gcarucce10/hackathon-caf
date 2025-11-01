import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

# --- 1. A URL Base ---
URL_PRODUTOS = "https://cafmaquinas.com.br/produtos"

def raspar_catalogo_com_selenium():
    print("Iniciando o navegador 'robô' (Selenium)...")
    
    # --- 2. Configura o "robô" (Selenium) ---
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    print(f"Acessando {URL_PRODUTOS} e aguardando os 15 produtos...")

    try:
        # --- 3. Abre a página e ESPERA os 15 iniciais ---
        driver.get(URL_PRODUTOS)
        
        # Espera ATÉ 15 segundos para que os "product-card" apareçam
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, "product-card"))
        )
        print("Produtos carregados! Lendo o HTML...")

        # --- 4. Pega o HTML COMPLETO (depois do JS) ---
        html_completo = driver.page_source
        
        # --- 5. Agora o BeautifulSoup funciona! ---
        soup = BeautifulSoup(html_completo, "html.parser")

        # --- 6. ENCONTRA OS PRODUTOS (o código que você descobriu) ---
        cards_de_produto = soup.find_all("a", class_="product-card")
        
        if not cards_de_produto:
            print("\n!!! ATENÇÃO: Nenhum 'product-card' foi encontrado. !!!")
            return

        print(f"Sucesso! Encontrados {len(cards_de_produto)} produtos.")
        
        catalogo_caf = []
        for i, card in enumerate(cards_de_produto):
            
            nome_html = card.find("h2")
            nome_produto = nome_html.get_text(strip=True) if nome_html else ""

            desc_html = card.find("p")
            descricao = desc_html.get_text(strip=True) if desc_html else ""

            if nome_produto:
                catalogo_caf.append({
                    "id": f"caf_prod_{i+1:03d}",
                    "nome": nome_produto,
                    "desc": descricao
                })

        # --- 7. Salva no JSON ---
        with open("catalogo_caf.json", "w", encoding="utf-8") as f:
            json.dump(catalogo_caf, f, indent=2, ensure_ascii=False)
            
        print(f"\nArquivo 'catalogo_caf.json' criado com {len(catalogo_caf)} produtos.")

    except Exception as e:
        print(f"Ocorreu um erro durante a execução do Selenium: {e}")
    finally:
        # --- 8. Fecha o navegador "robô" ---
        driver.quit()
        print("Navegador 'robô' fechado.")

if __name__ == "__main__":
    raspar_catalogo_com_selenium()