const { SlashCommandBuilder } = require('discord.js');

/**
 * 'say' command allows the bot to send a specified message.
 * 
 * @type {import('discord.js').SlashCommand}
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Send the specified message')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The content of the message to send')
                .setRequired(true)),
    info: {
        short: 'Makes the bot say what you want',
        full: `Makes the bot send your message.
        Command usage:
        \`/say <message:your message>\`
        Example:
        \`/say message: Hello World!\``
    },
    enabled: true,

    /**
     * Executes the `/say` command and sends the specified message to the channel.
     * 
     * @param {import('discord.js').CommandInteraction} interaction The interaction object representing the user's command.
     * @returns {Promise<void>} Resolves when the message is sent.
     */
    async execute(interaction) {
        const messageContent = interaction.options.getString('message'); // Get message content from interaction

        // Check if there is a channel, send the message to the channel
        if (!interaction.channel) {
            await interaction.reply(messageContent); // Reply with the message if no channel is present
        } else {
            await interaction.reply({ content: 'Sending the message...', ephemeral: true }); // Inform the user that the message is being sent
            await interaction.channel.send(messageContent); // Send the message to the channel
        }
    },
};