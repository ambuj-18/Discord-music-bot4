const fs = require('node:fs');
const path = require('node:path');

function loadEvents(client, context, logger) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

  for (const file of files) {
    const event = require(path.join(eventsPath, file));
    if (!event?.name || !event?.execute) {
      logger.warn('Skipping invalid event file', { file });
      continue;
    }

    const handler = (...args) => event.execute(...args, context);
    if (event.once) client.once(event.name, handler);
    else client.on(event.name, handler);
  }

  logger.info('Events loaded', { count: files.length });
}

module.exports = loadEvents;
