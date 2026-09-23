const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ffmpeg = require('ffmpeg-static');

function createDisTube(client) {
  const distube = new DisTube(client, {
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    savePreviousSongs: true,
    // YtDlpPlugin per ultimo (come da docs); serve binary yt-dlp scaricabile
    plugins: [
      new YouTubePlugin({
        ytdlOptions: {
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
        },
      }),
      new YtDlpPlugin({ update: true }),
    ],
    ffmpeg: {
      path: ffmpeg,
    },
  });

  return distube;
}

module.exports = { createDisTube };
