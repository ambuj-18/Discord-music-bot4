const {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel
} = require('@discordjs/voice');
const play = require('play-dl');

const LOOP_OFF = 'off';
const LOOP_TRACK = 'track';
const LOOP_QUEUE = 'queue';

class GuildQueue {
  constructor(guild, textChannelId, defaultVolume) {
    this.guild = guild;
    this.textChannelId = textChannelId;
    this.defaultVolume = defaultVolume;
    this.voiceChannelId = null;
    this.connection = null;
    this.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause }
    });
    this.tracks = [];
    this.current = null;
    this.loopMode = LOOP_OFF;
    this.volume = defaultVolume;
    this.disconnectTimer = null;
    this.isConnecting = false;
  }
}

class MusicManager {
  constructor(client, logger, config) {
    this.client = client;
    this.logger = logger;
    this.config = config;
    this.queues = new Map();
    play.setToken({
      spotify: {
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        market: process.env.SPOTIFY_MARKET || 'US'
      }
    }).catch(() => {
      this.logger.warn('Spotify credentials not configured. Spotify URLs will use metadata fallback only.');
    });
  }

  getQueue(guildId) {
    return this.queues.get(guildId);
  }

  ensureQueue(guild, textChannelId) {
    const existing = this.queues.get(guild.id);
    if (existing) {
      existing.textChannelId = textChannelId;
      return existing;
    }

    const queue = new GuildQueue(guild, textChannelId, this.config.defaultVolume);
    this.bindPlayerEvents(queue);
    this.queues.set(guild.id, queue);
    return queue;
  }

  bindPlayerEvents(queue) {
    queue.player.on(AudioPlayerStatus.Idle, async () => {
      if (!queue.current && queue.tracks.length === 0) return;

      if (queue.loopMode === LOOP_TRACK && queue.current) {
        queue.tracks.unshift(queue.current);
      } else if (queue.loopMode === LOOP_QUEUE && queue.current) {
        queue.tracks.push(queue.current);
      }

      queue.current = null;
      await this.playNext(queue.guild.id);
    });

    queue.player.on('error', async (error) => {
      this.logger.error('Audio player error', { guildId: queue.guild.id, message: error.message });
      queue.current = null;
      await this.playNext(queue.guild.id);
    });
  }

  async connect(queue, voiceChannel) {
    if (queue.isConnecting) return;
    queue.isConnecting = true;
    try {
      const existing = getVoiceConnection(queue.guild.id);
      if (existing) {
        queue.connection = existing;
        if (existing.joinConfig.channelId !== voiceChannel.id) {
          existing.destroy();
          queue.connection = null;
        }
      }

      if (!queue.connection) {
        queue.connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: queue.guild.id,
          adapterCreator: queue.guild.voiceAdapterCreator,
          selfDeaf: true
        });
      }

