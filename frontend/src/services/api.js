const API_PREFIX = '/api';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json')
    ? response.json()
    : response.text();
}

function createApiError(body, status) {
  const message = body?.error?.message || 'Não foi possível concluir a operação.';
  const error = new Error(message);
  error.code = body?.error?.code;
  error.status = status;
  return error;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);
  const body = await parseResponse(response);

  if (!response.ok) {
    throw createApiError(body, response.status);
  }

  return body;
}

export function listDocuments(options = {}) {
  return request('/documents', options).then((body) => {
    if (!body || !Array.isArray(body.documents)) {
      throw new Error('A resposta da lista de documentos é inválida.');
    }
    return body;
  });
}

export function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  return request('/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function downloadDocument(documentId) {
  const response = await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(documentId)}/download`,
  );

  if (!response.ok) {
    throw createApiError(await parseResponse(response), response.status);
  }

  return {
    blob: await response.blob(),
    contentDisposition: response.headers.get('content-disposition') || '',
  };
}