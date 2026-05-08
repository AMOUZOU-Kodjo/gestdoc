require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { cloudinary } = require("../middlewares/upload.middleware");
const { z } = require("zod");
const nodemailer = require("nodemailer");

const router = express.Router();
const prisma = new PrismaClient();

// ─── Configuration du transporteur Nodemailer ─────────────────────────────────
// DÉCOMMENTEZ ET CONFIGUREZ CECI
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // false pour 587, true pour 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Pour le développement uniquement
  },
});

// Vérifier la connexion SMTP au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erreur de connexion SMTP:", error.message);
    console.log("⚠️ Le service d'email ne fonctionnera pas correctement");
  } else {
    console.log("✅ Serveur SMTP prêt à envoyer des emails");
  }
});

// Toutes les routes admin nécessitent auth + ADMIN sauf GET /settings
router.use((req, res, next) => {
  if (req.method === "GET" && req.path === "/settings") return next();
  authMiddleware(req, res, () => requireRole("ADMIN")(req, res, next));
});

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalDocuments, totalDownloads, pendingDocuments, recentUploads, recentUsers] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.document.count({ where: { status: "APPROVED" } }),
      prisma.download.count(),
      prisma.document.count({ where: { status: "PENDING" } }),
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, titre: true, status: true, createdAt: true, uploader: { select: { nom: true, prenom: true } } },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, nom: true, prenom: true, email: true, createdAt: true },
      }),
    ]);
    res.json({ totalUsers, totalDocuments, totalDownloads, pendingDocuments, recentUploads, recentUsers });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── Documents ────────────────────────────────────────────────────────────────
