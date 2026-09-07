const { errorEmbed, nowPlayingEmbed, controlsRow, volumeRow, queueEmbed } = require('./embeds');

async function requireQueue(interaction, client) {
  const queue = client.distube.getQueue(interaction.guildId);
  if (!queue) {
    await interaction.reply({ embeds: [errorEmbed('Nessuna riproduzione attiva')], ephemeral: true });
    return null;
  }
  return queue;
}

async function refreshPanel(interaction, queue) {
  const song = queue.songs[0];
  await interaction.update({
    embeds: [nowPlayingEmbed(song, queue)],
    components: [controlsRow(queue), volumeRow()],
  });
}

module.exports = async function handleButton(interaction, client) {
  const action = interaction.customId.split(':')[1];

  // La coda / stop non richiedono che l'utente sia in vocale per essere consultate,
  // ma per i controlli di playback sì: evitiamo che chiunque disturbi da un altro canale.
  const memberChannel = interaction.member?.voice?.channel;
  const queue = await requireQueue(interaction, client);
  if (!queue) return;

  if (action === 'queue') {
    await interaction.reply({ embeds: [queueEmbed(queue)], ephemeral: true });
    return;
  }

  if (!memberChannel || memberChannel.id !== queue.voiceChannel?.id) {
    await interaction.reply({ embeds: [errorEmbed('Devi essere nel canale vocale del bot per usare i controlli.')], ephemeral: true });
    return;
  }

  switch (action) {
    case 'pauseresume':
      queue.paused ? queue.resume() : queue.pause();
      break;
    case 'skip':
      if (queue.songs.length > 1) await queue.skip();
      else await queue.stop();
      break;
    case 'stop':
      await queue.stop();
      await interaction.update({ embeds: [], components: [] }).catch(() => {});
      return;
    case 'loop':
      queue.setRepeatMode((queue.repeatMode + 1) % 3);
      break;
    case 'shuffle':
      await queue.shuffle();
      break;
    case 'volume_up':
      queue.setVolume(Math.min(queue.volume + 10, 100));
      break;
    case 'volume_down':
      queue.setVolume(Math.max(queue.volume - 10, 0));
      break;
    default:
      break;
  }

  await refreshPanel(interaction, queue);
};
