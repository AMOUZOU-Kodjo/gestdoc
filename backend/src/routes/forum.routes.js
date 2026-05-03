// src/routes/forum.routes.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

const USER_SELECT = {
  id: true, prenom: true, nom: true, avatarUrl: true, role: true, profile: true,
};

// ─── GET /api/forum — Liste des posts ────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(20, parseInt(req.query.limit) || 10);
    const niveau = req.query.niveau;
    const search = req.query.search;

    const where = {
      ...(niveau && { niveau }),
      ...(search && {
        OR: [
          { titre:   { contains: search, mode: 'insensitive' } },
          { contenu: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          user:    { select: USER_SELECT },
          _count:  { select: { replies: true, likes: true } },
          likes:   req.user ? { where: { userId: req.user.id }, select: { id: true } } : false,
        },
      }),
      prisma.forumPost.count({ where }),
    ]);

    const formatted = posts.map(p => ({
      ...p,
      likedByMe: req.user ? p.likes?.length > 0 : false,
      likes: undefined,
    }));

    res.json({ posts: formatted, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Forum list error:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ─── GET /api/forum/:id — Détail d'un post + replies ─────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Incrémenter les vues
    const post = await prisma.forumPost.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        user:    { select: USER_SELECT },
        _count:  { select: { replies: true, likes: true } },
        likes:   req.user ? { where: { userId: req.user.id }, select: { id: true } } : false,
        replies: {
          where:   { parentId: null }, // Réponses racines seulement
          orderBy: { createdAt: 'asc' },
          include: {
            user:     { select: USER_SELECT },
            children: {
              orderBy: { createdAt: 'asc' },
              include: { user: { select: USER_SELECT } },
            },
          },
        },
      },
    });

    res.json({
      ...post,
      likedByMe: req.user ? post.likes?.length > 0 : false,
      likes: undefined,
    });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Post non trouvé.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ─── POST /api/forum — Créer un post ─────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const schema = z.object({
      titre:   z.string().min(5, 'Titre trop court (min 5 caractères)').max(200).trim(),
      contenu: z.string().min(10, 'Message trop court (min 10 caractères)').max(5000).trim(),
      niveau:  z.string().optional(),
    });
    const data = schema.parse(req.body);

    const post = await prisma.forumPost.create({
      data: { ...data, userId: req.user.id },
      include: {
        user:   { select: USER_SELECT },
        _count: { select: { replies: true, likes: true } },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({
      error: 'Données invalides.',
      details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/forum/:id — Supprimer un post ───────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post non trouvé.' });

    // Seul l'auteur ou un admin peut supprimer
    if (post.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    await prisma.forumPost.delete({ where: { id: req.params.id } });
    res.json({ message: 'Post supprimé.' });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── POST /api/forum/:id/like — Liker/Unliker ────────────────────────────────
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const existing = await prisma.forumLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.forumLike.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.forumLike.create({ data: { userId, postId } });
      res.json({ liked: true });
    }
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── POST /api/forum/:id/replies — Répondre à un post ────────────────────────
router.post('/:id/replies', authMiddleware, async (req, res) => {
  try {
    const schema = z.object({
      contenu:  z.string().min(2, 'Réponse trop courte').max(2000).trim(),
      parentId: z.string().uuid().optional(),
    });
    const { contenu, parentId } = schema.parse(req.body);

    // Vérifier que le post existe
    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post non trouvé.' });

    const reply = await prisma.forumReply.create({
      data: { contenu, userId: req.user.id, postId: req.params.id, parentId: parentId || null },
      include: {
        user:     { select: USER_SELECT },
        children: { include: { user: { select: USER_SELECT } } },
      },
    });

    res.status(201).json(reply);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({
      error: 'Données invalides.',
      details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/forum/replies/:replyId ──────────────────────────────────────
router.delete('/replies/:replyId', authMiddleware, async (req, res) => {
  try {
    const reply = await prisma.forumReply.findUnique({ where: { id: req.params.replyId } });
    if (!reply) return res.status(404).json({ error: 'Réponse non trouvée.' });
    if (reply.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }
    await prisma.forumReply.delete({ where: { id: req.params.replyId } });
    res.json({ message: 'Réponse supprimée.' });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Admin : épingler un post ─────────────────────────────────────────────────
router.patch('/:id/pin', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin requis.' });
    const post = await prisma.forumPost.update({
      where: { id: req.params.id },
      data:  { pinned: req.body.pinned },
    });
    res.json(post);
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

module.exports = router;