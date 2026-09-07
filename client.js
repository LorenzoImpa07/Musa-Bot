const { PrismaClient } = require('@prisma/client');

// Un'unica istanza condivisa in tutto il bot (best practice Prisma)
const prisma = new PrismaClient();

module.exports = prisma;
