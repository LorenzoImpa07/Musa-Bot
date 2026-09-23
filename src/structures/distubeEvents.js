const { nowPlayingEmbed, controlsRow, volumeRow, successEmbed, errorEmbed, infoEmbed } = require('../utils/embeds');
const { incrementSongsPlayed, updatePresence } = require('../utils/stats');

module.exports = function registerDistubeEvents(client) {
  const distube = client.distube;

  distube.on('ffmpegDebug', (debug) => {
    console.log('[FFmpeg]', debug);
  });
  distube.on('debug', (message) => {
    console.log('[DisTube]', message);
  });

  // DisTube v5: (error, queue, song?) — non (context, error)
  distube.on('error', (error, queue) => {
    console.error('DisTube error:', error?.errorCode || error?.code, error?.message || error);
    if (error?.stack) console.error(error.stack);
    const channel = queue?.textChannel;
    const msg =
      error?.errorCode === 'NO_RESULT'
        ? 'Nessun risultato per questa ricerca.'
        : error?.errorCode === 'NO_STREAM_URL' || error?.errorCode === 'CANNOT_GET_STREAM_URL'
          ? 'Non riesco a ottenere lo stream audio (YouTube/yt-dlp).'
          : error?.message || 'Non sono riuscito a riprodurre questo brano.';
    channel?.send({ embeds: [errorEmbed('Errore di riproduzione', msg)] }).catch(() => {});
  });

  distube.on('playSong', async (queue, song) => {
    console.log('[DisTube] playSong:', song?.name, song?.url);
    const channel = queue.textChannel;

    const total = await incrementSongsPlayed().catch(() => null);
    if (total !== null) await updatePresence(client, total).catch(() => {});

    if (!channel) return;
    const msg = await channel
      .send({
        embeds: [nowPlayingEmbed(song, queue)],
        components: [controlsRow(queue), volumeRow()],
      })
      .catch((e) => {
        console.error('Impossibile inviare pannello now playing:', e?.message || e);
        return null;
      });
    queue.panelMessage = msg;
  });

  distube.on('addSong', (queue, song) => {
    console.log('[DisTube] addSong:', song?.name);
    queue.textChannel
      ?.send({
        embeds: [successEmbed('Aggiunto alla coda', `[${song.name}](${song.url}) • \`${song.formattedDuration}\``)],
      })
      .catch(() => {});
  });

  distube.on('finish', (queue) => {
    console.log('[DisTube] finish, queue empty');
    queue.textChannel
      ?.send({
        embeds: [infoEmbed('🎵 Coda terminata', 'Ho finito di suonare tutti i brani. Aggiungine altri con `/play`!')],
      })
      .catch(() => {});
  });

  distube.on('disconnect', (queue) => {
    console.log('[DisTube] disconnect');
    queue.textChannel
      ?.send({ embeds: [infoEmbed('👋 Disconnesso', 'Mi sono disconnesso dal canale vocale.')] })
      .catch(() => {});
  });

  distube.on('empty', (queue) => {
    console.log('[DisTube] empty channel');
    queue.textChannel
      ?.send({
        embeds: [infoEmbed('📭 Canale vuoto', 'Tutti hanno lasciato il canale vocale, mi disconnetto.')],
      })
      .catch(() => {});
  });
};
