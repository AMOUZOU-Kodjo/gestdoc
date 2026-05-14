const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { sendSubscriptionEmail } = require('../services/email.service');

const prisma = new PrismaClient();

const OPERATEURS = {
  tmoney: { nom: 'T-Money', marchand: '70855901' },
  flooz:  { nom: 'Flooz',   marchand: '99163562' },
};

const PLANS = {
  weekly:   { duree: 7,  prix: 500 },
  monthly:  { duree: 30, prix: 1500 },
  quarterly: { duree: 90, prix: 4000 },
};

function getPlan(planId) {
  return PLANS[planId] || null;
}

// Validation du format de référence selon l'opérateur
function validateReference(operator, ref) {
  if (!ref || ref.length < 8) {
    return 'La référence doit contenir au moins 8 caractères';
  }
  if (!/^[A-Za-z0-9]{6,30}$/.test(ref)) {
    return 'Format de référence invalide (uniquement lettres et chiffres)';
  }
  if (operator === 'tmoney') {
    const tmoneyPattern = /^(TXV|TX|TV|TMO)[A-Za-z0-9]{5,27}$/i;
    const digitPattern = /^\d{10,20}$/;
    if (!tmoneyPattern.test(ref) && !digitPattern.test(ref)) {
      return 'Format T-Money invalide. La référence commence par TXV, TX, TV ou TMO, ou contient 10 à 20 chiffres';
    }
  }
  if (operator === 'flooz') {
    const floozPattern = /^(MO|MOMO|FLZ)[A-Za-z0-9]{5,27}$/i;
    const digitPattern = /^\d{10,20}$/;
    if (!floozPattern.test(ref) && !digitPattern.test(ref)) {
      return 'Format Flooz invalide. La référence commence par MO, MOMO ou FLZ, ou contient 10 à 20 chiffres';
    }
  }
  return null; // valide
}

router.post('/mobile', authMiddleware, async (req, res) => {
  const { operator, planId, planCode, phoneNumber, transactionRef, amount, email } = req.body;
  const userId = req.user.id;

  try {
    if (!operator || !OPERATEURS[operator]) {
      return res.status(400).json({ success: false, message: 'Opérateur invalide' });
    }

    const plan = getPlan(planId);
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Plan invalide' });
    }

    if (!phoneNumber || phoneNumber.length < 8) {
      return res.status(400).json({ success: false, message: 'Numéro de téléphone invalide' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis pour la confirmation' });
    }

    const refError = validateReference(operator, transactionRef);
    if (refError) {
      return res.status(400).json({ success: false, message: refError });
    }

    // Anti-reuse : vérifier que la référence n'a pas déjà été utilisée
    const existing = await prisma.subscription.findFirst({
      where: { reference: transactionRef },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Cette référence de transaction a déjà été utilisée',
      });
    }

    console.log(`Paiement ${OPERATEURS[operator].nom}:`, {
      userId, phone: `228${phoneNumber}`, montant: plan.prix, ref: transactionRef,
    });

    // TODO: Intégration API Mobile Money quand credentials disponibles
    // - T-Money API: documentation Moov Africa - *145#
    // - Flooz API: documentation Togocom - *155#
    // Le code ci-dessous active sur validation du format + unicité de la ref

    const now = new Date();
    const fin = new Date(now.getTime() + plan.duree * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: { actif: true, debut: now, fin, montant: plan.prix, reference: transactionRef },
      create: { userId, actif: true, debut: now, fin, montant: plan.prix, reference: transactionRef },
    });

    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { nom: true, prenom: true, email: true } });
      await sendSubscriptionEmail({
        to: email || user.email,
        nom: user.prenom,
        plan: planId,
        duree: plan.duree,
        montant: plan.prix,
        fin,
        reference: transactionRef,
      });
    } catch (emailErr) {
      console.error('Erreur email confirmation:', emailErr.message);
    }

    res.json({
      success: true,
      operator,
      transactionRef,
      subscription: {
        id: subscription.id,
        actif: true,
        debut: subscription.debut,
        fin: subscription.fin,
        montant: plan.prix,
      },
      message: `Abonnement activé avec succès via ${OPERATEURS[operator].nom}`,
    });
  } catch (error) {
    console.error('Erreur paiement:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du traitement du paiement.' });
  }
});

router.get('/verify/:transactionRef', authMiddleware, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { reference: req.params.transactionRef, userId: req.user.id },
    });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
    }
    res.json({ success: true, status: subscription.actif ? 'active' : 'inactive', subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la vérification' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'historique' });
  }
});

module.exports = router;