      queue.voiceChannelId = voiceChannel.id;
      queue.connection.subscribe(queue.player);
      this.bindConnectionEvents(queue);
      await entersState(queue.connection, VoiceConnectionStatus.Ready, 20_000);
      this.logger.info('Voice connection ready', { guildId: queue.guild.id });
    } finally {
      queue.isConnecting = false;
    }
  }

  bindConnectionEvents(queue) {
    if (!queue.connection || queue.connection.__eventsBound) return;

    queue.connection.__eventsBound = true;
    queue.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(queue.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(queue.connection, VoiceConnectionStatus.Connecting, 5_000)
        ]);
      } catch {
        this.destroyQueue(queue.guild.id);
      }
    });

    queue.connection.on('error', (error) => {
      this.logger.error('Voice connection error', { guildId: queue.guild.id, message: error.message });
    });
  }

  async resolveTrack(query, requestedBy) {
    if (play.yt_validate(query) === 'video') {
      const info = await play.video_basic_info(query);
      const details = info.video_details;
      return {
        title: details.title,
        url: details.url,
        duration: Number(details.durationInSec) || 0,
        thumbnail: details.thumbnails?.[0]?.url,
        requestedBy
      };
    }

    if (play.sp_validate(query) === 'track') {
      const spTrack = await play.spotify(query);
      const metadata = await spTrack.fetch();
      const searchQuery = `${metadata.name} ${metadata.artists?.[0]?.name || ''}`.trim();
      const yt = await play.search(searchQuery, { limit: 1, source: { youtube: 'video' } });
      if (!yt[0]) throw new Error('No YouTube match found for Spotify track.');
      return {
        title: `${metadata.name} - ${metadata.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}`,
        url: yt[0].url,
        duration: yt[0].durationInSec || 0,
        thumbnail: metadata.thumbnail?.url || yt[0].thumbnails?.[0]?.url,
        requestedBy
      };
    }

    const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
    if (!results[0]) throw new Error('No results found.');
    return {
      title: results[0].title,
      url: results[0].url,
      duration: results[0].durationInSec || 0,
      thumbnail: results[0].thumbnails?.[0]?.url,
      requestedBy
    };
  }

  async enqueue(interaction, query) {
    const memberChannel = interaction.member.voice.channel;
    if (!memberChannel) throw new Error('Join a voice channel first.');

    const queue = this.ensureQueue(interaction.guild, interaction.channelId);
    await this.connect(queue, memberChannel);

    const track = await this.resolveTrack(query, interaction.user.tag);
    queue.tracks.push(track);

    if (!queue.current && queue.player.state.status !== AudioPlayerStatus.Playing) {
      await this.playNext(interaction.guildId);
      return { queue, track, started: true };
    }

    return { queue, track, started: false };
  }

  async playNext(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    const next = queue.tracks.shift();
    if (!next) {
      queue.current = null;
      queue.player.stop(true);
      this.startDisconnectTimer(queue);
      return;
    }

    this.clearDisconnectTimer(queue);

    try {
      const stream = await play.stream(next.url, {
        discordPlayerCompatibility: true,
        quality: 2
      });

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });
      resource.volume.setVolume(queue.volume / 100);

      queue.current = next;
      queue.player.play(resource);
    } catch (error) {
      this.logger.error('Failed to stream track', { guildId, track: next.url, message: error.message });
      queue.current = null;
      await this.playNext(guildId);
    }
  }

  pause(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    return queue.player.pause();
  }

  resume(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    return queue.player.unpause();
  }

  skip(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    return queue.player.stop();
  }

  stop(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    queue.tracks = [];
    queue.current = null;
    queue.loopMode = LOOP_OFF;
    queue.player.stop(true);
    this.destroyQueue(guildId);
    return true;
  }

  setLoop(guildId, mode) {
    const queue = this.queues.get(guildId);
    if (!queue) return null;
    queue.loopMode = mode;
    return mode;
  }

  setVolume(guildId, volume) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    queue.volume = volume;
    const resource = queue.player.state.resource;
    if (resource?.volume) resource.volume.setVolume(volume / 100);
    return true;
  }

  formatDuration(seconds) {
    if (!seconds || seconds <= 0) return 'LIVE';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }

  getQueueSnapshot(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return null;
    return {
      current: queue.current,
      tracks: queue.tracks,
      loopMode: queue.loopMode,
      volume: queue.volume
    };
  }

  handleVoiceStateUpdate(oldState, newState) {
    const guildId = oldState.guild.id;
    const queue = this.queues.get(guildId);
    if (!queue || !queue.voiceChannelId) return;

    const changedChannelId = oldState.channelId || newState.channelId;
    if (changedChannelId !== queue.voiceChannelId) return;

    const voiceChannel = oldState.guild.channels.cache.get(queue.voiceChannelId);
    if (!voiceChannel) return;

    const nonBots = voiceChannel.members.filter((m) => !m.user.bot).size;
    if (nonBots === 0) this.startDisconnectTimer(queue);
    else this.clearDisconnectTimer(queue);
  }

  startDisconnectTimer(queue) {
    if (queue.disconnectTimer) return;
    queue.disconnectTimer = setTimeout(() => {
      const voiceChannel = queue.guild.channels.cache.get(queue.voiceChannelId);
      const nonBots = voiceChannel?.members.filter((m) => !m.user.bot).size || 0;
      if (nonBots === 0) {
        this.logger.info('Auto-disconnect triggered', { guildId: queue.guild.id });
        this.destroyQueue(queue.guild.id);
      } else {
        this.clearDisconnectTimer(queue);
      }
    }, this.config.autoDisconnectMs);
  }

  clearDisconnectTimer(queue) {
    if (!queue.disconnectTimer) return;
    clearTimeout(queue.disconnectTimer);
    queue.disconnectTimer = null;
  }

  destroyQueue(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    this.clearDisconnectTimer(queue);
    queue.player.stop(true);
    if (queue.connection) queue.connection.destroy();
    this.queues.delete(guildId);
  }
}

module.exports = { MusicManager, LOOP_OFF, LOOP_TRACK, LOOP_QUEUE };
