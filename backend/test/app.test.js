const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('o fluxo de documentos valida upload, listagem e download', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  let uploadedDocument;
  const previousMimeTypes = process.env.ALLOWED_MIME_TYPES;

  try {
    const missingFileResponse = await fetch(`${baseUrl}/upload`, { method: 'POST' });
    assert.strictEqual(missingFileResponse.status, 400);

    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['conteudo de teste'], { type: 'text/plain' }),
      '../relatorio.txt',
    );

    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(uploadResponse.status, 201);
    uploadedDocument = await uploadResponse.json();
    assert.strictEqual(uploadedDocument.originalName, 'relatorio.txt');
    assert.strictEqual(uploadedDocument.owner, 'anonymous');

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(listResponse.status, 200);
    const listBody = await listResponse.json();
    assert.ok(listBody.documents.some((document) => document.id === uploadedDocument.id));
    assert.ok(!('storagePath' in listBody.documents[0]));

    const downloadResponse = await fetch(
      `${baseUrl}/documents/${uploadedDocument.id}/download`,
    );
    assert.strictEqual(downloadResponse.status, 200);
    assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');
    assert.match(
      downloadResponse.headers.get('content-disposition'),
      /relatorio\.txt/,
    );

    const invalidIdResponse = await fetch(`${baseUrl}/documents/not-a-uuid/download`);
    assert.strictEqual(invalidIdResponse.status, 400);

    process.env.ALLOWED_MIME_TYPES = 'application/pdf';
    const blockedFormData = new FormData();
    blockedFormData.append(
      'file',
      new Blob(['texto bloqueado'], { type: 'text/plain' }),
      'bloqueado.txt',
    );
    const blockedResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: blockedFormData,
    });
    assert.strictEqual(blockedResponse.status, 400);
    assert.strictEqual((await blockedResponse.json()).error.code, 'FILE_TYPE_NOT_ALLOWED');
  } finally {
    if (previousMimeTypes === undefined) {
      delete process.env.ALLOWED_MIME_TYPES;
    } else {
      process.env.ALLOWED_MIME_TYPES = previousMimeTypes;
    }

    if (uploadedDocument) {
      const storedDocument = documentRepository.findById(uploadedDocument.id);
      await fs.rm(storedDocument.storagePath, { force: true });
      documentRepository.remove(uploadedDocument.id);
    }

    await new Promise((resolve) => server.close(resolve));
  }
});
