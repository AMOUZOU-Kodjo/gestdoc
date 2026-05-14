// src/routes/documents.routes.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, optionalAuth } = require('../middlewares/auth.middleware');
const { uploadSingle, cloudinary } = require('../middlewares/upload.middleware');
const { uploadDocumentSchema, filterSchema } = require('../validators/document.validators');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/documents — Liste publique
router.get('/', optionalAuth, async (req, res) => {
  try {
    const filters = filterSchema.parse(req.query);
    const { niveau, classe, matiere, annee, search, page, limit } = filters;

    const where = {
      status: 'APPROVED',
      ...(niveau  && { niveau }),
      ...(classe  && { classe }),
      ...(matiere && { matiere }),
      ...(annee   && { annee }),
      ...(search  && {
        OR: [
          { titre:       { contains: search, mode: 'insensitive' } },
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
          annee: true, niveau: true, fileType: true, fileSize: true,
          downloadCount: true, createdAt: true, thumbnailUrl: true,
          uploader: { select: { nom: true, prenom: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      documents,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Paramètres de filtre invalides.' });
    }
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents.' });
  }
});

// GET /api/documents/my/uploads — Auth required (AVANT /:id)
router.get('/my/uploads', authMiddleware, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { uploaderId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, titre: true, classe: true, matiere: true, annee: true,
        niveau: true, fileType: true, status: true, downloadCount: true, createdAt: true,
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
    // ── Vérification critique : l'upload Cloudinary doit avoir réussi ──────────
    if (!req.file || !req.file.cloudinaryDone) {
      return res.status(400).json({ error: 'Fichier non reçu ou upload Cloudinary échoué.' });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const data         = uploadDocumentSchema.parse(req.body);
    const fileType     = req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx';
    const resourceType = req.file.resourceType || (fileType === 'pdf' ? 'image' : 'raw');

    const { getThumbnailUrl } = require('../middlewares/upload.middleware');
    const thumbnailUrl = getThumbnailUrl(req.file.cloudinaryUrl, resourceType);

    const document = await prisma.document.create({
      data: {
        titre:        data.titre,
        description:  data.description || null,
        niveau:       data.niveau,
        classe:       data.classe,
        matiere:      data.matiere,
        annee:        data.annee,
        fileUrl:      req.file.cloudinaryUrl,   // ✅ URL Cloudinary confirmée
        fileType,
        fileSize:     req.file.size,
        publicId:     req.file.cloudinaryId,    // ✅ Public ID Cloudinary
        resourceType,
        thumbnailUrl,
        uploaderId:   req.user.id,
        status:       'PENDING',
      },
    });

    res.status(201).json({
      message: 'Document uploadé avec succès. En attente de validation.',
      document: { id: document.id, titre: document.titre, status: document.status },
    });
  } catch (error) {
    // Si l'enregistrement BDD échoue APRES upload Cloudinary → supprimer le fichier
    if (req.file?.cloudinaryId && req.file?.resourceType) {
      cloudinary.uploader.destroy(req.file.cloudinaryId, {
        resource_type: req.file.resourceType,
      }).catch(() => {});
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Données invalides.',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    console.error('Upload DB error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du document.' });
  }
});

// GET /api/documents/:id — Détail public
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

// GET /api/documents/:id/download — Auth + quota required
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: 'ID invalide.' });
    }

    // ── Vérifier le quota ─────────────────────────────────────────────────────
    const { checkDownloadAccess } = require('../services/quota.service');
    const access = await checkDownloadAccess(req.user.id);

    if (!access.canDownload) {
      return res.status(403).json({
        error: 'Quota de téléchargements atteint.',
        code: 'QUOTA_EXCEEDED',
        reason: access.reason,
        totalAllowed: access.totalAllowed,
        used: access.used,
      });
    }

    const document = await prisma.document.findFirst({
      where: { id, status: 'APPROVED' },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé.' });
    }

    // Enregistrer le téléchargement
    await Promise.all([
      prisma.download.create({ data: { userId: req.user.id, documentId: id } }),
      prisma.document.update({ where: { id }, data: { downloadCount: { increment: 1 } } }),
    ]);

    // ── URL avec fl_attachment + watermark GestDoc ─────────────────────────
    const { getDownloadUrl } = require('../services/watermark.service');
    const downloadUrl = getDownloadUrl(document.fileUrl, document.resourceType);
    // ────────────────────────────────────────────────────────────────────────

    res.json({
      downloadUrl,
      titre:    document.titre,
      fileType: document.fileType,
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement.' });
  }
});

// GET /api/documents/:id/view — Auth requis (consultation sans quota)
router.get('/:id/view', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: 'ID invalide.' });
    }

    const document = await prisma.document.findFirst({
      where: { id, status: 'APPROVED' },
      select: {
        id: true, titre: true, fileType: true, resourceType: true,
        fileUrl: true, niveau: true, classe: true, matiere: true,
        annee: true, description: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé.' });
    }

    // Base URL pour le rendu page par page (images avec watermark)
    const { getViewerBaseUrl } = require('../services/watermark.service');
    const viewerBaseUrl = getViewerBaseUrl(document.fileUrl, document.resourceType);

    res.json({
      id: document.id,
      titre: document.titre,
      fileType: document.fileType,
      resourceType: document.resourceType,
      viewerBaseUrl,
      niveau: document.niveau,
      classe: document.classe,
      matiere: document.matiere,
      annee: document.annee,
      description: document.description,
    });
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'Erreur lors de la préparation du visionnage.' });
  }
});

module.exports = router;