router.get("/documents", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const status = req.query.status;
    const search = req.query.search;
    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { titre: { contains: search, mode: "insensitive" } },
          { uploader: { email: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { uploader: { select: { nom: true, prenom: true, email: true } } },
      }),
      prisma.document.count({ where }),
    ]);
    res.json({ documents, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.patch("/documents/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "ID invalide." });
    const { status } = z.object({ status: z.enum(["APPROVED", "REJECTED", "PENDING"]) }).parse(req.body);

    const document = await prisma.document.update({
      where: { id },
      data: { status },
      select: { id: true, titre: true, status: true, uploaderId: true },
    });

    if (status === "APPROVED") {
      const { addBonusDownloads } = require("../services/quota.service");
      await addBonusDownloads(document.uploaderId, 2);
    }

    res.json(document);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Document non trouvé." });
    if (error.name === "ZodError") return res.status(400).json({ error: "Statut invalide." });
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.delete("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "ID invalide." });
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return res.status(404).json({ error: "Document non trouvé." });
    if (document.publicId) {
      await cloudinary.uploader.destroy(document.publicId, { resource_type: "raw" }).catch(console.error);
    }
    await prisma.document.delete({ where: { id } });
    res.json({ message: "Document supprimé." });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const search = req.query.search;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { nom: { contains: search, mode: "insensitive" } },
            { prenom: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { documents: true, downloads: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "ID invalide." });
    if (id === req.user.id) return res.status(400).json({ error: "Vous ne pouvez pas modifier votre propre statut." });
    const data = z.object({ isActive: z.boolean().optional(), role: z.enum(["USER", "ADMIN"]).optional() }).parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nom: true, prenom: true, email: true, role: true, isActive: true },
    });
    res.json(user);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Utilisateur non trouvé." });
    if (error.name === "ZodError") return res.status(400).json({ error: "Données invalides." });
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get("/settings", async (req, res) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "singleton" } });
    }
    res.json(settings);
  } catch (error) {
    console.error("Settings get error:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const schema = z.object({
      siteName: z.string().min(2).max(100).trim().optional(),
      siteDescription: z.string().max(300).trim().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().max(30).trim().optional(),
      contactAddress: z.string().max(200).trim().optional(),
      facebookUrl: z.string().url().or(z.literal("")).optional(),
      twitterUrl: z.string().url().or(z.literal("")).optional(),
      instagramUrl: z.string().url().or(z.literal("")).optional(),
      youtubeUrl: z.string().url().or(z.literal("")).optional(),
      maintenanceMode: z.boolean().optional(),
      allowUploads: z.boolean().optional(),
      maxFileSizeMb: z.number().int().min(1).max(100).optional(),
      donActif: z.boolean().optional(),
      donTitre: z.string().max(100).trim().optional(),
      donMessage: z.string().max(500).trim().optional(),
      donNumero: z.string().max(20).trim().optional(),
      donNom: z.string().max(100).trim().optional(),
      donMontants: z.string().max(100).trim().optional(),
    });
    const data = schema.parse(req.body);
    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });
    res.json(settings);
  } catch (error) {
    if (error.name === "ZodError")
      return res.status(400).json({
        error: "Données invalides.",
        details: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
      });
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── Broadcast Email (CORRIGÉ - transporter maintenant défini) ─────────────────
router.post("/broadcast", async (req, res) => {
  try {
    const schema = z.object({
      sujet: z.string().min(3).max(200).trim(),
      message: z.string().min(10).max(5000).trim(),
      cible: z
        .enum(["tous", "actifs", "BEPC", "PREMIERE", "TERMINALE", "UNIVERSITE", "ENSEIGNANT"])
        .default("tous"),
      schedule: z.string().optional(),
      scheduleDate: z.string().optional(),
      scheduleTime: z.string().optional(),
    });
    const { sujet, message, cible, schedule, scheduleDate, scheduleTime } = schema.parse(req.body);

    const where = {
      isActive: true,
      ...(cible !== "tous" && cible !== "actifs" && { profile: cible }),
    };

    const users = await prisma.user.findMany({
      where,
      select: { email: true, prenom: true, nom: true },
    });

    if (users.length === 0) {
      return res.status(400).json({ error: "Aucun utilisateur trouvé pour cette cible." });
    }

    // Planification (optionnelle)
    if (schedule === "later" && scheduleDate && scheduleTime) {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (scheduledDateTime > new Date()) {
        // Ici vous pouvez sauvegarder dans une table scheduled_emails
        return res.json({
          success: true,
          scheduled: true,
          scheduledFor: scheduledDateTime,
          count: users.length,
          message: `Email programmé pour le ${scheduledDateTime.toLocaleString("fr-FR")}`,
        });
      }
    }

    // Envoi immédiat
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Réponse immédiate pour ne pas faire attendre le client
    res.json({
      success: true,
      message: `Début de l'envoi à ${users.length} utilisateurs.`,
      total: users.length,
    });

    // Envoi des emails (maintenant transporter est défini !)
    for (const user of users) {
      try {
        await transporter.sendMail({
          from: `"GestDoc" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: sujet,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
                .header h1 { margin: 0; color: white; font-size: 24px; }
                .content { padding: 40px 30px; line-height: 1.6; color: #333; }
                .message { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📚 GestDoc</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Plateforme documentaire</p>
                </div>
                <div class="content">
                  <p>Bonjour <strong>${user.prenom || ""} ${user.nom || ""}</strong>,</p>
                  <div class="message">
                    ${message.replace(/\n/g, "<br>")}
                  </div>
                  <p style="margin-top: 25px;">
                    Cordialement,<br>
                    <strong>L'équipe GestDoc</strong>
                  </p>
                </div>
                <div class="footer">
                  <p>Cet email a été envoyé automatiquement par GestDoc.</p>
                  <p>© ${new Date().getFullYear()} GestDoc - Tous droits réservés</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `GestDoc\n\nBonjour ${user.prenom || ""} ${user.nom || ""},\n\n${message}\n\nCordialement,\nL'équipe GestDoc`,
        });
        successCount++;
        console.log(`✅ Email envoyé à ${user.email} (${successCount + failCount}/${users.length})`);
      } catch (mailError) {
        failCount++;
        errors.push({ email: user.email, error: mailError.message });
        console.error(`❌ Échec pour ${user.email}:`, mailError.message);
      }

      // Pause entre les emails pour éviter le rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`📦 Broadcast final: ${successCount} succès, ${failCount} échecs sur ${users.length}`);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Données invalides." });
    }
    console.error("Broadcast error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Erreur serveur lors du broadcast." });
    }
  }
});

