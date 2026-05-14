const nodemailer = require('nodemailer');

const getTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"GestDoc" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

const sendContactEmail = async ({ nom, name, email, phone, sujet, subject, message, trackingId }) => {
  const senderName = nom || name || 'Visiteur';
  const emailSubject = sujet || subject || 'Contact GestDoc';
  const adminEmail = process.env.EMAIL_USER || 'phipsipy@gmail.com';
  const fromEmail = process.env.EMAIL_USER;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"GestDoc Contact" <${fromEmail}>`,
    to: adminEmail,
    replyTo: email,
    subject: `[GestDoc Contact] ${emailSubject}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#2563EB,#1D4ED8);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">📬 Nouveau message de contact</h1>
          ${trackingId ? `<p style="color:white/70;font-size:12px;margin:8px 0 0;font-family:monospace;">${trackingId}</p>` : ''}
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;"><strong>Nom :</strong></td><td style="padding:8px 0;font-size:14px;">${senderName}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;"><strong>Email :</strong></td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}" style="color:#2563EB;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;"><strong>Téléphone :</strong></td><td style="padding:8px 0;font-size:14px;">${phone}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;"><strong>Sujet :</strong></td><td style="padding:8px 0;font-size:14px;">${emailSubject}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
          <h3 style="color:#374151;font-size:14px;margin:0 0 8px;">Message :</h3>
          <div style="background:#f3f4f6;border-left:4px solid #2563EB;padding:16px;border-radius:0 8px 8px 0;font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap;">${message}</div>
          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Répondez directement à cet email pour contacter ${senderName}.</p>
        </div>
      </div>
    `,
  });

  await transporter.sendMail({
    from: `"GestDoc" <${fromEmail}>`,
    to: email,
    subject: `✅ Votre message a bien été reçu — GestDoc`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#2563EB,#1D4ED8);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">✅ Message reçu !</h1>
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;">
          <p style="color:#374151;font-size:15px;">Bonjour <strong>${senderName}</strong>,</p>
          <p style="color:#374151;font-size:14px;line-height:1.7;">Nous avons bien reçu votre message concernant <strong>"${emailSubject}"</strong>. Notre équipe vous répondra dans les plus brefs délais.</p>
          ${trackingId ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin:16px 0;font-size:13px;color:#1e40af;"><strong>N° de suivi :</strong> <span style="font-family:monospace;">${trackingId}</span></div>` : ''}
          <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;font-size:13px;color:#374151;white-space:pre-wrap;">${message}</div>
          <p style="color:#6b7280;font-size:13px;">Merci de faire confiance à GestDoc 📚</p>
        </div>
      </div>
    `,
  });
};

const sendBroadcastEmail = async ({ to, prenom, sujet, message }) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"GestDoc" <${process.env.EMAIL_USER}>`,
    to,
    subject: sujet,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📚 GestDoc</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Plateforme documentaire</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="color: #374151;">Bonjour <strong>${prenom}</strong>,</p>
          <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0; border-radius: 4px; font-size: 14px; line-height: 1.8; color: #374151; white-space: pre-wrap;">${message}</div>
          <p style="margin-top: 25px;">Cordialement,<br><strong>L'équipe GestDoc</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">GestDoc — Plateforme de partage de documents scolaires<br>Lomé, Togo</p>
        </div>
      </div>
    `,
  });
};

const sendSubscriptionEmail = async ({ to, nom, plan, duree, montant, fin, reference }) => {
  const transporter = getTransporter();
  const planLabel = { weekly: '1 Semaine', monthly: '1 Mois', quarterly: '3 Mois' }[plan] || plan;
  const finDate = new Date(fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  await transporter.sendMail({
    from: `"GestDoc" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Confirmation de votre abonnement GestDoc — ${planLabel}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#2563EB,#1D4ED8);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">Abonnement activé</h1>
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;">
          <p style="color:#374151;font-size:15px;">Bonjour <strong>${nom}</strong>,</p>
          <p style="color:#374151;font-size:14px;line-height:1.7;">Votre abonnement <strong>${planLabel}</strong> a été activé avec succès.</p>
          <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr><td style="padding:4px 8px;color:#6b7280;">Plan</td><td style="padding:4px 8px;font-weight:600;">${planLabel}</td></tr>
              <tr><td style="padding:4px 8px;color:#6b7280;">Durée</td><td style="padding:4px 8px;font-weight:600;">${duree} jours</td></tr>
              <tr><td style="padding:4px 8px;color:#6b7280;">Montant</td><td style="padding:4px 8px;font-weight:600;">${montant.toLocaleString('fr-FR')} FCFA</td></tr>
              <tr><td style="padding:4px 8px;color:#6b7280;">Expire le</td><td style="padding:4px 8px;font-weight:600;">${finDate}</td></tr>
              <tr><td style="padding:4px 8px;color:#6b7280;">Référence</td><td style="padding:4px 8px;font-family:monospace;font-size:12px;">${reference}</td></tr>
            </table>
          </div>
          <p style="color:#6b7280;font-size:13px;">Vous avez désormais un accès illimité à tous les documents de la plateforme.</p>
          <p style="color:#6b7280;font-size:13px;">Merci de faire confiance à GestDoc !</p>
        </div>
      </div>
    `,
  });
};

const verifyEmailConfig = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ Email service configuré (Nodemailer)');
    return true;
  } catch (err) {
    console.warn('⚠️  Email service non configuré:', err.message);
    return false;
  }
};

module.exports = { sendContactEmail, sendBroadcastEmail, sendSubscriptionEmail, verifyEmailConfig, sendEmail };
