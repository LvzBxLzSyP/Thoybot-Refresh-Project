/**
 * Handles the exit command, shuts down the bot, and closes the readline connection.
 * @module exit
 */
module.exports = {
    name: 'exit', // Command name
    /**
     * Executes when the user inputs the exit command, stopping the bot and closing the readline connection.
     * @param {import('readline').Interface} rl - The readline interface instance used for user interaction
     * @param {import('discord.js').Client} client - The Discord client instance used to control the bot
     * @returns {Promise<void>}
     */
    execute(rl, client) {
        logWithTimestamp('Closing bot'); // Log the timestamp when the bot is being closed
        client.destroy(); // Stop the Discord bot and disconnect from Discord
        rl.close(); // Close the readline interface
    }
};