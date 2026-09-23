const API_PREFIX = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = body?.error?.message || 'Não foi possível concluir a operação.';
    const error = new Error(message);
    error.code = body?.error?.code;
    error.status = response.status;
    throw error;
  }

  return body;
}

export function listDocuments() {
  return request('/documents');
}

export function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  return request('/upload', {
    method: 'POST',
    body: formData,
  });
}

export function getDownloadUrl(documentId) {
  return `${API_PREFIX}/documents/${encodeURIComponent(documentId)}/download`;
}