const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Imposta il volume di riproduzione')
    .addIntegerOption((opt) => opt.setName('livello').setDescription('Da 0 a 100').setRequired(true).setMinValue(0).setMaxValue(100)),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Nessuna riproduzione attiva.')], ephemeral: true });
    const livello = interaction.options.getInteger('livello', true);
    queue.setVolume(livello);
    return interaction.reply({ embeds: [successEmbed('Volume aggiornato', `Volume impostato a **${livello}%**`)] });
  },
};
