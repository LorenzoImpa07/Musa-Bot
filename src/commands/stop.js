const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Ferma la musica, svuota la coda e disconnette il bot'),
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Nessuna riproduzione attiva.')], ephemeral: true });
    await queue.stop();
    return interaction.reply({ embeds: [successEmbed('Riproduzione fermata', 'Coda svuotata e bot disconnesso dal canale vocale.')] });
  },
};
