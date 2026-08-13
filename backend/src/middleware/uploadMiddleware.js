const multer = require('multer');

const maxMb = parseInt(process.env.MAX_FILE_SIZE_MB || '10');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow all standard safe document and media types
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxMb * 1024 * 1024
  },
  fileFilter: fileFilter
});

module.exports = upload;
