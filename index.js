require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { Player } = require('discord-player');
const { YoutubeExtractor, SpotifyExtractor } = require('discord-player');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
client.player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25
  }
});

// Auto register extractors (YouTube + Spotify support)
client.player.extractors.register(YoutubeExtractor, {});
client.player.extractors.register(SpotifyExtractor, {});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}! Music Bot Ready 🔥`);
});

client.player.events.on('playerStart', (queue, track) => {
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Now Playing 🎵')
    .setDescription(`**[${track.title}](${track.url})**\nBy: ${track.author}`)
    .setThumbnail(track.thumbnail)
    .addFields({ name: 'Duration', value: track.duration, inline: true })
    .setFooter({ text: `Requested by ${track.requestedBy.tag}` });

  queue.metadata.channel.send({ embeds: [embed] }).catch(() => {});
});

client.player.events.on('emptyChannel', (queue) => {
  queue.metadata.channel.send('Voice channel khali ho gaya, leaving... 👋');
});

client.player.events.on('error', (queue, error) => {
  console.log(`Player Error: ${error.message}`);
  queue.metadata.channel.send(`Error aaya bhai: ${error.message}`).catch(() => {});
});

// --------------------- Basic Slash Commands ---------------------
const { SlashCommandBuilder } = require('@discordjs/builders');

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'play') {
    await interaction.deferReply();

    const query = interaction.options.getString('query', true);
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply('Bhai pehle voice channel join kar lo!');
    }

    try {
      const { track } = await client.player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: {
            channel: interaction.channel
          }
        }
      });

      if (!track) {
        return interaction.editReply('Kuch nahi mila bhai... galat query?');
      }

      interaction.editReply(`**Queued:** ${track.title}`);
    } catch (e) {
      interaction.editReply(`Error: ${e.message}`);
    }
  }

  if (commandName === 'skip') {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue || !queue.isPlaying()) return interaction.reply('Kuch play hi nahi ho raha!');

    queue.node.skip();
    interaction.reply('Song skip kar diya! ⏭️');
  }

  if (commandName === 'pause') {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue || !queue.isPlaying()) return interaction.reply('Kuch play hi nahi ho raha!');

    if (queue.node.isPaused()) {
      queue.node.resume();
      interaction.reply('Music resume kar diya! ▶️');
    } else {
      queue.node.pause();
      interaction.reply('Music pause kar diya! ⏸️');
    }
  }

  if (commandName === 'queue') {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue || !queue.tracks.size) return interaction.reply('Queue khali hai bhai!');

    const tracks = queue.tracks.toArray().slice(0, 10).map((t, i) => `${i+1}. ${t.title} - ${t.duration}`);
    interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Current Queue')
        .setDescription(tracks.join('\n') || 'Empty...')
        .addFields({ name: 'Now Playing', value: queue.currentTrack?.title || 'Nothing' })]
    });
  }
});

// Register commands (run once after bot ready)
client.once('ready', async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play a song!')
      .addStringOption(option => 
        option.setName('query')
          .setDescription('Song name / URL / Spotify link')
          .setRequired(true)),

    new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Skip current song'),

    new SlashCommandBuilder()
      .setName('pause')
      .setDescription('Pause/Resume current song'),

    new SlashCommandBuilder()
      .setName('queue')
      .setDescription('Show current queue')
  ].map(cmd => cmd.toJSON());

  await client.application.commands.set(commands);
  console.log('Slash commands registered!');
});

client.login(process.env.TOKEN);
