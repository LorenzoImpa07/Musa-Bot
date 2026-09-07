const { errorEmbed } = require('../utils/embeds');
const handleButton = require('../utils/buttonHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        const payload = { embeds: [errorEmbed('Errore imprevisto', 'Qualcosa è andato storto eseguendo il comando.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('music:')) {
      await handleButton(interaction, client);
      return;
    }

    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        await command.autocomplete(interaction, client).catch(console.error);
      }
    }
  },
};
