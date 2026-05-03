// src/middlewares/upload.middleware.js
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const zlib = require('zlib');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo

// Compression Gzip pour tous les fichiers
const compressBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    zlib.gzip(buffer, { level: 9 }, (err, compressed) => {
      if (err) {
        console.warn('Compression échouée, envoi du fichier original:', err.message);
        resolve({ buffer, compressed: false, ratio: 0 });
      } else {
        const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(1);
        console.log(`✅ Compression: ${(buffer.length/1024).toFixed(0)}Ko → ${(compressed.length/1024).toFixed(0)}Ko (-${ratio}%)`);
        resolve({ buffer: compressed, compressed: true, ratio });
      }
    });
  });
};

// Upload vers Cloudinary
const uploadToCloudinary = (buffer, mimetype, originalSize, compressionRatio) => {
  return new Promise((resolve, reject) => {
    let resourceType = 'raw';
    let format = 'bin';
    
    if (mimetype.startsWith('image/')) {
      resourceType = 'image';
      format = mimetype.split('/')[1];
    } else if (mimetype === 'application/pdf') {
      resourceType = 'raw';
      format = 'pdf';
    } else if (mimetype.includes('word')) {
      resourceType = 'raw';
      format = 'docx';
    }
    
    const publicId = `gestdoc/documents/doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const uploadOptions = {
      resource_type: resourceType,
      public_id: publicId,
      format: format,
      context: `original_size=${originalSize}|compression_ratio=${compressionRatio}`
    };
    
    // Pour les images, ajouter des optimisations
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { width: 1200, crop: 'limit' }
      ];
    }
    
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// Configuration Multer
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type non autorisé. Seuls PDF, DOCX, JPG, PNG sont acceptés.'), false);
  }
};

const upload = multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter });

// Middleware principal
const uploadSingle = (fieldName) => async (req, res, next) => {
  upload.single(fieldName)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Le fichier dépasse la limite de 20 Mo.' });
      }
      return res.status(400).json({ error: 'Erreur upload: ' + err.message });
    }
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return next();
    
    try {
      const originalSize = req.file.size;
      const mimetype = req.file.mimetype;
      
      console.log(`📁 Fichier reçu: ${(originalSize/1024).toFixed(0)}Ko - ${mimetype}`);
      
      // Compression si ce n'est pas une image (car Cloudinary gère mieux les images)
      let finalBuffer = req.file.buffer;
      let wasCompressed = false;
      let compressionRatio = 0;
      
      if (!mimetype.startsWith('image/')) {
        const result = await compressBuffer(req.file.buffer);
        finalBuffer = result.buffer;
        wasCompressed = result.compressed;
        compressionRatio = result.ratio;
      }
      
      // Upload vers Cloudinary
      const uploadResult = await uploadToCloudinary(finalBuffer, mimetype, originalSize, compressionRatio);
      
      // Attacher les infos au req.file
      req.file.path = uploadResult.secure_url;
      req.file.filename = uploadResult.public_id;
      req.file.originalSize = originalSize;
      req.file.storedSize = finalBuffer.length;
      req.file.compressionRatio = compressionRatio;
      req.file.wasCompressed = wasCompressed;
      
      console.log(`✅ Upload réussi: ${uploadResult.secure_url}`);
      if (wasCompressed) {
        console.log(`📊 Réduction: ${compressionRatio}%`);
      }
      
      next();
      
    } catch (uploadErr) {
      console.error('Upload error:', uploadErr);
      return res.status(500).json({ error: 'Erreur lors du stockage du fichier.' });
    }
  });
};

module.exports = { uploadSingle, cloudinary };