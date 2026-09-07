const { SlashCommandBuilder } = require('discord.js');
const { nowPlayingEmbed, controlsRow, volumeRow, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playing')
    .setDescription('Mostra il pannello del brano attualmente in riproduzione'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({ embeds: [errorEmbed('Nessun brano in riproduzione al momento.')], ephemeral: true });
    }
    const song = queue.songs[0];
    await interaction.reply({
      embeds: [nowPlayingEmbed(song, queue)],
      components: [controlsRow(queue), volumeRow()],
    });
  },
};
