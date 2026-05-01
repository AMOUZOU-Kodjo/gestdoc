<<<<<<< HEAD
const { z } = require('zod');

const NIVEAUX  = ['BEPC','PREMIERE','TERMINALE','UNIVERSITE'];
const CLASSES  = ['3eme','1ereA','1ereCD','TleA','TleCD','L1','L2','L3','M1','M2','BTS','DUT','CPGE'];
const MATIERES = [
  'Mathematiques','Sciences Physiques','SVT','Francais','Anglais',
  'Histoire-Geographie','Philosophie','Allemand/Espagnol',
  'Informatique','Physique','Chimie','Biologie','Droit',
  'Economie','Gestion','Lettres','Sciences Sociales',
];

const uploadDocumentSchema = z.object({
  titre:       z.string().min(3).max(150).trim(),
  description: z.string().max(500).trim().optional().or(z.literal('')),
  niveau:      z.enum(NIVEAUX, { errorMap: () => ({ message: 'Niveau invalide' }) }),
  classe:      z.string().min(1, 'Classe requise'),
  matiere:     z.string().min(1, 'Matière requise'),
  annee:       z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1),
});

const filterSchema = z.object({
  niveau:  z.string().optional(),
  classe:  z.string().optional(),
  matiere: z.string().optional(),
  annee:   z.coerce.number().int().optional(),
  search:  z.string().max(100).optional(),
  page:    z.coerce.number().int().min(1).default(1),
  limit:   z.coerce.number().int().min(1).max(50).default(12),
  status:  z.enum(['PENDING','APPROVED','REJECTED']).optional(),
});

module.exports = { uploadDocumentSchema, filterSchema, NIVEAUX, CLASSES, MATIERES };
=======
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
>>>>>>> 8767c594b5f953f1951d0b52cd7f38815697b7cc
