// src/middlewares/upload.middleware.js
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

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

const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo

const storage    = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  ALLOWED_MIMES.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Type non autorisé. Seuls PDF et DOCX sont acceptés.'), false);
};

const upload = multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter });

// ─── Upload vers Cloudinary ───────────────────────────────────────────────────
// PDF  → resource_type 'image' pour générer des vignettes
// DOCX → resource_type 'raw'
const uploadToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const isPdf        = mimetype === 'application/pdf';
    const resourceType = isPdf ? 'image' : 'raw';
    const format       = isPdf ? 'pdf'   : 'docx';
    const publicId     = `gestdoc/documents/doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, public_id: publicId, format },
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

// ─── Générer URL vignette (page 1 du PDF en JPG) ─────────────────────────────
const getThumbnailUrl = (fileUrl, resourceType) => {
  if (!fileUrl || resourceType !== 'image') return null;
  try {
    // Insérer les transformations après /upload/
    return fileUrl.replace(
      '/image/upload/',
      '/image/upload/w_400,h_550,c_fit,pg_1,f_jpg,q_70/'
    );
  } catch {
    return null;
  }
};

// ─── Middleware : multer + cloudinary ─────────────────────────────────────────
const uploadSingle = (fieldName) => async (req, res, next) => {
  upload.single(fieldName)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ error: 'Le fichier dépasse la limite de 20 Mo.' });
      return res.status(400).json({ error: 'Erreur upload: ' + err.message });
    }
    if (err)       return res.status(400).json({ error: err.message });
    if (!req.file) return next();

    try {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

      // ✅ Upload Cloudinary réussi — on attache les infos
      req.file.cloudinaryUrl  = result.secure_url;
      req.file.cloudinaryId   = result.public_id;
      req.file.resourceType   = result.resource_type;
      req.file.cloudinaryDone = true; // flag de succès

      next();
    } catch (uploadErr) {
      console.error('Cloudinary upload FAILED:', uploadErr.message);
      // ❌ Échec Cloudinary → on arrête tout, pas de création en BDD
      return res.status(500).json({
        error: 'Échec du stockage du fichier. Veuillez réessayer.',
        detail: uploadErr.message,
      });
    }
  });
};

module.exports = { uploadSingle, cloudinary, getThumbnailUrl };