import DownloadButton from './DownloadButton';

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  return (
    <section className="documents-panel" aria-labelledby="documents-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h2 id="documents-title">Documentos recentes</h2>
        </div>
        <span className="document-count">{documents.length} {documents.length === 1 ? 'item' : 'itens'}</span>
      </div>

      {isLoading && <p className="state-message">Carregando documentos...</p>}

      {!isLoading && error && (
        <div className="state-message error-state" role="alert">
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoading && !error && documents.length === 0 && (
        <p className="state-message">Nenhum documento enviado ainda.</p>
      )}

      {!isLoading && !error && documents.length > 0 && (
        <div className="document-table-wrapper">
          <table className="document-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tamanho</th>
                <th>Enviado em</th>
                <th><span className="visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td>
                    <strong>{document.originalName}</strong>
                    <span className="document-owner">Por {document.owner}</span>
                  </td>
                  <td>{formatSize(document.size)}</td>
                  <td>{formatDate(document.uploadedAt)}</td>
                  <td className="action-cell"><DownloadButton documentId={document.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}