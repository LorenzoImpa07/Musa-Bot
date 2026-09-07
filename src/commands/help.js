const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Mostra tutti i comandi di Musa Bot'),

  async execute(interaction) {
    const logo = new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'logo.png'), { name: 'logo.png' });

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🎵 Comandi di Musa Bot')
      .setDescription('Ecco tutti i comandi disponibili, divisi per categoria.')
      .setThumbnail('attachment://logo.png')
      .addFields(
        {
          name: '▶️ Riproduzione',
          value:
            '`/play brano` — Riproduce un brano (link YouTube o nome da cercare) o lo aggiunge alla coda\n' +
            '`/playing` — Mostra il pannello del brano attualmente in riproduzione\n' +
            '`/skip` — Salta al brano successivo in coda\n' +
            '`/pause` — Mette in pausa la riproduzione\n' +
            '`/resume` — Riprende la riproduzione\n' +
            '`/stop` — Ferma la musica, svuota la coda e disconnette il bot\n' +
            '`/queue` — Mostra la coda musicale attuale\n' +
            '`/volume livello` — Imposta il volume (0-100)\n' +
            '`/loop modalità` — Disattivo / brano singolo / coda intera',
        },
        {
          name: '📁 Playlist personalizzate',
          value:
            '`/playlists create nome` — Crea una nuova playlist\n' +
            '`/playlists delete nome` — Elimina una tua playlist\n' +
            '`/playlists view nome` — Visualizza il contenuto di una playlist\n' +
            '`/playlists edit add nome brano` — Aggiunge un brano a una playlist\n' +
            '`/playlists edit remove nome posizione` — Rimuove un brano da una playlist\n' +
            '`/playlists play own nome` — Riproduce una tua playlist\n' +
            '`/playlists play from utente nome` — Riproduce la playlist pubblica di un altro utente',
        },
        {
          name: '📊 Altro',
          value:
            '`/stats` — Mostra il totale di canzoni riprodotte su tutti i server\n' +
            '`/help` — Mostra questo messaggio',
        },
      )
      .setFooter({ text: 'Per aiuto maggiore contattare lo sviluppatore in privato, ID:@lorenzoimpa' });

    return interaction.reply({ embeds: [embed], files: [logo] });
  },
};
