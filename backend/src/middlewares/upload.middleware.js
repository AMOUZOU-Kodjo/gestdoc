// src/middlewares/upload.middleware.js
const multer    = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const zlib      = require('zlib');  // Module natif Node.js — pas d'install

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo avant compression

// ─── Compression gzip du buffer ──────────────────────────────────────────────
const compressBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    // Niveau 6 = bon équilibre vitesse/taux (0=aucun, 9=max)
    zlib.gzip(buffer, { level: 6 }, (err, compressed) => {
      if (err) {
        // Si la compression échoue, on envoie le buffer original
        console.warn('Compression échouée, envoi du fichier original:', err.message);
        resolve({ buffer, compressed: false });
      } else {
        const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(1);
        console.log(`✅ Compression: ${(buffer.length/1024).toFixed(0)}Ko → ${(compressed.length/1024).toFixed(0)}Ko (-${ratio}%)`);
        resolve({ buffer: compressed, compressed: true });
      }
    });
  });
};

// ─── Multer — stockage en mémoire ────────────────────────────────────────────
const storage    = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  ALLOWED_MIMES.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Type non autorisé. Seuls PDF et DOCX sont acceptés.'), false);
};

const upload = multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter });

// ─── Upload vers Cloudinary avec compression ──────────────────────────────────
const uploadToCloudinary = (buffer, mimetype, originalSize) => {
  return new Promise((resolve, reject) => {
    const ext      = mimetype === 'application/pdf' ? 'pdf' : 'docx';
    const publicId = `gestdoc/documents/doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: publicId,
        format: ext,
        // Métadonnées utiles
        context: `original_size=${originalSize}`,
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

// ─── Middleware combiné : multer + compression + cloudinary ───────────────────
const uploadSingle = (fieldName) => async (req, res, next) => {
  upload.single(fieldName)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Le fichier dépasse la limite de 20 Mo.' });
      }
      return res.status(400).json({ error: 'Erreur upload: ' + err.message });
    }
    if (err)       return res.status(400).json({ error: err.message });
    if (!req.file) return next();

    try {
      const originalSize = req.file.size;

      // Étape 1 — Compression gzip
      const { buffer: compressedBuffer, compressed } = await compressBuffer(req.file.buffer);

      // Étape 2 — Upload vers Cloudinary
      const result = await uploadToCloudinary(compressedBuffer, req.file.mimetype, originalSize);

      // Attacher les infos au req.file pour la route
      req.file.path          = result.secure_url;
      req.file.filename      = result.public_id;
      req.file.originalSize  = originalSize;
      req.file.storedSize    = compressedBuffer.length;
      req.file.wasCompressed = compressed;

      next();
    } catch (uploadErr) {
      console.error('Upload error:', uploadErr);
      return res.status(500).json({ error: 'Erreur lors du stockage du fichier.' });
    }
  });
};

module.exports = { uploadSingle, cloudinary };