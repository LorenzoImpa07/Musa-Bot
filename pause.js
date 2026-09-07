const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Mette in pausa la riproduzione'),
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Nessuna riproduzione attiva.')], ephemeral: true });
    if (queue.paused) return interaction.reply({ embeds: [errorEmbed('Già in pausa.')], ephemeral: true });
    queue.pause();
    return interaction.reply({ embeds: [successEmbed('Pausa', 'Riproduzione messa in pausa.')] });
  },
};
