const express = require('express');
const bcrypt  = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const multer  = require('multer');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const { authMiddleware } = require('../middlewares/auth.middleware');

const router  = express.Router();
const prisma  = new PrismaClient();

const VALID_PROFILES = ['BEPC','PREMIERE','TERMINALE','UNIVERSITE','ENSEIGNANT'];

// ── Avatar upload (memory storage, 2 Mo max, images seulement) ──────────────
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont acceptées.'), false);
  },
});

const uploadAvatarToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const ext = mimetype.split('/')[1] || 'jpg';
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'gestdoc/avatars', resource_type: 'image',
        transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        format: 'webp' },
      (err, result) => { if (err) return reject(err); resolve(result); }
    );
    const r = new Readable();
    r.push(buffer);
    r.push(null);
    r.pipe(stream);
  });
};

// ── GET /api/users/me ────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, nom: true, prenom: true, email: true,
        role: true, profile: true, avatarUrl: true, createdAt: true,
        _count: { select: { documents: true, downloads: true } },
      },
    });
    res.json(user);
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ── PATCH /api/users/me ──────────────────────────────────────────────────────
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const schema = z.object({
      nom:     z.string().min(2).max(100).trim().optional(),
      prenom:  z.string().min(2).max(100).trim().optional(),
      profile: z.enum(VALID_PROFILES).optional(),
    });
    const data = schema.parse(req.body);

    // Bloquer le changement de profil si déjà défini (sauf admin)
    if (data.profile && req.user.role !== 'ADMIN') {
      const current = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { profile: true },
      });
      if (current?.profile) {
        return res.status(403).json({
          error: 'Votre profil a déjà été défini et ne peut plus être modifié.',
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id }, data,
      select: { id: true, nom: true, prenom: true, email: true, role: true, profile: true, avatarUrl: true },
    });
    res.json(user);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Données invalides.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── POST /api/users/me/avatar ────────────────────────────────────────────────
router.post('/me/avatar', authMiddleware, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'L\'image dépasse la limite de 2 Mo.' });
    }
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucune image fournie.' });

    try {
      // Supprimer l'ancien avatar si existant
      const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatarUrl: true } });
      if (current?.avatarUrl) {
        // Extraire le public_id depuis l'URL Cloudinary
        const parts = current.avatarUrl.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const publicId = `gestdoc/avatars/${filename}`;
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
      }

      const result = await uploadAvatarToCloudinary(req.file.buffer, req.file.mimetype);

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: result.secure_url },
        select: { id: true, nom: true, prenom: true, email: true, role: true, profile: true, avatarUrl: true },
      });
      res.json(user);
    } catch (uploadErr) {
      console.error('Avatar upload error:', uploadErr);
      res.status(500).json({ error: 'Erreur lors de l\'upload de la photo.' });
    }
  });
});

// ── DELETE /api/users/me/avatar ──────────────────────────────────────────────
router.delete('/me/avatar', authMiddleware, async (req, res) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatarUrl: true } });
    if (current?.avatarUrl) {
      const parts    = current.avatarUrl.split('/');
      const filename = parts[parts.length - 1].split('.')[0];
      const publicId = `gestdoc/avatars/${filename}`;
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null },
      select: { id: true, nom: true, prenom: true, avatarUrl: true },
    });
    res.json(user);
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ── PATCH /api/users/me/password ─────────────────────────────────────────────
router.patch('/me/password', authMiddleware, async (req, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8)
        .regex(/[A-Z]/, 'Doit contenir une majuscule')
        .regex(/[0-9]/, 'Doit contenir un chiffre'),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);
    const user  = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    await prisma.refreshToken.updateMany({ where: { userId: req.user.id }, data: { revoked: true } });
    res.json({ message: 'Mot de passe modifié. Veuillez vous reconnecter.' });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Données invalides.', details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── GET /api/users/me/downloads ──────────────────────────────────────────────
router.get('/me/downloads', authMiddleware, async (req, res) => {
  try {
    const downloads = await prisma.download.findMany({
      where: { userId: req.user.id },
      orderBy: { downloadedAt: 'desc' },
      take: 20,
      include: { document: { select: { id: true, titre: true, classe: true, matiere: true, niveau: true, fileType: true } } },
    });
    res.json(downloads);
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

module.exports = router;