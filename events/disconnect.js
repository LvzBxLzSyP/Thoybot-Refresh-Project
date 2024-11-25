/**
 * Handles the bot's disconnection event and attempts to reconnect.
 * 
 * When the bot disconnects, it tries to reconnect after 10 seconds, up to 5 times.
 * If the reconnection fails more than the maximum number of attempts, the program will exit.
 * 
 * @module events/disconnect
 */
const { token } = require('../config.json');

module.exports = {
    name: 'disconnect', // Event name
    once: false, // Set whether the event is triggered only once
    /**
     * This function is executed when the bot disconnects and attempts automatic reconnection.
     * 
     * @param {Client} client - The Discord client instance of the bot.
     */
    execute(client) {
        const MAX_RETRIES = 5; // Set the maximum number of retry attempts
        let retryCount = 0; // Initial retry count

        client.on('disconnect', () => {
            logWithTimestamp('Bot disconnected, attempting to reconnect in 10 seconds...');

            /**
             * Recursive function to attempt reconnection.
             * 
             * @returns {void}
             */
            const reconnect = () => {
                if (retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        client.login(token) // Attempt to log in again
                            .then(() => {
                                logWithTimestamp('Reconnected successfully');
                                retryCount = 0; // Reset the retry counter after success
                            })
                            .catch((err) => {
                                retryCount++; // Increment the retry count
                                errorWithTimestamp(`Reconnection failed (Attempt ${retryCount}):`, err);
                                if (retryCount >= MAX_RETRIES) {
                                    errorWithTimestamp('Max retries reached, exiting the program...');
                                    process.exit(1); // Exit after exceeding the maximum retry attempts
                                } else {
                                    reconnect(); // Continue attempting to reconnect
                                }
                            });
                    }, 10000); // Delay of 10 seconds
                }
            };

            reconnect(); // Initial reconnection attempt
        });
    },
};