// src/routes/payments.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Veuillez vous authentifier',
      code: 'UNAUTHORIZED'
    });
  }
};

// Fonction pour appeler l'API T-Money (simulée)
async function callTMoneyAPI(data) {
  console.log('📱 Traitement paiement T-Money:', {
    phone: data.phoneNumber,
    amount: data.amount,
    reference: data.reference
  });
  
  // Simulation pour les tests
  // ⚠️ À remplacer par la vraie API T-Money en production
  return {
    success: true,
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: "Paiement simulé avec succès"
  };
}

// Route pour traiter le paiement mobile
router.post('/mobile', auth, async (req, res) => {
  const { planId, planCode, phoneNumber, pinCode, amount } = req.body;
  const userId = req.user.id;
  
  try {
    // Validation des données
    if (!phoneNumber || phoneNumber.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Numéro de téléphone invalide"
      });
    }

    if (!pinCode || pinCode.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Code PIN invalide (4 chiffres requis)"
      });
    }

    // Appel à l'API T-Money
    const paymentResponse = await callTMoneyAPI({
      phoneNumber: `228${phoneNumber}`,
      pinCode: pinCode,
      amount: amount,
      reference: `${planCode}_${userId}_${Date.now()}`
    });
    
    if (paymentResponse.success) {
      // Calcul des dates d'abonnement
      const duration = getPlanDuration(planId);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      // Enregistrer l'abonnement dans la base de données
      const subscription = await prisma.subscription.create({
        data: {
          userId: userId,
          planId: planId,
          planCode: planCode,
          startDate: startDate,
          endDate: endDate,
          transactionId: paymentResponse.transactionId,
          amount: amount,
          status: 'active',
          paymentMethod: 'T-MONEY',
          paymentPhone: phoneNumber
        }
      });

      // Mettre à jour l'utilisateur avec les téléchargements illimités
      await prisma.user.update({
        where: { id: userId },
        data: { 
          hasUnlimitedDownloads: true,
          subscriptionEndDate: endDate
        }
      });

      res.json({ 
        success: true, 
        transactionId: paymentResponse.transactionId,
        subscription: subscription,
        message: "Abonnement activé avec succès"
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: paymentResponse.error || "Paiement refusé" 
      });
    }
  } catch (error) {
    console.error('❌ Erreur paiement:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du traitement du paiement. Veuillez réessayer." 
    });
  }
});

// Fonction helper pour obtenir la durée d'un plan
function getPlanDuration(planId) {
  const durations = {
    'weekly': 7,
    'monthly': 30,
    'quarterly': 90,
    '1 Semaine': 7,
    '1 Mois': 30,
    '3 Mois': 90
  };
  return durations[planId] || 0;
}

// Route pour vérifier le statut d'un paiement
router.get('/verify/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const subscription = await prisma.subscription.findFirst({
      where: { 
        transactionId: transactionId,
        userId: req.user.id
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Transaction non trouvée"
      });
    }

    res.json({ 
      success: true, 
      status: subscription.status,
      subscription: subscription
    });
  } catch (error) {
    console.error('❌ Erreur vérification:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la vérification" 
    });
  }
});

// Route pour obtenir l'historique des paiements de l'utilisateur
router.get('/history', auth, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      subscriptions: subscriptions
    });
  } catch (error) {
    console.error('❌ Erreur historique:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique"
    });
  }
});

module.exports = router;