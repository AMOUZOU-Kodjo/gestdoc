// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const User = require('../models/User');

router.post('/broadcast', async (req, res) => {
  try {
    const { sujet, message, cible } = req.body;
    
    // Validation
    if (!sujet?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Sujet et message requis' });
    }
    
    // Récupérer les utilisateurs selon la cible
    let query = {};
    switch(cible) {
      case 'actifs':
        query = { isActive: true };
        break;
      case 'BEPC':
      case 'PREMIERE':
      case 'TERMINALE':
      case 'UNIVERSITE':
        query = { niveau: cible };
        break;
      case 'ENSEIGNANT':
        query = { role: 'enseignant' };
        break;
      case 'tous':
      default:
        query = {};
    }
    
    // Récupérer uniquement les emails valides
    const users = await User.find(query).select('email -_id');
    const emails = users.map(u => u.email).filter(email => email && email.includes('@'));
    
    if (emails.length === 0) {
      return res.status(400).json({ error: 'Aucun utilisateur trouvé avec un email valide' });
    }
    
    console.log(`📧 Envoi à ${emails.length} utilisateurs...`);
    
    // Envoi des emails avec Resend
    const results = await emailService.sendMassEmail(emails, sujet, message);
    const successCount = results.filter(r => r.success).length;
    const failedEmails = results.filter(r => !r.success).map(r => r.email);
    
    console.log(`✅ ${successCount}/${emails.length} emails envoyés avec succès`);
    
    res.json({
      success: true,
      count: successCount,
      total: emails.length,
      failedCount: emails.length - successCount,
      failedEmails: failedEmails.slice(0, 10),
      message: `Email envoyé à ${successCount}/${emails.length} utilisateurs`,
      preview: { sujet, cible }
    });
    
  } catch (error) {
    console.error('Erreur broadcast:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des emails: ' + error.message });
  }
});

module.exports = router;