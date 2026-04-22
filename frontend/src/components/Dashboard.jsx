import { useState, useEffect, useRef } from 'react';
import { Search, Plus, LayoutGrid, List, FileAudio, Loader2 } from 'lucide-react';
import { extractFirstPageAsImage } from '../utils/pdfToImage';
import './Dashboard.css';

export default function Dashboard({ onScoreSelect }) {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' ou 'online'
  const [savedScores, setSavedScores] = useState([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  useEffect(() => {
    if (activeTab === 'online') {
      fetch('/api/scores')
        .then(res => res.json())
        .then(data => setSavedScores(data.scores || []))
        .catch(err => console.error("Erro ao buscar partituras:", err));
    }
  }, [activeTab]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          setIsProcessingAI(true);
          
          // 1. Extrair a primeira página do PDF como Imagem (PNG Blob)
          const imageBlob = await extractFirstPageAsImage(file);
          
          // 2. Preparar os dados para enviar para o Backend Python (Oemer API)
          const formData = new FormData();
          formData.append('file', imageBlob, 'page1.png');
          
          // 3. Fazer a requisição para a API
          const response = await fetch('http://127.0.0.1:8000/api/omr', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Erro na API Oemer: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.musicxml) {
            // 4. Criar um novo arquivo do tipo XML para passar pro ScoreViewer
            const musicXMLFile = new File([data.musicxml], file.name.replace('.pdf', '.musicxml'), { type: 'application/xml' });
            onScoreSelect(musicXMLFile);
          } else {
            throw new Error("Resposta inválida da API");
          }
          
        } catch (err) {
          console.error("Erro ao processar PDF via IA:", err);
          alert("Ocorreu um erro ao converter o PDF usando IA: " + err.message);
        } finally {
          setIsProcessingAI(false);
          // Limpa o input para poder selecionar o mesmo arquivo novamente
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } else {
        // Arquivo já é MusicXML, fluxo normal
        onScoreSelect(file);
      }
    }
  };

  const handleSavedScoreClick = async (fileName) => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}scores/${fileName}`);
      if (!response.ok) throw new Error("File not found");
      const text = await response.text();
      const file = new File([text], fileName, { type: 'application/xml' });
      onScoreSelect(file);
    } catch (err) {
      console.error("Erro ao carregar partitura salva:", err);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Partituras</h1>
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Pesquisar" className="search-input" />
        </div>
      </div>

      <div className="dashboard-tabs">
        <div className="tabs-left">
          <button className={`tab ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>Novo e recentes</button>
          <button className={`tab ${activeTab === 'online' ? 'active' : ''}`} onClick={() => setActiveTab('online')}>Minhas partituras online</button>
        </div>
        <div className="tabs-right">
          <button className="icon-btn active"><LayoutGrid size={16} /></button>
          <button className="icon-btn"><List size={16} /></button>
        </div>
      </div>

      <div className="scores-grid">
        {activeTab === 'recent' && (
          <div className="new-score-card" onClick={isProcessingAI ? undefined : triggerUpload} style={{ position: 'relative' }}>
            {isProcessingAI ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#6366f1' }}>
                <Loader2 size={48} strokeWidth={1} style={{ animation: 'spin 2s linear infinite' }} />
                <span className="new-score-label" style={{ color: '#6366f1' }}>A IA está lendo o PDF...</span>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                <div className="new-score-icon">
                  <Plus size={48} strokeWidth={1} />
                </div>
                <span className="new-score-label">Nova partitura (MusicXML / PDF)</span>
              </>
            )}
            <input 
              type="file" 
              accept=".musicxml,.xml,.mxl,.pdf" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isProcessingAI}
            />
          </div>
        )}
        
        {activeTab === 'online' && savedScores.map((scoreName, i) => (
          <div key={i} className="new-score-card saved-score-card" onClick={() => handleSavedScoreClick(scoreName)}>
            <div className="new-score-icon saved-score-icon">
              <FileAudio size={48} strokeWidth={1} />
            </div>
            <span className="new-score-label" title={scoreName}>{scoreName.length > 20 ? scoreName.substring(0, 18) + '...' : scoreName}</span>
          </div>
        ))}
        {activeTab === 'online' && savedScores.length === 0 && (
          <p className="empty-message" style={{color: '#9ca3af'}}>Nenhuma partitura salva ainda.</p>
        )}
      </div>
      
      <div className="dashboard-footer">
        <button className="footer-btn ghost">Gerenciador de partituras (online)</button>
        <div className="footer-actions">
          <button className="footer-btn primary" onClick={triggerUpload}>Novo</button>
          <button className="footer-btn secondary" onClick={triggerUpload}>Abrir outro...</button>
        </div>
      </div>
    </div>
  );
}
