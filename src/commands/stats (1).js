const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStats, formatCount } = require('../utils/stats');

module.exports = {
  data: new SlashCommandBuilder().setName('stats').setDescription('Mostra le statistiche globali di Musa Bot'),

  async execute(interaction) {
    const stats = await getStats();
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('📊 Statistiche di Musa Bot')
      .addFields(
        { name: 'Canzoni riprodotte in totale', value: formatCount(stats.totalSongsPlayed), inline: true },
        { name: 'Server attivi', value: formatCount(interaction.client.guilds.cache.size), inline: true },
      )
      .setFooter({ text: 'Musa Bot' });

    return interaction.reply({ embeds: [embed] });
  },
};
