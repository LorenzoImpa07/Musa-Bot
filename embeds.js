const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const COLOR = 0x2b2d31; // grigio scuro elegante, coerente col tema Discord
const ACCENT = 0xed4245; // rosso, richiama il logo del bot nella foto di riferimento

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return 'LIVE';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function progressBar(current, total, size = 18) {
  if (!total || total <= 0) return '🔴 ── **LIVE** ── 🔴';
  const ratio = Math.min(current / total, 1);
  const filled = Math.round(size * ratio);
  const bar = '▬'.repeat(filled) + '🔘' + '▬'.repeat(Math.max(size - filled, 0));
  return `${formatDuration(current)}  ${bar}  ${formatDuration(total)}`;
}

/** Pannello "now playing" con copertina, progress bar e info coda */
function nowPlayingEmbed(song, queue) {
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setAuthor({ name: 'In riproduzione' })
    .setTitle(song.name)
    .setURL(song.url)
    .setThumbnail(song.thumbnail || null)
    .addFields(
      { name: 'Richiesta da', value: `${song.user}`, inline: true },
      { name: 'Durata', value: song.formattedDuration || formatDuration(song.duration), inline: true },
      { name: 'Volume', value: `${queue.volume}%`, inline: true },
      { name: 'In coda', value: `${queue.songs.length - 1} brani`, inline: true },
      { name: 'Loop', value: loopLabel(queue.repeatMode), inline: true },
      { name: 'Autoplay', value: queue.autoplay ? 'Attivo' : 'Disattivo', inline: true },
    )
    .setFooter({ text: '🎵 Musa Bot • Usa i bottoni qui sotto per controllare la riproduzione' });

  return embed;
}

function loopLabel(mode) {
  if (mode === 1) return 'Brano singolo';
  if (mode === 2) return 'Coda intera';
  return 'Disattivo';
}

/** Riga di bottoni per il pannello di controllo musica */
function controlsRow(queue) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music:pauseresume').setEmoji(queue.paused ? '▶️' : '⏸️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('music:loop').setEmoji('🔁').setStyle(queue.repeatMode ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
  );
}

function volumeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music:volume_down').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:volume_up').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:queue').setEmoji('📜').setLabel('Coda').setStyle(ButtonStyle.Primary),
  );
}

/** Embed di coda paginata */
function queueEmbed(queue, page = 0, pageSize = 10) {
  const start = page * pageSize;
  const items = queue.songs.slice(start, start + pageSize);
  const desc = items
    .map((s, i) => {
      const idx = start + i;
      return idx === 0
        ? `**▶ In riproduzione:** [${s.name}](${s.url}) • \`${formatDuration(s.duration)}\``
        : `**${idx}.** [${s.name}](${s.url}) • \`${formatDuration(s.duration)}\` • richiesta da ${s.user}`;
    })
    .join('\n') || 'La coda è vuota.';

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('🎶 Coda musicale')
    .setDescription(desc)
    .setFooter({ text: `Musa Bot • Pagina ${page + 1}/${Math.max(Math.ceil(queue.songs.length / pageSize), 1)} • ${queue.songs.length} brani totali` });
}

function successEmbed(title, description) {
  return new EmbedBuilder().setColor(0x57f287).setTitle(`✅ ${title}`).setDescription(description || null);
}

function errorEmbed(title, description) {
  return new EmbedBuilder().setColor(0xed4245).setTitle(`❌ ${title}`).setDescription(description || null);
}

function infoEmbed(title, description) {
  return new EmbedBuilder().setColor(COLOR).setTitle(title).setDescription(description || null);
}

module.exports = {
  COLOR,
  ACCENT,
  formatDuration,
  progressBar,
  nowPlayingEmbed,
  controlsRow,
  volumeRow,
  queueEmbed,
  successEmbed,
  errorEmbed,
  infoEmbed,
  loopLabel,
};
