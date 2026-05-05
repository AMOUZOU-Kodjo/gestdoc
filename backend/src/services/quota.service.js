const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FREE_DOWNLOADS = 2;

async function checkDownloadAccess(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, role: true, downloadQuota: true,
      subscription: { select: { actif: true, fin: true } },
      _count: { select: { downloads: true } },
    },
  });

  if (!user) return { canDownload: false, reason: 'Utilisateur introuvable.' };

  if (user.role === 'ADMIN') {
    return { canDownload: true, reason: 'admin', remaining: -1, hasSubscription: false };
  }

  const now = new Date();
  const hasSubscription = !!(
    user.subscription?.actif && user.subscription?.fin &&
    new Date(user.subscription.fin) > now
  );

  if (hasSubscription) {
    return { canDownload: true, reason: 'subscription', remaining: -1, hasSubscription: true };
  }

  const totalAllowed = FREE_DOWNLOADS + (user.downloadQuota || 0);
  const used = user._count.downloads;
  const remaining = totalAllowed - used;

  if (remaining > 0) {
    return { canDownload: true, reason: 'quota', remaining, hasSubscription: false };
  }

  return {
    canDownload: false, reason: 'quota_exceeded',
    remaining: 0, hasSubscription: false, totalAllowed, used,
  };
}

async function addBonusDownloads(userId, amount = 2) {
  await prisma.user.update({
    where: { id: userId },
    data: { downloadQuota: { increment: amount } },
  });
}

async function getUserQuotaStatus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true, downloadQuota: true,
      subscription: { select: { actif: true, fin: true, debut: true, montant: true } },
      _count: { select: { downloads: true } },
    },
  });
  if (!user) return null;

  const now = new Date();
  const hasSubscription = !!(
    user.subscription?.actif && new Date(user.subscription.fin) > now
  );
  const totalAllowed = user.role === 'ADMIN' ? -1 : FREE_DOWNLOADS + (user.downloadQuota || 0);
  const used = user._count.downloads;

  return {
    isAdmin: user.role === 'ADMIN',
    hasSubscription,
    subscription: hasSubscription ? user.subscription : null,
    freeDownloads: FREE_DOWNLOADS,
    bonusDownloads: user.downloadQuota || 0,
    totalAllowed,
    used,
    remaining: totalAllowed === -1 ? -1 : Math.max(0, totalAllowed - used),
    unlimited: user.role === 'ADMIN' || hasSubscription,
  };
}

module.exports = { checkDownloadAccess, addBonusDownloads, getUserQuotaStatus, FREE_DOWNLOADS };