const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ffmpeg = require('ffmpeg-static');

/**
 * DisTube tiene internamente una Queue per ogni guildId (Map<guildId, Queue>).
 * Questo è ciò che garantisce che due server diversi non si "pestino i piedi":
 * ogni coda, stato di play/pause, volume e connessione vocale è isolato per guild.
 */
function createDisTube(client) {
  const distube = new DisTube(client, {
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    savePreviousSongs: true,
    plugins: [
      new YouTubePlugin(),
      // yt-dlp v2: compatibile con DisTube 5, fallback più stabile per YouTube
      new YtDlpPlugin({ update: true }),
    ],
    ffmpeg: {
      path: ffmpeg,
    },
  });

  return distube;
}

module.exports = { createDisTube };
