import { useState } from 'react';
import { uploadDocument } from '../services/api';

export default function UploadComponent({ onUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const document = await uploadDocument(selectedFile);
      setSelectedFile(null);
      event.target.reset();
      onUploaded(document);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div>
        <p className="eyebrow">Novo documento</p>
        <h2 id="upload-title">Envie um arquivo para o acervo</h2>
        <p className="muted">O arquivo será salvo com segurança no armazenamento local.</p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker">
          <span>{selectedFile?.name || 'Escolher arquivo'}</span>
          <input
            type="file"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] || null);
              setError('');
            }}
          />
        </label>
        <button className="primary-button" type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>

      {error && <p className="error-message" role="alert">{error}</p>}
    </section>
  );
}