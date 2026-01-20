/**
 * Handles the fatal command.
 * @module fatal
 */
module.exports = {
    name: 'fatal', // Command name
    /**
     * @param {ReadLine} rl - Readline interface
     * @param {Client} client - Your bot/client instance
     * @param {string[]} args - Command arguments
     */
    execute(rl, client, args) {
        if (args.length === 0) {
            fatalWithTimestamp('[Hello] Hello World! :)', 'test', 'lol');
        } else {
            fatalWithTimestamp(`[Hello] Hello ${args.join(' ')}! :)`, 'test', 'lol');
        }
    }
};