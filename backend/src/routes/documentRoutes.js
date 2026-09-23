const express = require('express');
const documentRepository = require('../repositories/documentRepository');
const DocumentService = require('../services/documentService');
const DocumentController = require('../controllers/documentController');

const documentService = new DocumentService(documentRepository);
const documentController = new DocumentController(documentService);
const router = express.Router();

router.post('/upload', documentRepository.upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;