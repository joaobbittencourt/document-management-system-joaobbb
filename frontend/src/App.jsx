import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/api';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDocuments({ signal } = {}) {
    setIsLoading(true);
    setError('');

    try {
      const response = await listDocuments({ signal });
      setDocuments(response.documents);
    } catch (loadError) {
      if (loadError.name === 'AbortError') return;
      setError(loadError.message);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments({ signal: controller.signal });

    return () => controller.abort();
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
