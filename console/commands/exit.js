/**
 * Handles the exit command, shuts down the bot, and closes the console interface.
 * @module exit
 */
module.exports = {
    name: 'exit',
    /**
     * Executes when the user inputs the exit command, stopping the bot and closing the console interface.
     */
    execute() {
        shutdown('exit');
    }
};