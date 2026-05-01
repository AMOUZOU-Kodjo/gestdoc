// src/middlewares/upload.middleware.js
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

// Store file in memory first, then upload to Cloudinary manually
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les fichiers PDF et DOCX sont acceptés.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

// Upload buffer to Cloudinary using upload_stream
const uploadToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const ext = mimetype === 'application/pdf' ? 'pdf' : 'docx';
    const publicId = `gestdoc/documents/doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: publicId,
        format: ext,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// Combined middleware: multer memory + cloudinary upload
const uploadSingle = (fieldName) => async (req, res, next) => {
  upload.single(fieldName)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Le fichier dépasse la limite de 20 Mo.' });
      }
      return res.status(400).json({ error: 'Erreur upload: ' + err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return next();
    try {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      req.file.path = result.secure_url;
      req.file.filename = result.public_id;
      next();
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      return res.status(500).json({ error: 'Erreur lors du stockage du fichier.' });
    }
  });
};

module.exports = { uploadSingle, cloudinary };
