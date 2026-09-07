const { updatePresence } = require('../utils/stats');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Musa Bot online come ${client.user.tag}`);
    await updatePresence(client);
  },
};
