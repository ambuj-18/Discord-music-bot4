const fs = require('node:fs');
const path = require('node:path');

function loadCommands(client, logger) {
  const commandsRoot = path.join(__dirname, '..', 'commands');
  const folders = fs.readdirSync(commandsRoot);

  for (const folder of folders) {
    const folderPath = path.join(commandsRoot, folder);
    const files = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

    for (const file of files) {
      const command = require(path.join(folderPath, file));
      if (!command?.data || !command?.execute) {
        logger.warn('Skipping invalid command file', { file });
        continue;
      }
      client.commands.set(command.data.name, command);
    }
  }

  logger.info('Commands loaded', { count: client.commands.size });
}

module.exports = loadCommands;
