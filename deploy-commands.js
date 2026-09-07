require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

function loadCommandData(dir) {
  let commands = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      commands = commands.concat(loadCommandData(fullPath));
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data) commands.push(command.data.toJSON());
    }
  }
  return commands;
}

const commands = loadCommandData(path.join(__dirname, 'commands'));

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registrazione di ${commands.length} slash command...`);

    if (process.env.GUILD_ID) {
      // Deploy istantaneo su un singolo server (comodo in sviluppo)
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
      console.log(`Comandi registrati sul server ${process.env.GUILD_ID}.`);
    } else {
      // Deploy globale (ci mette fino a un'ora a propagarsi su tutti i server)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      console.log('Comandi registrati globalmente.');
    }
  } catch (error) {
    console.error(error);
  }
})();
