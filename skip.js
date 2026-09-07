const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Salta al brano successivo in coda'),
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Nessuna riproduzione attiva.')], ephemeral: true });

    if (queue.songs.length <= 1) {
      await queue.stop();
      return interaction.reply({ embeds: [successEmbed('Coda terminata', 'Non ci sono altri brani, riproduzione fermata.')] });
    }
    const nextSong = queue.songs[1];
    await queue.skip();
    return interaction.reply({ embeds: [successEmbed('Brano saltato', `Ora in riproduzione: **${nextSong.name}**`)] });
  },
};
