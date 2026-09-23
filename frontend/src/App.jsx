import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/api';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDocuments() {
    setIsLoading(true);
    setError('');

    try {
      const response = await listDocuments();
      setDocuments(response.documents);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [document, ...currentDocuments]);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DMS / Arquivo local</p>
          <h1>Seu espaço para documentos.</h1>
          <p className="intro">Envie, organize e recupere seus arquivos em um só lugar.</p>
        </div>
        <span className="status-mark" aria-label="Sistema disponível">Online</span>
      </header>

      <div className="content-stack">
        <UploadComponent onUploaded={handleUploaded} />
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          error={error}
          onRetry={loadDocuments}
        />
      </div>
    </main>
  );
}
