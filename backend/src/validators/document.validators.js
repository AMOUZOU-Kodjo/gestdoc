// src/validators/document.validators.js
const { z } = require('zod');

const CLASSES = ['TleA', 'TleCD', '1ereA', '1ereCD', '3eme'];
const MATIERES = ['Mathematiques', 'Sciences Physiques', 'SVT', 'Francais', 'Anglais', 'Histoire-Geographie', 'Philosophie', 'Allemand/Espagnol'];

const uploadDocumentSchema = z.object({
  titre: z.string().min(3, 'Titre trop court (min 3 caractères)').max(150).trim(),
  description: z.string().max(500).trim().optional().or(z.literal('')),
  classe: z.enum(CLASSES, { errorMap: () => ({ message: 'Classe invalide' }) }),
  matiere: z.enum(MATIERES, { errorMap: () => ({ message: 'Matière invalide' }) }),
  annee: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1),
});

const filterSchema = z.object({
  classe: z.string().optional(),
  matiere: z.string().optional(),
  annee: z.coerce.number().int().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

module.exports = { uploadDocumentSchema, filterSchema, CLASSES, MATIERES };
