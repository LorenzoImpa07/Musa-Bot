const { SlashCommandBuilder } = require('discord.js');
const { queueEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Mostra la coda musicale attuale'),
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Nessuna riproduzione attiva.')], ephemeral: true });
    return interaction.reply({ embeds: [queueEmbed(queue)] });
  },
};
