const { Events } = require('discord.js');

module.exports = {
  name: Events.VoiceStateUpdate,
  execute(oldState, newState, { music }) {
    music.handleVoiceStateUpdate(oldState, newState);
  }
};
