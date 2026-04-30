# 🎓 GestDoc — Plateforme de Gestion de Documents Scolaires

Application fullstack ReactJS + Node.js/Express + PostgreSQL pour le partage de documents scolaires.

## 🛠 Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18, Tailwind CSS, DaisyUI, Lucide React, React Router v6 |
| État/Cache | TanStack React Query |
| Backend | Node.js 20, Express 4 |
| Base de données | PostgreSQL (Prisma ORM) |
| Auth | JWT (access 15min + refresh 7j) |
| Stockage fichiers | Cloudinary |
| Validation | Zod |
| Sécurité | Helmet, CORS, express-rate-limit, bcryptjs |

---

## 🚀 Installation locale

### 1. Prérequis
- Node.js 18+
- PostgreSQL (ou compte Neon.tech gratuit)
- Compte Cloudinary (gratuit)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Remplir les variables dans .env
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js    # Crée l'admin par défaut
npm run dev
```

**Admin par défaut :**
- Email : `admin@gestdoc.tg`
- Mot de passe : `Admin@2024!`  
⚠️ **Changez ce mot de passe immédiatement !**

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000
npm run dev
```

L'application tourne sur : http://localhost:5173

---

## 📁 Structure du projet

```
gestdoc/
├── frontend/          ← React + Vite
│   ├── src/
│   │   ├── components/    (Navbar, DocumentCard, FilterBar)
│   │   ├── pages/         (Home, Login, Register, Upload, Profile)
│   │   │   └── admin/     (Dashboard, Documents, Users)
│   │   ├── contexts/      (AuthContext)
│   │   ├── services/      (api.js - Axios configuré)
│   │   └── utils/         (constants.js)
│   └── ...
└── backend/           ← Express API
    ├── src/
    │   ├── routes/        (auth, documents, users, admin)
    │   ├── middlewares/   (auth, role, upload)
    │   └── validators/    (Zod schemas)
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.js
    └── ...
```

---

## 🌐 Déploiement gratuit

### Frontend → Vercel

1. Pusher le dossier `frontend/` sur GitHub
2. Importer dans Vercel (vercel.com)
3. Ajouter la variable : `VITE_API_URL=https://votre-api.onrender.com`
4. Le fichier `vercel.json` gère le routing SPA

### Backend → Render

1. Pusher le dossier `backend/` sur GitHub
2. Créer un "Web Service" sur render.com
3. Build : `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start : `npm start`
5. Ajouter toutes les variables d'environnement

### Base de données → Neon.tech

1. Créer un projet sur neon.tech (gratuit)
2. Copier la `DATABASE_URL` dans les variables Render

### Stockage → Cloudinary

1. Créer un compte sur cloudinary.com (gratuit)
2. Récupérer `cloud_name`, `api_key`, `api_secret`

---

## 🔒 Sécurité

- **Mots de passe** : bcrypt avec saltRounds=12
- **JWT** : access token (15min) + refresh token (7j, rotation)
- **Rate limiting** : 5 tentatives/15min sur login, 200 req/15min global
- **Validation** : Zod sur toutes les routes API
- **Upload** : vérification MIME type côté serveur, max 20Mo
- **Injection SQL** : Prisma (requêtes paramétrées uniquement)
- **Headers** : Helmet.js (CSP, HSTS, X-Frame-Options...)
- **CORS** : liste blanche des origines

---

## 📚 API Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Non | Inscription |
| POST | `/api/auth/login` | Non | Connexion |
| POST | `/api/auth/refresh` | Non | Renouveler token |
| POST | `/api/auth/logout` | Non | Déconnexion |
| GET | `/api/documents` | Non | Liste (filtrée) |
| GET | `/api/documents/:id` | Non | Détail |
| GET | `/api/documents/:id/download` | Oui | URL téléchargement |
| POST | `/api/documents/upload` | Oui | Upload fichier |
| GET | `/api/documents/my/uploads` | Oui | Mes uploads |
| GET | `/api/users/me` | Oui | Mon profil |
| PATCH | `/api/users/me` | Oui | Modifier profil |
| PATCH | `/api/users/me/password` | Oui | Modifier mot de passe |
| GET | `/api/admin/stats` | Admin | Statistiques |
| GET | `/api/admin/documents` | Admin | Tous les documents |
| PATCH | `/api/admin/documents/:id/status` | Admin | Valider/Refuser |
| DELETE | `/api/admin/documents/:id` | Admin | Supprimer |
| GET | `/api/admin/users` | Admin | Tous les utilisateurs |
| PATCH | `/api/admin/users/:id` | Admin | Modifier utilisateur |

---

## 🎓 Classes et Matières disponibles

**Classes :** Terminale A, Terminale C&D, Première A, Première C&D, Troisième

**Matières :** Mathématiques, Sciences Physiques, SVT, Français, Anglais, Histoire-Géographie, Philosophie, Allemand/Espagnol
