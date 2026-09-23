class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
    this.upload = this.upload.bind(this);
    this.list = this.list.bind(this);
    this.download = this.download.bind(this);
  }

  async upload(request, response, next) {
    try {
      const metadata = await this.documentService.upload(request.file);
      response.status(201).json(this.documentService.toPublicMetadata(metadata));
    } catch (error) {
      next(error);
    }
  }

  list(_request, response, next) {
    try {
      response.json({ documents: this.documentService.list() });
    } catch (error) {
      next(error);
    }
  }

  async download(request, response, next) {
    try {
      const document = await this.documentService.getDownload(request.params.id);
      response.download(
        document.storagePath,
        this.documentService.getDownloadName(document),
        (error) => {
          if (!error) return;

          if (response.headersSent) {
            response.end();
            return;
          }

          error.code = 'DOWNLOAD_ERROR';
          next(error);
        },
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentController;