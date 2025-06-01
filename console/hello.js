/**
 * Handles the exit command, shuts down the bot, and closes the readline connection.
 * @module exit
 */
module.exports = {
    name: 'hello', // Command name
    execute(rl, client) {
        logWithTimestamp('[Hello] Hello World! :)');
    }
};