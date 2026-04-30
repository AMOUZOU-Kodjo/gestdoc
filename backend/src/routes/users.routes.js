// src/routes/users.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, nom: true, prenom: true, email: true, role: true, createdAt: true,
        _count: { select: { documents: true, downloads: true } },
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PATCH /api/users/me — Update profile
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const schema = z.object({
      nom: z.string().min(2).max(100).trim().optional(),
      prenom: z.string().min(2).max(100).trim().optional(),
    });
    const data = schema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, nom: true, prenom: true, email: true, role: true },
    });
    res.json(user);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Données invalides.' });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PATCH /api/users/me/password
router.patch('/me/password', authMiddleware, async (req, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string()
        .min(8)
        .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre'),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!valid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    
    // Revoke all refresh tokens on password change
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id },
      data: { revoked: true },
    });

    res.json({ message: 'Mot de passe modifié. Veuillez vous reconnecter.' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Données invalides.',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/users/me/downloads
router.get('/me/downloads', authMiddleware, async (req, res) => {
  try {
    const downloads = await prisma.download.findMany({
      where: { userId: req.user.id },
      orderBy: { downloadedAt: 'desc' },
      take: 20,
      include: {
        document: {
          select: { id: true, titre: true, classe: true, matiere: true, fileType: true },
        },
      },
    });
    res.json(downloads);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
