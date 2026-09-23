const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Riproduce un brano o lo aggiunge alla coda')
    .addStringOption((opt) =>
      opt.setName('brano').setDescription('Link YouTube oppure nome della canzone da cercare').setRequired(true),
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        embeds: [errorEmbed('Devi essere in un canale vocale per usare questo comando.')],
        ephemeral: true,
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions?.has(['Connect', 'Speak'])) {
      return interaction.reply({
        embeds: [errorEmbed('Permessi insufficienti', 'Mi servono i permessi **Connetti** e **Parlare** in questo canale vocale.')],
        ephemeral: true,
      });
    }

    const query = interaction.options.getString('brano', true);
    await interaction.deferReply();

    try {
      // Prova a entrare in vocale prima (consigliato da DisTube in caso di timeout)
      try {
        await interaction.client.distube.voices.join(voiceChannel);
      } catch (joinErr) {
        console.warn('Primo join fallito, riprovo...', joinErr?.message || joinErr);
        await new Promise((r) => setTimeout(r, 1500));
        await interaction.client.distube.voices.join(voiceChannel);
      }

      await interaction.client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });
      await interaction.deleteReply().catch(() => {});
    } catch (err) {
      console.error(err);
      const code = err?.errorCode || err?.code;
      let title = 'Impossibile riprodurre';
      let desc = 'Controlla il link o prova con un altro termine di ricerca.';

      if (code === 'VOICE_CONNECT_FAILED' || /voice channel after/i.test(String(err?.message))) {
        title = 'Connessione vocale fallita';
        desc =
          'Non riesco a entrare nel canale vocale (timeout). Prova di nuovo tra qualche secondo. Se succede sempre, l\'hosting potrebbe bloccare UDP (necessario per Discord Voice).';
      } else if (code === 'VOICE_MISSING_PERMS') {
        title = 'Permessi insufficienti';
        desc = 'Mi servono **Connetti** e **Parlare** nel canale vocale.';
      }

      await interaction.editReply({ embeds: [errorEmbed(title, desc)] }).catch(() => {});
    }
  },
};
