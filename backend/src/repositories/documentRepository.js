const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const documents = new Map();

fs.mkdirSync(storageDirectory, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, storageDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024),
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

module.exports = {
  create,
  findAll,
  findById,
  remove,
  storageDirectory,
  upload,
};