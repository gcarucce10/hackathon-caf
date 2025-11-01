import { useState } from 'react';
import './App.css'; 
// Lembre-se de usar o nome do seu logo aqui
import LogoCAF from './logo-black.png'; 

function App() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState([]);
  const [status, setStatus] = useState('pronto'); 

  const realizarBusca = async () => {
    if (!termo) return; 
    setStatus('buscando');
    setResultados([]); 

    try {
      const response = await fetch(`http://127.0.0.1:5000/buscar?termo=${encodeURIComponent(termo)}`);
      if (!response.ok) {
        throw new Error('Erro na API. O backend está rodando?');
      }
      const data = await response.json();
      setResultados(data.resultados || []);
      setStatus('pronto');
    } catch (error) {
      console.error(error);
      setStatus('erro');
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === 'Enter') {
      realizarBusca();
    }
  };

  return (
    <main className="app-wrapper">
      <div className="card-container">
        
        <img src={LogoCAF} alt="Logo CAF Máquinas" className="logo" />
        
        <h1>Busca Inteligente CAF</h1>
        
        {/* --- SUBTÍTULO REMOVIDO DAQUI --- */}
        
        <div className="search-box">
          <input 
            type="text" 
            id="barraBusca" 
            placeholder="Digite aqui: faca, ensacadeiras, supermercado..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyUp={handleKeyUp}
          />
          <button id="botaoBusca" onClick={realizarBusca} disabled={status === 'buscando'}>
            {status === 'buscando' ? '...' : 'Buscar'}
          </button>
        </div>

        <div id="resultados">
          {status === 'erro' && (
            <p className="status-text erro">Erro ao conectar com a API. Verifique o backend.</p>
          )}
          {resultados.length > 0 && (
            <div className="resultados-header">
              Exibindo {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}:
            </div>
          )}
          {resultados.length > 0 && resultados.map((item, index) => (
            <div className="resultado-item" key={item.id_produto}>
              <h3>{item.nome}</h3>
              <p>ID: {item.id_produto}</p>
            </div>
          ))}
          {resultados.length === 0 && status === 'pronto' && termo !== '' && (
            <p className="status-text">Nenhum resultado encontrado para "{termo}".</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;