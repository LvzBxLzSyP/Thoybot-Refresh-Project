/**
 * Handles the hello command.
 * @module hello
 */
module.exports = {
    name: 'hello', // Command name
    /**
     * @param {ReadLine} rl - Readline interface
     * @param {Client} client - Your bot/client instance
     * @param {string[]} args - Command arguments
     */
    execute(rl, client, args) {
        if (args.length === 0) {
            logWithTimestamp('[Hello] Hello World! :)');
        } else {
            logWithTimestamp(`[Hello] Hello ${args.join(' ')}! :)`);
        }
    }
};