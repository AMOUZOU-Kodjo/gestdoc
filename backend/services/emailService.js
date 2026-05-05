const { Resend } = require('resend');

// Initialiser Resend avec votre clé API
const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  async sendMassEmail(emails, subject, message) {
    const results = [];
    
    // Resend peut envoyer à plusieurs destinataires en une seule requête
    // Mais limité à 100 par appel, donc on fait des batches
    const batchSize = 100;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      try {
        const { data, error } = await resend.emails.send({
          from: `GestDoc <${process.env.RESEND_FROM_EMAIL}>`, // Doit être un domaine vérifié
          to: batch,
          subject: subject,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">${subject}</h2>
              <div style="white-space: pre-wrap; line-height: 1.6;">
                ${message.replace(/\n/g, '<br/>')}
              </div>
              <hr style="margin: 20px 0; border-color: #e5e7eb;" />
              <p style="color: #6b7280; font-size: 12px;">
                Cet email a été envoyé depuis GestDoc - Plateforme de gestion documentaire
              </p>
            </div>
          `,
        });
        
        if (error) {
          // Si erreur, on essaye un par un pour identifier les problèmes
          for (const email of batch) {
            try {
              const { data: singleData, error: singleError } = await resend.emails.send({
                from: `GestDoc <${process.env.RESEND_FROM_EMAIL}>`,
                to: [email],
                subject: subject,
                text: message,
                html: message.replace(/\n/g, '<br/>'),
              });
              
              results.push({
                email,
                success: !singleError,
                messageId: singleData?.id,
                error: singleError?.message
              });
            } catch (err) {
              results.push({ email, success: false, error: err.message });
            }
          }
        } else {
          // Succès pour tout le batch
          batch.forEach(email => {
            results.push({
              email,
              success: true,
              messageId: data?.id
            });
          });
        }
        
        // Pause entre les batches pour éviter le rate limiting
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error('Erreur batch Resend:', error);
        batch.forEach(email => {
          results.push({ email, success: false, error: error.message });
        });
      }
    }
    
    return results;
  }

  // Méthode pour envoyer un seul email (test)
  async sendSingleEmail(to, subject, message) {
    try {
      const { data, error } = await resend.emails.send({
        from: `GestDoc <${process.env.RESEND_FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        text: message,
        html: message.replace(/\n/g, '<br/>'),
      });
      
      if (error) throw error;
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Erreur envoi single:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();