const { nowPlayingEmbed, controlsRow, volumeRow, successEmbed, errorEmbed, infoEmbed } = require('../utils/embeds');
const { incrementSongsPlayed, updatePresence } = require('../utils/stats');

// Questo file non segue il pattern name/execute standard: viene richiesto
// direttamente da index.js dopo la creazione di client.distube, perché DisTube
// espone i propri eventi su client.distube e non su client.
module.exports = function registerDistubeEvents(client) {
  const distube = client.distube;

  // Log utili se l'audio non parte (FFmpeg / stream YouTube)
  distube.on('ffmpegDebug', (debug) => {
    console.log('[FFmpeg]', debug);
  });
  distube.on('debug', (message) => {
    console.log('[DisTube]', message);
  });

  distube.on('playSong', async (queue, song) => {
    const channel = queue.textChannel;

    // Il contatore è globale (una riga sola nel DB, non per-server), quindi
    // conta ogni brano che parte su QUALSIASI server dove gira il bot,
    // ed è quello che aggiorna la scritta "Ascolta ..." sotto il nome di Musa Bot.
    const total = await incrementSongsPlayed().catch(() => null);
    if (total !== null) await updatePresence(client, total).catch(() => {});

    if (!channel) return;
    const msg = await channel.send({
      embeds: [nowPlayingEmbed(song, queue)],
      components: [controlsRow(queue), volumeRow()],
    }).catch(() => null);
    queue.panelMessage = msg; // teniamo un riferimento per aggiornamenti futuri, se serve
  });

  distube.on('addSong', (queue, song) => {
    queue.textChannel?.send({
      embeds: [successEmbed('Aggiunto alla coda', `[${song.name}](${song.url}) • \`${song.formattedDuration}\``)],
    }).catch(() => {});
  });

  distube.on('finish', (queue) => {
    queue.textChannel?.send({ embeds: [infoEmbed('🎵 Coda terminata', 'Ho finito di suonare tutti i brani. Aggiungine altri con `/play`!')] }).catch(() => {});
  });

  distube.on('disconnect', (queue) => {
    queue.textChannel?.send({ embeds: [infoEmbed('👋 Disconnesso', 'Mi sono disconnesso dal canale vocale.')] }).catch(() => {});
  });

  distube.on('empty', (queue) => {
    queue.textChannel?.send({ embeds: [infoEmbed('📭 Canale vuoto', 'Tutti hanno lasciato il canale vocale, mi disconnetto.')] }).catch(() => {});
  });

  distube.on('error', (context, error) => {
    console.error('DisTube error:', error);
    const channel = context?.textChannel || context?.channel;
    channel?.send({ embeds: [errorEmbed('Errore di riproduzione', 'Non sono riuscito a riprodurre questo brano. Riprova con un altro link o termine di ricerca.')] }).catch(() => {});
  });
};
