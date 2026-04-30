// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@2024!', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gestdoc.tg' },
    update: {},
    create: {
      nom: 'Admin',
      prenom: 'GestDoc',
      email: 'admin@gestdoc.tg',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin créé:', admin.email);
  console.log('🔑 Mot de passe: Admin@2024!');
  console.log('⚠️  Changez ce mot de passe en production!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
