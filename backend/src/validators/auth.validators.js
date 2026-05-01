// src/validators/auth.validators.js
const { z } = require('zod');

const registerSchema = z.object({
  nom: z.string().min(2, 'Le nom doit avoir au moins 2 caractères').max(100).trim(),
  prenom: z.string().min(2, 'Le prénom doit avoir au moins 2 caractères').max(100).trim(),
  email: z.string().email('Email invalide').toLowerCase().trim(),
  password: z.string()
    .min(8, 'Le mot de passe doit avoir au moins 8 caractères')
    .max(128)
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase().trim(),
  password: z.string().min(1, 'Mot de passe requis').max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

module.exports = { registerSchema, loginSchema, refreshSchema };
