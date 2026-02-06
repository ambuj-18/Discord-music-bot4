const { Events } = require('discord.js');

module.exports = {
  name: Events.Error,
  execute(error, { logger }) {
    logger.error('Discord client error', { message: error.message });
  }
};
