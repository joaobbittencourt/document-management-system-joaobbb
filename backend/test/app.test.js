const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

function startTestServer() {
  const server = app.listen(0);
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function createTextFileFormData(content = 'conteudo de teste', filename = 'relatorio.txt') {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: 'text/plain' }), filename);
  return formData;
}

async function uploadTestDocument(baseUrl, content = 'conteudo de teste') {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createTextFileFormData(content),
  });

  assert.strictEqual(response.status, 201);
  return response.json();
}

async function removeStoredDocument(documentId) {
  const storedDocument = documentRepository.findById(documentId);

  if (storedDocument) {
    await fs.rm(storedDocument.storagePath, { force: true });
    documentRepository.remove(documentId);
  }
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('POST /upload cria metadados para um documento enviado', async () => {
  const server = startTestServer();
  let uploadedDocument;

  try {
    uploadedDocument = await uploadTestDocument(server.baseUrl);

    assert.match(uploadedDocument.id, /^[0-9a-f-]{36}$/i);
    assert.strictEqual(uploadedDocument.originalName, 'relatorio.txt');
    assert.strictEqual(uploadedDocument.owner, 'anonymous');
    assert.strictEqual(uploadedDocument.size, 17);
    assert.ok(uploadedDocument.uploadedAt);
    assert.ok(!('storagePath' in uploadedDocument));
    assert.ok(!('storageName' in uploadedDocument));
    assert.ok(!('mimeType' in uploadedDocument));
  } finally {
    if (uploadedDocument) {
      await removeStoredDocument(uploadedDocument.id);
    }

    await server.close();
  }
});

test('POST /upload retorna erro quando nenhum arquivo é enviado', async () => {
  const server = startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/upload`, { method: 'POST' });

    assert.strictEqual(response.status, 400);
    assert.strictEqual((await response.json()).error.code, 'FILE_REQUIRED');
  } finally {
    await server.close();
  }
});

test('POST /upload rejeita tipos de arquivo fora da configuração', async () => {
  const server = startTestServer();
  const previousMimeTypes = process.env.ALLOWED_MIME_TYPES;

  try {
    process.env.ALLOWED_MIME_TYPES = 'application/pdf';
    const response = await fetch(`${server.baseUrl}/upload`, {
      method: 'POST',
      body: createTextFileFormData('texto bloqueado', 'bloqueado.txt'),
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual((await response.json()).error.code, 'FILE_TYPE_NOT_ALLOWED');
  } finally {
    if (previousMimeTypes === undefined) {
      delete process.env.ALLOWED_MIME_TYPES;
    } else {
      process.env.ALLOWED_MIME_TYPES = previousMimeTypes;
    }

    await server.close();
  }
});

test('GET /documents lista documentos sem detalhes internos de armazenamento', async () => {
  const server = startTestServer();
  let uploadedDocument;

  try {
    uploadedDocument = await uploadTestDocument(server.baseUrl);

    const response = await fetch(`${server.baseUrl}/documents`);
    const body = await response.json();
    const listedDocument = body.documents.find((document) => document.id === uploadedDocument.id);

    assert.strictEqual(response.status, 200);
    assert.ok(listedDocument);
    assert.strictEqual(listedDocument.originalName, 'relatorio.txt');
    assert.ok(!('storagePath' in listedDocument));
    assert.ok(!('storageName' in listedDocument));
    assert.ok(!('mimeType' in listedDocument));
  } finally {
    if (uploadedDocument) {
      await removeStoredDocument(uploadedDocument.id);
    }

    await server.close();
  }
});

test('GET /documents/:id/download baixa o conteúdo original do documento', async () => {
  const server = startTestServer();
  let uploadedDocument;

  try {
    uploadedDocument = await uploadTestDocument(server.baseUrl, 'arquivo para download');

    const response = await fetch(`${server.baseUrl}/documents/${uploadedDocument.id}/download`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(await response.text(), 'arquivo para download');
    assert.match(response.headers.get('content-disposition'), /relatorio\.txt/);
  } finally {
    if (uploadedDocument) {
      await removeStoredDocument(uploadedDocument.id);
    }

    await server.close();
  }
});

test('GET /documents/:id/download valida identificadores inválidos', async () => {
  const server = startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/documents/not-a-uuid/download`);

    assert.strictEqual(response.status, 400);
    assert.strictEqual((await response.json()).error.code, 'INVALID_DOCUMENT_ID');
  } finally {
    await server.close();
  }
});
