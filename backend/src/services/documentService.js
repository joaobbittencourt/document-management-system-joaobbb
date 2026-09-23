const crypto = require('node:crypto');
const fs = require('node:fs/promises');

const documentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  async upload(file, owner = process.env.DEFAULT_OWNER || 'anonymous') {
    if (!file) {
      const error = new Error('Um arquivo é obrigatório.');
      error.code = 'FILE_REQUIRED';
      throw error;
    }

    const metadata = {
      id: crypto.randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      storageName: file.filename,
      storagePath: file.path,
      mimeType: file.mimetype,
    };

    try {
      return this.documentRepository.create(metadata);
    } catch (error) {
      await fs.rm(file.path, { force: true });
      error.code = 'METADATA_ERROR';
      throw error;
    }
  }

  list() {
    return this.documentRepository
      .findAll()
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
      .map((document) => this.toPublicMetadata(document));
  }

  async getDownload(id) {
    if (!documentIdPattern.test(id)) {
      const error = new Error('Identificador de documento inválido.');
      error.code = 'INVALID_DOCUMENT_ID';
      throw error;
    }

    const document = this.documentRepository.findById(id);

    if (!document) {
      const error = new Error('Documento não encontrado.');
      error.code = 'DOCUMENT_NOT_FOUND';
      throw error;
    }

    if (!this.documentRepository.isPathInsideStorage(document.storagePath)) {
      const error = new Error('Arquivo do documento não encontrado.');
      error.code = 'FILE_NOT_FOUND';
      throw error;
    }

    try {
      await fs.access(document.storagePath);
    } catch {
      const error = new Error('Arquivo do documento não encontrado.');
      error.code = 'FILE_NOT_FOUND';
      throw error;
    }

    return document;
  }

  getDownloadName(document) {
    const name = document.originalName
      .replace(/[\r\n"]/g, '_')
      .split(/[\\/]/)
      .pop();
    return name || 'document';
  }

  toPublicMetadata(document) {
    const { storageName, storagePath, mimeType, ...publicMetadata } = document;
    return publicMetadata;
  }
}

module.exports = DocumentService;