const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { cloudinary } = require('../middlewares/upload.middleware');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

// Toutes les routes admin nécessitent auth + ADMIN sauf GET /settings
router.use((req, res, next) => {
  // GET /settings est public (footer en a besoin)
  if (req.method === 'GET' && req.path === '/settings') return next()
  authMiddleware(req, res, () => requireRole('ADMIN')(req, res, next))
})

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalDocuments, totalDownloads, pendingDocuments, recentUploads, recentUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.document.count({ where: { status: 'APPROVED' } }),
      prisma.download.count(),
      prisma.document.count({ where: { status: 'PENDING' } }),
      prisma.document.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, titre: true, status: true, createdAt: true, uploader: { select: { nom: true, prenom: true } } },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, nom: true, prenom: true, email: true, createdAt: true },
      }),
    ]);
    res.json({ totalUsers, totalDocuments, totalDownloads, pendingDocuments, recentUploads, recentUsers });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ─── Documents ────────────────────────────────────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const status = req.query.status;
    const search = req.query.search;
    const where  = {
      ...(status && { status }),
      ...(search && { OR: [
        { titre: { contains: search, mode: 'insensitive' } },
        { uploader: { email: { contains: search, mode: 'insensitive' } } },
      ]}),
    };
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { nom: true, prenom: true, email: true } } },
      }),
      prisma.document.count({ where }),
    ]);
    res.json({ documents, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.patch('/documents/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'ID invalide.' });
    const { status } = z.object({ status: z.enum(['APPROVED','REJECTED','PENDING']) }).parse(req.body);

    const document = await prisma.document.update({
      where: { id }, data: { status },
      select: { id: true, titre: true, status: true, uploaderId: true },
    });

    // ── Bonus : +2 téléchargements si document approuvé ──────────────
    if (status === 'APPROVED') {
      const { addBonusDownloads } = require('../services/quota.service');
      await addBonusDownloads(document.uploaderId, 2);
      console.log(`✅ +2 téléchargements bonus → user ${document.uploaderId}`);
    }
    // ─────────────────────────────────────────────────────────────────

    res.json(document);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Document non trouvé.' });
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Statut invalide.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'ID invalide.' });
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return res.status(404).json({ error: 'Document non trouvé.' });
    if (document.publicId) {
      await cloudinary.uploader.destroy(document.publicId, { resource_type: 'raw' }).catch(console.error);
    }
    await prisma.document.delete({ where: { id } });
    res.json({ message: 'Document supprimé.' });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const search = req.query.search;
    const where = search ? { OR: [
      { email: { contains: search, mode: 'insensitive' } },
      { nom:   { contains: search, mode: 'insensitive' } },
      { prenom:{ contains: search, mode: 'insensitive' } },
    ]} : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, nom: true, prenom: true, email: true, role: true, isActive: true, createdAt: true,
          _count: { select: { documents: true, downloads: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'ID invalide.' });
    if (id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre statut.' });
    const data = z.object({ isActive: z.boolean().optional(), role: z.enum(['USER','ADMIN']).optional() }).parse(req.body);
    const user = await prisma.user.update({ where: { id }, data,
      select: { id: true, nom: true, prenom: true, email: true, role: true, isActive: true } });
    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Données invalides.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ─── Paramètres du site ───────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
    // Créer les paramètres par défaut s'ils n'existent pas encore
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 'singleton' } });
    }
    res.json(settings);
  } catch (error) {
    console.error('Settings get error:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    const schema = z.object({
      siteName:        z.string().min(2).max(100).trim().optional(),
      siteDescription: z.string().max(300).trim().optional(),
      contactEmail:    z.string().email().optional(),
      contactPhone:    z.string().max(30).trim().optional(),
      contactAddress:  z.string().max(200).trim().optional(),
      facebookUrl:     z.string().url().or(z.literal('')).optional(),
      twitterUrl:      z.string().url().or(z.literal('')).optional(),
      instagramUrl:    z.string().url().or(z.literal('')).optional(),
      youtubeUrl:      z.string().url().or(z.literal('')).optional(),
      maintenanceMode: z.boolean().optional(),
      allowUploads:    z.boolean().optional(),
      maxFileSizeMb:   z.number().int().min(1).max(100).optional(),
      donActif:        z.boolean().optional(),
      donTitre:        z.string().max(100).trim().optional(),
      donMessage:      z.string().max(500).trim().optional(),
      donNumero:       z.string().max(20).trim().optional(),
      donNom:          z.string().max(100).trim().optional(),
      donMontants:     z.string().max(100).trim().optional(),
    });
    const data = schema.parse(req.body);
    const settings = await prisma.siteSettings.upsert({
      where:  { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    res.json(settings);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({
      error: 'Données invalides.',
      details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;

// ─── Broadcast email ──────────────────────────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  try {
    const schema = z.object({
      sujet:   z.string().min(3).max(200).trim(),
      message: z.string().min(10).max(5000).trim(),
      cible:   z.enum(['tous', 'actifs', 'BEPC', 'PREMIERE', 'TERMINALE', 'UNIVERSITE', 'ENSEIGNANT']).default('tous'),
    });
    const { sujet, message, cible } = schema.parse(req.body);

    // Construire le filtre selon la cible
    const where = {
      isActive: true,
      ...(cible !== 'tous' && cible !== 'actifs' && { profile: cible }),
    };

    const users = await prisma.user.findMany({
      where,
      select: { email: true, prenom: true, nom: true },
    });

    if (users.length === 0) {
      return res.status(400).json({ error: 'Aucun utilisateur trouvé pour cette cible.' });
    }

    // Simulation d'envoi (sans SMTP configuré)
    // En production, remplacer par nodemailer ou Resend
    console.log(`📧 Broadcast: "${sujet}" → ${users.length} utilisateurs`);
    console.log(`Cible: ${cible}`);
    console.log(`Premier destinataire: ${users[0]?.email}`);

    // TODO: Intégrer nodemailer ou Resend ici
    // Exemple avec Resend:
    // await resend.emails.send({ from: 'no-reply@gestdoc.tg', to: users.map(u => u.email), subject: sujet, html: message })

    res.json({
      success: true,
      message: `Email envoyé à ${users.length} utilisateur(s).`,
      count: users.length,
      preview: { sujet, message: message.substring(0, 100) + '...', cible },
    });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({
      error: 'Données invalides.',
      details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi.' });
  }
});

// ─── Abonnements ──────────────────────────────────────────────────────────────

// GET /api/admin/subscriptions — Liste des abonnés
router.get('/subscriptions', async (req, res) => {
  try {
    const now = new Date();
    const subs = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true } },
      },
    });
    res.json(subs.map(s => ({
      ...s,
      isActive: s.actif && new Date(s.fin) > now,
    })));
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// POST /api/admin/subscriptions — Créer/renouveler un abonnement
router.post('/subscriptions', async (req, res) => {
  try {
    const schema = z.object({
      userId:    z.string().uuid(),
      dureeJours: z.number().int().min(1).max(365).default(30),
      montant:   z.number().int().min(0),
      reference: z.string().max(100).optional(),
    });
    const { userId, dureeJours, montant, reference } = schema.parse(req.body);

    const debut = new Date();
    const fin   = new Date(debut.getTime() + dureeJours * 24 * 60 * 60 * 1000);

    const sub = await prisma.subscription.upsert({
      where:  { userId },
      update: { actif: true, debut, fin, montant, reference: reference || null },
      create: { userId, actif: true, debut, fin, montant, reference: reference || null },
      include: { user: { select: { nom: true, prenom: true, email: true } } },
    });

    res.status(201).json({ ...sub, message: `Abonnement activé jusqu'au ${fin.toLocaleDateString('fr-FR')}` });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Données invalides.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/subscriptions/:userId — Révoquer un abonnement
router.delete('/subscriptions/:userId', async (req, res) => {
  try {
    await prisma.subscription.update({
      where: { userId: req.params.userId },
      data:  { actif: false },
    });
    res.json({ message: 'Abonnement révoqué.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Abonnement non trouvé.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;