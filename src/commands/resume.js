const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Riprende la riproduzione'),
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Nessuna riproduzione attiva.')], ephemeral: true });
    if (!queue.paused) return interaction.reply({ embeds: [errorEmbed('Non è in pausa.')], ephemeral: true });
    queue.resume();
    return interaction.reply({ embeds: [successEmbed('Ripresa', 'Riproduzione ripresa.')] });
  },
};
