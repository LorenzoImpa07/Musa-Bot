const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, loopLabel } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Cambia la modalità di ripetizione')
    .addStringOption((opt) =>
      opt.setName('modalita').setDescription('Modalità di loop').setRequired(true).addChoices(
        { name: 'Disattivo', value: '0' },
        { name: 'Brano singolo', value: '1' },
        { name: 'Coda intera', value: '2' },
      ),
    ),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [errorEmbed('Nessuna riproduzione attiva.')], ephemeral: true });
    const mode = Number(interaction.options.getString('modalita', true));
    queue.setRepeatMode(mode);
    return interaction.reply({ embeds: [successEmbed('Loop aggiornato', `Modalità: **${loopLabel(mode)}**`)] });
  },
};
