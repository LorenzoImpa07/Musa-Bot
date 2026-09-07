const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../db/client');
const { successEmbed, errorEmbed, formatDuration } = require('../utils/embeds');

const MAX_PLAYLISTS_PER_USER = 25;
const MAX_TRACKS_PER_PLAYLIST = 200;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playlists')
    .setDescription('Gestisci le tue playlist personalizzate')
    .addSubcommand((sc) =>
      sc.setName('create').setDescription('Crea una nuova playlist')
        .addStringOption((o) => o.setName('nome').setDescription('Nome della playlist').setRequired(true).setMaxLength(50))
        .addBooleanOption((o) => o.setName('pubblica').setDescription('Altri utenti possono suonarla? (default: sì)')),
    )
    .addSubcommand((sc) =>
      sc.setName('delete').setDescription('Elimina una tua playlist')
        .addStringOption((o) => o.setName('nome').setDescription('Nome della playlist').setRequired(true).setAutocomplete(true)),
    )
    .addSubcommand((sc) =>
      sc.setName('view').setDescription('Visualizza il contenuto di una playlist')
        .addStringOption((o) => o.setName('nome').setDescription('Nome della playlist').setRequired(true).setAutocomplete(true))
        .addUserOption((o) => o.setName('utente').setDescription('Proprietario della playlist (default: tu)')),
    )
    .addSubcommandGroup((g) =>
      g.setName('edit').setDescription('Modifica una playlist')
        .addSubcommand((sc) =>
          sc.setName('add').setDescription('Aggiungi un brano a una playlist')
            .addStringOption((o) => o.setName('nome').setDescription('Nome della playlist').setRequired(true).setAutocomplete(true))
            .addStringOption((o) => o.setName('brano').setDescription('Link YouTube o nome della canzone').setRequired(true)),
        )
        .addSubcommand((sc) =>
          sc.setName('remove').setDescription('Rimuovi un brano da una playlist')
            .addStringOption((o) => o.setName('nome').setDescription('Nome della playlist').setRequired(true).setAutocomplete(true))
            .addIntegerOption((o) => o.setName('posizione').setDescription('Numero del brano (vedi /playlists view)').setRequired(true).setMinValue(1)),
        ),
    )
    .addSubcommandGroup((g) =>
      g.setName('play').setDescription('Riproduci una playlist')
        .addSubcommand((sc) =>
          sc.setName('own').setDescription('Riproduci una tua playlist')
            .addStringOption((o) => o.setName('nome').setDescription('Nome della playlist').setRequired(true).setAutocomplete(true)),
        )
        .addSubcommand((sc) =>
          sc.setName('from').setDescription('Riproduci la playlist pubblica di un altro utente')
            .addUserOption((o) => o.setName('utente').setDescription('Proprietario della playlist').setRequired(true))
            .addStringOption((o) => o.setName('nome').setDescription('Nome della playlist').setRequired(true).setAutocomplete(true)),
        ),
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand(false);

    // Per "play from" suggeriamo le playlist pubbliche dell'utente selezionato, altrimenti quelle dell'autore del comando
    let ownerId = interaction.user.id;
    if (group === 'play' && sub === 'from') {
      const target = interaction.options.getUser('utente');
      if (target) ownerId = target.id;
    }

    const where = { ownerId };
    if (!(group === 'edit') && ownerId !== interaction.user.id) where.isPublic = true;

    const playlists = await prisma.playlist.findMany({
      where: { ...where, name: { contains: focused, mode: 'insensitive' } },
      take: 25,
    });

    await interaction.respond(playlists.map((p) => ({ name: p.name, value: p.name })));
  },

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (!group) {
      if (sub === 'create') return handleCreate(interaction);
      if (sub === 'delete') return handleDelete(interaction);
      if (sub === 'view') return handleView(interaction);
    }
    if (group === 'edit') {
      if (sub === 'add') return handleEditAdd(interaction);
      if (sub === 'remove') return handleEditRemove(interaction);
    }
    if (group === 'play') {
      if (sub === 'own') return handlePlay(interaction, interaction.user.id);
      if (sub === 'from') return handlePlay(interaction, interaction.options.getUser('utente', true).id);
    }
  },
};

async function handleCreate(interaction) {
  const nome = interaction.options.getString('nome', true);
  const pubblica = interaction.options.getBoolean('pubblica') ?? true;

  const count = await prisma.playlist.count({ where: { ownerId: interaction.user.id } });
  if (count >= MAX_PLAYLISTS_PER_USER) {
    return interaction.reply({ embeds: [errorEmbed('Limite raggiunto', `Puoi avere al massimo ${MAX_PLAYLISTS_PER_USER} playlist.`)], ephemeral: true });
  }

  try {
    await prisma.playlist.create({ data: { name: nome, ownerId: interaction.user.id, isPublic: pubblica } });
    return interaction.reply({ embeds: [successEmbed('Playlist creata', `**${nome}** creata (${pubblica ? 'pubblica' : 'privata'}). Aggiungi brani con \`/playlists edit add\`.`)] });
  } catch (err) {
    if (err.code === 'P2002') {
      return interaction.reply({ embeds: [errorEmbed('Nome già usato', 'Hai già una playlist con questo nome.')], ephemeral: true });
    }
    throw err;
  }
}

