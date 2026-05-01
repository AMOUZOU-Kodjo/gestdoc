// src/routes/documents.routes.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, optionalAuth } = require('../middlewares/auth.middleware');
const { uploadSingle, cloudinary } = require('../middlewares/upload.middleware');
const { uploadDocumentSchema, filterSchema } = require('../validators/document.validators');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/documents — Liste publique (documents approuvés seulement)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const filters = filterSchema.parse(req.query);
    const { classe, matiere, annee, search, page, limit } = filters;

    const where = {
      status: 'APPROVED',
      ...(classe && { classe }),
      ...(matiere && { matiere }),
      ...(annee && { annee }),
      ...(search && {
        OR: [
          { titre: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, titre: true, description: true, classe: true, matiere: true,
          annee: true, fileType: true, fileSize: true, downloadCount: true, createdAt: true,
          uploader: { select: { nom: true, prenom: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Paramètres de filtre invalides.' });
    }
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents.' });
  }
});

// GET /api/documents/my/uploads — Auth required (MUST be before /:id)
router.get('/my/uploads', authMiddleware, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { uploaderId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, titre: true, classe: true, matiere: true, annee: true,
        fileType: true, status: true, downloadCount: true, createdAt: true,
      },
    });
    res.json(documents);
  } catch (error) {
    console.error('My uploads error:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/documents/upload — Auth required
router.post('/upload', authMiddleware, uploadSingle('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni.' });
    }

    const data = uploadDocumentSchema.parse(req.body);
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx';

    const document = await prisma.document.create({
      data: {
        titre: data.titre,
        description: data.description || null,
        niveau: data.niveau,
        classe: data.classe,
        matiere: data.matiere,
        annee: data.annee,
        fileUrl: req.file.path,
        fileType,
        fileSize: req.file.size,
        publicId: req.file.filename,
        uploaderId: req.user.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Document uploadé avec succès. En attente de validation.',
      document: { id: document.id, titre: document.titre, status: document.status },
    });
  } catch (error) {
    // Delete from Cloudinary if DB save failed
    if (req.file?.filename) {
      cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }).catch(() => {});
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Données invalides.',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload.' });
  }
});

// GET /api/documents/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: 'ID invalide.' });
    }

    const document = await prisma.document.findFirst({
      where: { id, status: 'APPROVED' },
      include: { uploader: { select: { nom: true, prenom: true } } },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé.' });
    }

    const { fileUrl, publicId, ...safeDoc } = document;
    res.json(safeDoc);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du document.' });
  }
});

// GET /api/documents/:id/download — Auth required
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: 'ID invalide.' });
    }

    const document = await prisma.document.findFirst({
      where: { id, status: 'APPROVED' },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé.' });
    }

    await Promise.all([
      prisma.download.create({
        data: { userId: req.user.id, documentId: id },
      }),
      prisma.document.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      }),
    ]);

    res.json({ downloadUrl: document.fileUrl, titre: document.titre });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement.' });
  }
});

module.exports = router;
