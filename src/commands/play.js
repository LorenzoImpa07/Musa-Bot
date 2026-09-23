const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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

    const me = interaction.guild.members.me;
    const permissions = voiceChannel.permissionsFor(me);
    if (
      !permissions?.has(PermissionFlagsBits.Connect) ||
      !permissions?.has(PermissionFlagsBits.Speak)
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            'Permessi insufficienti',
            'Mi servono i permessi **Connetti** e **Parlare** in questo canale vocale.',
          ),
        ],
        ephemeral: true,
      });
    }

    const query = interaction.options.getString('brano', true);
    await interaction.deferReply();

    try {
      // DisTube gestisce da solo il join; non fare un join separato (raddoppia il timeout)
      await interaction.client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });
      // Risposta immediata così l'utente vede sempre qualcosa
      await interaction.editReply({
        embeds: [
          {
            color: 0x57f287,
            title: '🔎 In cerca...',
            description: `Sto cercando **${query}**. Il pannello di riproduzione arriverà tra poco.`,
          },
        ],
      }).catch(() => {});
    } catch (err) {
      console.error('Play error:', err);
      const code = err?.errorCode || err?.code;
      let title = 'Impossibile riprodurre';
      let desc = err?.message || 'Controlla il link o prova con un altro termine di ricerca.';

      if (code === 'VOICE_CONNECT_FAILED' || /voice channel after|VOICE_CONNECTION/i.test(String(err?.message))) {
        title = 'Connessione vocale fallita';
        desc =
          'Non riesco a entrare nel canale vocale (timeout UDP). Prova di nuovo. Se succede sempre, Railway spesso blocca/limita UDP necessario per Discord Voice: serve un host diverso (VPS).';
      } else if (code === 'VOICE_MISSING_PERMS') {
        title = 'Permessi insufficienti';
        desc = 'Mi servono **Connetti** e **Parlare** nel canale vocale.';
      }

      await interaction.editReply({ embeds: [errorEmbed(title, desc)] }).catch(() => {});
    }
  },
};
