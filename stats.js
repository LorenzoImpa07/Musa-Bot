const { ActivityType } = require('discord.js');
const prisma = require('../db/client');

const STATS_ID = 'global';

/** Legge il contatore attuale (crea la riga se non esiste ancora) */
async function getStats() {
  return prisma.botStats.upsert({
    where: { id: STATS_ID },
    update: {},
    create: { id: STATS_ID, totalSongsPlayed: 0 },
  });
}

/** Incrementa il contatore di 1 e ritorna il nuovo totale */
async function incrementSongsPlayed() {
  const updated = await prisma.botStats.upsert({
    where: { id: STATS_ID },
    update: { totalSongsPlayed: { increment: 1 } },
    create: { id: STATS_ID, totalSongsPlayed: 1 },
  });
  return updated.totalSongsPlayed;
}

function formatCount(n) {
  return n.toLocaleString('it-IT');
}

/** Aggiorna la scritta "Ascolta ..." sotto il nome del bot con il totale attuale */
async function updatePresence(client, total) {
  const count = total ?? (await getStats()).totalSongsPlayed;
  client.user.setPresence({
    activities: [{ name: `${formatCount(count)} canzoni riprodotte`, type: ActivityType.Listening }],
    status: 'online',
  });
}

module.exports = { getStats, incrementSongsPlayed, updatePresence, formatCount };
