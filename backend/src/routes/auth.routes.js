// src/routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/auth.validators');

const router = express.Router();
const prisma = new PrismaClient();

// Strict rate limit on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  keyGenerator: (req) => `${req.ip}_${req.body?.email || ''}`,
});

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    
    const user = await prisma.user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        passwordHash,
      },
      select: { id: true, nom: true, prenom: true, email: true, role: true },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Données invalides.',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription.' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    // Always hash compare to prevent timing attacks
    const dummyHash = '$2a$12$dummy.hash.for.timing.prevention.only.ignore';
    const passwordValid = user 
      ? await bcrypt.compare(data.password, user.passwordHash)
      : await bcrypt.compare(data.password, dummyHash);

    // Log attempt
    await prisma.loginAttempt.create({
      data: {
        email: data.email,
        ipAddress: req.ip || 'unknown',
        success: !!(user && passwordValid),
        userId: (user && passwordValid) ? user.id : null,
      },
    }).catch(() => {}); // Non-blocking

    if (!user || !passwordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé. Contactez l\'administrateur.' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { passwordHash, ...safeUser } = user;

    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Données invalides.',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré.' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token invalide.' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    
    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Token révoqué ou expiré.' });
    }

    // Rotate refresh token
    await prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revoked: true } });

    const tokens = generateTokens(decoded.userId);
    const newTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: decoded.userId,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json(tokens);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Token manquant.' });
    }
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Erreur lors du renouvellement du token.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }
    res.json({ message: 'Déconnecté avec succès.' });
  } catch (error) {
    res.json({ message: 'Déconnecté.' });
  }
});

module.exports = router;
