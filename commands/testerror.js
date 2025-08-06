const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

/**
 * This is a command to test error handling in the bot.
 * Only the owner (configured in config.json) is allowed to execute it.
 * If an error occurs, it will be reported to a specified channel.
 *
 * @module TestErrorCommand
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('testerror')
        .setNameLocalizations({
            'zh-TW': translate('testerror', 'zh-TW', 'name')
        })
        .setDescription('Test error handling'),

    /**
     * Whether the command is enabled or not.
     * @type {boolean}
     */
    enabled: false,

    /**
     * Executes the 'testerror' command.
     * This command intentionally throws an error to test the bot's error handling.
     *
     * @async
     * @param {import('discord.js').CommandInteraction} interaction The interaction object from the user.
     * @returns {Promise<void>} A promise indicating the command has been executed.
     */
    async execute(interaction) {
        // Check if the user is the bot owner
        if (interaction.user.id !== config.ownerId) {
            await interaction.reply({ content: 'You do not have permission to run this command.' });
            return;
        }

        try {
            // Intentionally throw an error to test error handling
            throw new Error('A test error happened');

        } catch (error) {
            // Catch the error and log it to the console
            errorWithTimestamp('Test error occurred:', error);

            // Create an embed for the error message
            const errorEmbed = new EmbedBuilder()
                .setTitle('Bot Error')
                .setDescription(`Test Error:\n\`\`\`${error.message}\`\`\``)
                .setColor(0xFF0000)
                .setTimestamp()
                .setFooter({ text: 'This is a test error, you can ignore it' });

            // Send the error message to the configured error channel
            const errorChannel = interaction.client.channels.cache.get(config.errorChannelId);
            if (errorChannel) {
                errorChannel.send({ embeds: [errorEmbed] }).catch(errorWithTimestamp);
            }

            // Reply to the user that the error has been reported
            await interaction.reply({
                content: 'An error occurred, and it has been reported to the administrator.',
                flags: MessageFlags.Ephemeral,
            });
        }
    }
};