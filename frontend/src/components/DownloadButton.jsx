import { useState } from 'react';
import { downloadDocument } from '../services/api';

export default function DownloadButton({ documentId, fileName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');

    try {
      const { blob, contentDisposition } = await downloadDocument(documentId);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const suggestedName = contentDisposition.match(/filename="([^"]+)"/)?.[1] || fileName;

      anchor.href = objectUrl;
      anchor.download = suggestedName || 'documento';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <span className="download-action">
      <button
        className="download-button"
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </span>
  );
}