// ─── Broadcast Stats ──────────────────────────────────────────────────────────
router.get("/broadcast/stats", async (req, res) => {
  try {
    const [total, actifs, BEPC, PREMIERE, TERMINALE, UNIVERSITE, ENSEIGNANT] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { profile: "BEPC" } }),
      prisma.user.count({ where: { profile: "PREMIERE" } }),
      prisma.user.count({ where: { profile: "TERMINALE" } }),
      prisma.user.count({ where: { profile: "UNIVERSITE" } }),
      prisma.user.count({ where: { profile: "ENSEIGNANT" } }),
    ]);

    res.json({ total, actifs, BEPC, PREMIERE, TERMINALE, UNIVERSITE, ENSEIGNANT });
  } catch (error) {
    console.error("Broadcast stats error:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── Abonnements ──────────────────────────────────────────────────────────────
router.get("/subscriptions", async (req, res) => {
  try {
    const now = new Date();
    const subs = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true } },
      },
    });
    res.json(
      subs.map((s) => ({
        ...s,
        isActive: s.actif && new Date(s.fin) > now,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.post("/subscriptions", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      dureeJours: z.number().int().min(1).max(365).default(30),
      montant: z.number().int().min(0),
      reference: z.string().max(100).optional(),
    });
    const { userId, dureeJours, montant, reference } = schema.parse(req.body);

    const debut = new Date();
    const fin = new Date(debut.getTime() + dureeJours * 24 * 60 * 60 * 1000);

    const sub = await prisma.subscription.upsert({
      where: { userId },
      update: { actif: true, debut, fin, montant, reference: reference || null },
      create: { userId, actif: true, debut, fin, montant, reference: reference || null },
      include: { user: { select: { nom: true, prenom: true, email: true } } },
    });

    res.status(201).json(sub);
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: "Données invalides." });
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.delete("/subscriptions/:userId", async (req, res) => {
  try {
    await prisma.subscription.update({
      where: { userId: req.params.userId },
      data: { actif: false },
    });
    res.json({ message: "Abonnement révoqué." });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Abonnement non trouvé." });
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── Envoi de rappel d'expiration ──────────────────────────────────────────────
router.post("/subscriptions/:userId/remind", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur a un abonnement actif
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { user: true }
    });
    
    if (!subscription) {
      return res.status(404).json({ error: "Abonnement non trouvé" });
    }
    
    if (!subscription.actif) {
      return res.status(400).json({ error: "Cet abonnement n'est pas actif" });
    }
    
    const daysUntilExpiry = Math.ceil((new Date(subscription.fin) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry > 7) {
      return res.status(400).json({ error: `L'abonnement expire dans ${daysUntilExpiry} jours, pas encore critique` });
    }
    
    // Envoyer l'email de rappel
    const transporter = require("nodemailer").createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; text-align: center; }
          .header h1 { margin: 0; color: white; font-size: 24px; }
          .content { padding: 40px 30px; line-height: 1.6; color: #333; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
          .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Votre abonnement expire bientôt</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${subscription.user.prenom} ${subscription.user.nom}</strong>,</p>
            <div class="warning-box">
              <p style="margin: 0; font-weight: bold;">Votre abonnement expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''} !</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Date d'expiration : ${new Date(subscription.fin).toLocaleDateString('fr-FR')}</p>
            </div>
            <p>Pour continuer à profiter de tous les avantages de GestDoc, pensez à renouveler votre abonnement dès maintenant.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/abonnement" class="button">✨ Renouveler mon abonnement</a>
            </div>
            <p style="margin-top: 25px;">
              Cordialement,<br>
              <strong>L'équipe GestDoc</strong>
            </p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par GestDoc.</p>
            <p>© ${new Date().getFullYear()} GestDoc - Plateforme documentaire</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: `"GestDoc" <${process.env.EMAIL_USER}>`,
      to: subscription.user.email,
      subject: `⚠️ Votre abonnement GestDoc expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`,
      html,
    });
    
    console.log(`✅ Rappel d'expiration envoyé à ${subscription.user.email}`);
    res.json({ success: true, message: `Rappel envoyé à ${subscription.user.email}` });
    
  } catch (error) {
    console.error("Reminder error:", error);
    res.status(500).json({ error: "Erreur lors de l'envoi du rappel" });
  }
});

module.exports = router;