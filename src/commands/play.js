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
      return interaction.reply({ embeds: [errorEmbed('Devi essere in un canale vocale per usare questo comando.')], ephemeral: true });
    }

    const query = interaction.options.getString('brano', true);
    await interaction.deferReply();

    try {
      await interaction.client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });
      await interaction.deleteReply().catch(() => {});
      // Il pannello "in riproduzione" viene inviato dall'evento playSong/addSong di DisTube
    } catch (err) {
      console.error(err);
      await interaction.editReply({ embeds: [errorEmbed('Impossibile riprodurre', 'Controlla il link o prova con un altro termine di ricerca.')] });
    }
  },
};