async function handleDelete(interaction) {
  const nome = interaction.options.getString('nome', true);
  const playlist = await prisma.playlist.findUnique({ where: { ownerId_name: { ownerId: interaction.user.id, name: nome } } });
  if (!playlist) return interaction.reply({ embeds: [errorEmbed('Playlist non trovata', 'Non hai una playlist con questo nome.')], ephemeral: true });

  await prisma.playlist.delete({ where: { id: playlist.id } });
  return interaction.reply({ embeds: [successEmbed('Playlist eliminata', `**${nome}** è stata eliminata.`)] });
}

async function handleView(interaction) {
  const nome = interaction.options.getString('nome', true);
  const target = interaction.options.getUser('utente') || interaction.user;

  const playlist = await prisma.playlist.findUnique({
    where: { ownerId_name: { ownerId: target.id, name: nome } },
    include: { tracks: { orderBy: { position: 'asc' } } },
  });

  if (!playlist || (!playlist.isPublic && playlist.ownerId !== interaction.user.id)) {
    return interaction.reply({ embeds: [errorEmbed('Playlist non trovata', 'Non esiste o non è pubblica.')], ephemeral: true });
  }

  const desc = playlist.tracks.length
    ? playlist.tracks.map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) • \`${formatDuration(t.duration)}\``).join('\n')
    : 'Questa playlist è vuota.';

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`📁 ${playlist.name}`)
    .setDescription(desc)
    .setFooter({ text: `${playlist.isPublic ? 'Pubblica' : 'Privata'} • di ${target.username} • ${playlist.tracks.length} brani` });

  return interaction.reply({ embeds: [embed] });
}

async function handleEditAdd(interaction) {
  const nome = interaction.options.getString('nome', true);
  const query = interaction.options.getString('brano', true);

  const playlist = await prisma.playlist.findUnique({ where: { ownerId_name: { ownerId: interaction.user.id, name: nome } }, include: { tracks: true } });
  if (!playlist) return interaction.reply({ embeds: [errorEmbed('Playlist non trovata', 'Non hai una playlist con questo nome.')], ephemeral: true });
  if (playlist.tracks.length >= MAX_TRACKS_PER_PLAYLIST) {
    return interaction.reply({ embeds: [errorEmbed('Limite raggiunto', `Questa playlist ha già ${MAX_TRACKS_PER_PLAYLIST} brani.`)], ephemeral: true });
  }

  await interaction.deferReply();

  const results = await interaction.client.distube.search(query, { limit: 1, safeSearch: false }).catch(() => []);
  const found = results[0];
  if (!found) {
    return interaction.editReply({ embeds: [errorEmbed('Nessun risultato', 'Non ho trovato nessun brano per questa ricerca.')] });
  }

  await prisma.track.create({
    data: {
      playlistId: playlist.id,
      title: found.name,
      url: found.url,
      duration: Math.floor(found.duration || 0),
      position: playlist.tracks.length,
    },
  });

  return interaction.editReply({ embeds: [successEmbed('Brano aggiunto', `[${found.name}](${found.url}) aggiunto a **${nome}**`)] });
}

async function handleEditRemove(interaction) {
  const nome = interaction.options.getString('nome', true);
  const posizione = interaction.options.getInteger('posizione', true);

  const playlist = await prisma.playlist.findUnique({ where: { ownerId_name: { ownerId: interaction.user.id, name: nome } }, include: { tracks: { orderBy: { position: 'asc' } } } });
  if (!playlist) return interaction.reply({ embeds: [errorEmbed('Playlist non trovata', 'Non hai una playlist con questo nome.')], ephemeral: true });

  const track = playlist.tracks[posizione - 1];
  if (!track) return interaction.reply({ embeds: [errorEmbed('Posizione non valida', `La playlist ha solo ${playlist.tracks.length} brani.`)], ephemeral: true });

  await prisma.track.delete({ where: { id: track.id } });
  return interaction.reply({ embeds: [successEmbed('Brano rimosso', `**${track.title}** rimosso da **${nome}**`)] });
}

async function handlePlay(interaction, ownerId) {
  const nome = interaction.options.getString('nome', true);
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) return interaction.reply({ embeds: [errorEmbed('Devi essere in un canale vocale.')], ephemeral: true });

  const playlist = await prisma.playlist.findUnique({ where: { ownerId_name: { ownerId, name: nome } }, include: { tracks: { orderBy: { position: 'asc' } } } });
  if (!playlist || (!playlist.isPublic && ownerId !== interaction.user.id)) {
    return interaction.reply({ embeds: [errorEmbed('Playlist non trovata', 'Non esiste o non è pubblica.')], ephemeral: true });
  }
  if (!playlist.tracks.length) return interaction.reply({ embeds: [errorEmbed('Playlist vuota', 'Aggiungi prima qualche brano.')], ephemeral: true });

  await interaction.deferReply();

  const distube = interaction.client.distube;
  for (const track of playlist.tracks) {
    await distube.play(voiceChannel, track.url, { member: interaction.member, textChannel: interaction.channel }).catch(console.error);
  }

  return interaction.editReply({ embeds: [successEmbed('Playlist in coda', `**${playlist.tracks.length}** brani da **${nome}** aggiunti alla coda.`)] });
}
