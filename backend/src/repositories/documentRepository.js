const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const documents = new Map();
const defaultMaxFileSize = 10 * 1024 * 1024;

function getMaxFileSize() {
  const configuredSize = Number(process.env.MAX_FILE_SIZE_BYTES);
  return Number.isFinite(configuredSize) && configuredSize > 0
    ? configuredSize
    : defaultMaxFileSize;
}

function getAllowedMimeTypes() {
  return (process.env.ALLOWED_MIME_TYPES || '')
    .split(',')
    .map((mimeType) => mimeType.trim())
    .filter(Boolean);
}

fs.mkdirSync(storageDirectory, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, storageDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: getMaxFileSize(),
  },
  fileFilter: (_request, file, callback) => {
    const allowedMimeTypes = getAllowedMimeTypes();

    if (allowedMimeTypes.length === 0 || allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    const error = new Error('Tipo de arquivo não permitido.');
    error.code = 'FILE_TYPE_NOT_ALLOWED';
    callback(error);
  },
});

function create(metadata) {
  documents.set(metadata.id, metadata);
  return metadata;
}

function findAll() {
  return [...documents.values()];
}

function findById(id) {
  return documents.get(id);
}

function remove(id) {
  documents.delete(id);
}

function isPathInsideStorage(filePath) {
  const relativePath = path.relative(storageDirectory, path.resolve(filePath));
  return relativePath !== ''
    && relativePath !== '..'
    && !relativePath.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relativePath);
}

module.exports = {
  create,
  findAll,
  findById,
  remove,
  isPathInsideStorage,
  storageDirectory,
  upload,
};