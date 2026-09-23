import { getDownloadUrl } from '../services/api';

export default function DownloadButton({ documentId }) {
  return (
    <a
      className="download-button"
      href={getDownloadUrl(documentId)}
      download
    >
      Baixar
    </a>
  );
}