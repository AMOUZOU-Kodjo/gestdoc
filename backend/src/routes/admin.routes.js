require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { cloudinary } = require("../middlewares/upload.middleware");
const { z } = require("zod");
const nodemailer = require("nodemailer"); // Assurez-vous d'avoir fait : npm install nodemailer

const router = express.Router();
const prisma = new PrismaClient();

// Configuration du transporteur Nodemailer (Exemple pour Gmail)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // false pour le port 587, true pour le 465
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse Gmail dans les variables d'env
    pass: process.env.EMAIL_PASS, // Votre "Mot de passe d'application" Google
  },
});

// Toutes les routes admin nécessitent auth + ADMIN sauf GET /settings
router.use((req, res, next) => {
  // GET /settings est public (footer en a besoin)
  if (req.method === "GET" && req.path === "/settings") return next();
  authMiddleware(req, res, () => requireRole("ADMIN")(req, res, next));
});

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalDocuments,
      totalDownloads,
      pendingDocuments,
      recentUploads,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.document.count({ where: { status: "APPROVED" } }),
      prisma.download.count(),
      prisma.document.count({ where: { status: "PENDING" } }),
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          titre: true,
          status: true,
          createdAt: true,
          uploader: { select: { nom: true, prenom: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);
    res.json({
      totalUsers,
      totalDocuments,
      totalDownloads,
      pendingDocuments,
      recentUploads,
      recentUsers,
    });
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
        include: {
          uploader: { select: { nom: true, prenom: true, email: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);
    res.json({
      documents,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.patch("/documents/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id))
      return res.status(400).json({ error: "ID invalide." });
    const { status } = z
      .object({ status: z.enum(["APPROVED", "REJECTED", "PENDING"]) })
      .parse(req.body);

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
    if (error.code === "P2025")
      return res.status(404).json({ error: "Document non trouvé." });
    if (error.name === "ZodError")
      return res.status(400).json({ error: "Statut invalide." });
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.delete("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id))
      return res.status(400).json({ error: "ID invalide." });
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document)
      return res.status(404).json({ error: "Document non trouvé." });
    if (document.publicId) {
      await cloudinary.uploader
        .destroy(document.publicId, { resource_type: "raw" })
        .catch(console.error);
    }
    await prisma.document.delete({ where: { id } });
    res.json({ message: "Document supprimé." });
  } catch {
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
    res.json({
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id))
      return res.status(400).json({ error: "ID invalide." });
    if (id === req.user.id)
      return res
        .status(400)
        .json({ error: "Vous ne pouvez pas modifier votre propre statut." });
    const data = z
      .object({
        isActive: z.boolean().optional(),
        role: z.enum(["USER", "ADMIN"]).optional(),
      })
      .parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    res.json(user);
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    if (error.name === "ZodError")
      return res.status(400).json({ error: "Données invalides." });
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get("/settings", async (req, res) => {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: "singleton" },
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const schema = z.object({
      siteName: z.string().min(2).max(100).trim().optional(),
      siteDescription: z.string().max(300).trim().optional(),
      contactEmail: z.string().email().optional(),
      maintenanceMode: z.boolean().optional(),
      allowUploads: z.boolean().optional(),
      maxFileSizeMb: z.number().int().min(1).max(100).optional(),
    });
    const data = schema.parse(req.body);
    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── Broadcast Email (MODIFIÉ : UTILISE NODEMAILER) ───────────────────────────
// router.post('/broadcast', async (req, res) => {
//   try {
//     const schema = z.object({
//       sujet:   z.string().min(3).max(200).trim(),
//       message: z.string().min(10).max(5000).trim(),
//       cible:   z.enum(['tous', 'actifs', 'BEPC', 'PREMIERE', 'TERMINALE', 'UNIVERSITE', 'ENSEIGNANT']).default('tous'),
//     });
//     const { sujet, message, cible } = schema.parse(req.body);

//     const where = {
//       isActive: true,
//       ...(cible !== 'tous' && cible !== 'actifs' && { profile: cible }),
//     };

//     const users = await prisma.user.findMany({
//       where,
//       select: { email: true },
//     });

//     if (users.length === 0) {
//       return res.status(400).json({ error: 'Aucun utilisateur trouvé pour cette cible.' });
//     }

//     const emailList = users.map(u => u.email).join(',');

//     const mailOptions = {
//       from: `"GestDoc Admin" <${process.env.EMAIL_USER}>`,
//       to: emailList,
//       subject: sujet,
//       html: `<div style="font-family: sans-serif; line-height: 1.5;">${message}</div>`
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//       console.log(`📧 Broadcast envoyé via Gmail à ${users.length} utilisateurs`);
//     } catch (mailError) {
//       console.error('Nodemailer Error:', mailError);
//       return res.status(500).json({ error: "L'envoi des emails a échoué." });
//     }

//     res.json({
//       success: true,
//       message: `Email envoyé à ${users.length} utilisateur(s).`,
//       count: users.length
//     });
//   } catch (error) {
//     if (error.name === 'ZodError') return res.status(400).json({ error: 'Données invalides.' });
//     console.error('Broadcast error:', error);
//     res.status(500).json({ error: "Erreur serveur lors du broadcast." });
//   }
// });

// router.post('/broadcast', async (req, res) => {
//   try {
//     const schema = z.object({
//       sujet:   z.string().min(3).max(200).trim(),
//       message: z.string().min(10).max(5000).trim(),
//       cible:   z.enum(['tous', 'actifs', 'BEPC', 'PREMIERE', 'TERMINALE', 'UNIVERSITE', 'ENSEIGNANT']).default('tous'),
//     });
//     const { sujet, message, cible } = schema.parse(req.body);

//     const where = {
//       isActive: true,
//       ...(cible !== 'tous' && cible !== 'actifs' && { profile: cible }),
//     };

//     const users = await prisma.user.findMany({
//       where,
//       select: { email: true },
//     });

//     if (users.length === 0) {
//       return res.status(400).json({ error: 'Aucun utilisateur trouvé pour cette cible.' });
//     }

//     // NOUVEAU CODE - Envoi un par un
//     let successCount = 0;
//     let failCount = 0;

//     res.setHeader('Content-Type', 'application/json');
// res.write(JSON.stringify({
//   status: 'processing',
//   message: `Début de l'envoi à ${users.length} utilisateurs...`
// }));

//     for (const user of users) {
//       try {
//         await transporter.sendMail({
//           from: `"GestDoc Admin" <${process.env.EMAIL_USER}>`,
//           to: user.email,
//           subject: sujet,
//           html: `<div style="font-family: sans-serif;">${message}</div>`
//         });
//         successCount++;
//         console.log(`✅ Email envoyé à ${user.email} (${successCount}/${users.length})`);
//       } catch (mailError) {
//         failCount++;
//         console.error(`❌ Échec pour ${user.email}:`, mailError.message);
//       }

//       // Attendre 1 seconde entre chaque email
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }

//     console.log(`📧 Broadcast terminé: ${successCount} succès, ${failCount} échecs`);

//     res.json({
//       success: true,
//       message: `Email envoyé à ${successCount} utilisateur(s) sur ${users.length}.`,
//       count: successCount,
//       failed: failCount
//     });
//   } catch (error) {
//     if (error.name === 'ZodError') return res.status(400).json({ error: 'Données invalides.' });
//     console.error('Broadcast error:', error);
//     res.status(500).json({ error: "Erreur serveur lors du broadcast." });
//   }
// });
router.post("/broadcast", async (req, res) => {
  try {
    const schema = z.object({
      sujet: z.string().min(3).max(200).trim(),
      message: z.string().min(10).max(5000).trim(),
      cible: z
        .enum([
          "tous",
          "actifs",
          "BEPC",
          "PREMIERE",
          "TERMINALE",
          "UNIVERSITE",
          "ENSEIGNANT",
        ])
        .default("tous"),
    });
    const { sujet, message, cible } = schema.parse(req.body);

    const where = {
      isActive: true,
      ...(cible !== "tous" && cible !== "actifs" && { profile: cible }),
    };

    const users = await prisma.user.findMany({
      where,
      select: { email: true },
    });

    if (users.length === 0) {
      return res
        .status(400)
        .json({ error: "Aucun utilisateur trouvé pour cette cible." });
    }

    // Traitement asynchrone sans bloquer la réponse
    res.json({
      success: true,
      message: `Début de l'envoi à ${users.length} utilisateurs. Les résultats seront logués.`,
      total: users.length,
    });

    // Continuer le traitement APRÈS avoir envoyé la réponse
    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        // await transporter.sendMail({
        //   from: `"GestDoc Admin" <${process.env.EMAIL_USER}>`,
        //   to: user.email,
        //   subject: sujet,
        //   html: `<div style="font-family: sans-serif;">${message}</div>`
        // });
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
        @media (max-width: 480px) { .content { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 GestDoc</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Plateforme documentaire</p>
        </div>
        <div class="content">
          <p>Bonjour,</p>
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
          // Version texte pour les clients qui ne supportent pas HTML
          text: `GestDoc\n\nBonjour,\n\n${message}\n\nCordialement,\nL'équipe GestDoc`,
        });
        successCount++;
        console.log(
          `✅ Email envoyé à ${user.email} (${successCount + failCount}/${users.length})`,
        );
      } catch (mailError) {
        failCount++;
        console.error(`❌ Échec pour ${user.email}:`, mailError.message);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `📦 Broadcast final: ${successCount} succès, ${failCount} échecs sur ${users.length}`,
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Données invalides." });
    }
    console.error("Broadcast error:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: "Erreur serveur lors du broadcast." });
    }
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
      })),
    );
  } catch {
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
      update: {
        actif: true,
        debut,
        fin,
        montant,
        reference: reference || null,
      },
      create: {
        userId,
        actif: true,
        debut,
        fin,
        montant,
        reference: reference || null,
      },
      include: { user: { select: { nom: true, prenom: true, email: true } } },
    });

    res.status(201).json(sub);
  } catch (error) {
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
  } catch {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;
