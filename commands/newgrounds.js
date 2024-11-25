const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const { get } = require('axios');
const cheerio = require('cheerio');

/**
 * Command to fetch and display information about Newgrounds audio
 * @module newgrounds
 */
module.exports = {
    /**
     * Command data definition for the `/newgrounds` command.
     * Allows users to get information about audio from Newgrounds.
     * 
     * @returns {SlashCommandBuilder} The command builder with subcommands.
     */
    data: new SlashCommandBuilder()
        .setName('newgrounds')
        .setDescription('Get any info from Newgrounds')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addSubcommand(subcommand =>
            subcommand
                .setName('audio')
                .setDescription('Get music from Newgrounds')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Music ID')
                        .setRequired(true)
                )
        ),
    
    /**
     * Command info including a short and full description.
     */
    info: {
        short: 'Get anything from Newgrounds',
        full: `Get Games, Movies, Sound, Arts From Newgrounds!
        Command syntax:
        \`/newgrounds audio <id:audio id>\`
        example:
        \`/newgrounds audio id:467339\``
    },

    /**
     * Whether the command is enabled.
     */
    enabled: true,

    /**
     * Executes the command based on the subcommand provided.
     * Fetches and displays information about Newgrounds audio.
     * 
     * @param {import('discord.js').CommandInteraction} interaction The interaction object from Discord.js.
     * @returns {Promise<void>} 
     */
    async execute(interaction) {
        const subcmd = interaction.options.getSubcommand();
        
        // Defer the reply while the API request is being made
        interaction.deferReply();

        if (subcmd === 'audio') {
            try {
                // Get the audio ID from the interaction options
                const audioId = interaction.options.getInteger('id');
                
                // Fetch the audio page using the Newgrounds API
                const { data } = await get(`https://www.newgrounds.com/audio/listen/${audioId}`);
                const audioInfo = cheerio.load(data); // Parse the HTML response using cheerio

                // Extract relevant information from the page
                const audioTitle = audioInfo("meta[property='og:title']").attr("content") || "Unknown Title";
                const audioAuthor = audioInfo("a.user").text().trim();
                const audioAuthorLink = audioInfo("a.user").attr("href");  // Get author's Newgrounds profile link
                const audioDesc = audioInfo("meta[property='og:description']").attr("content") || "Unknown Description";
                const audioThumbnail = audioInfo("meta[property='og:image']").attr("content");  // Get the audio's thumbnail image URL

                // Create an embed to display the audio information
                const audioEmbed = new EmbedBuilder()
                    .setTitle(`Info of audio: ${audioTitle} (${audioId})`)
                    .setDescription(audioDesc)
                    .setColor(getRandomColor())
                    .setFooter({ text: 'newgrounds.com' })
                    .setThumbnail(audioThumbnail) // Add the audio's thumbnail image
                    .addFields([
                        { name: 'Author', value: audioAuthor ? `[${audioAuthor}](${audioAuthorLink})` : 'Unknown Author', inline: true },
                        { name: 'Description', value: audioDesc, inline: true }
                    ]);

                // Send the embed as a reply to the interaction
                await interaction.editReply({ embeds: [audioEmbed] });

            } catch (error) {
                // If an error occurs, log it and inform the user
                if (error.response?.status === 404) {
                    await interaction.editReply({ content: 'Audio not found or has been deleted.'})
                } else if (error.response?.status === 500) {
                    await interaction.editReply({ content: 'Internal Server Error, try again later.' })
                } else {
                    errorWithTimestamp(error);
                    await interaction.editReply({ content: 'There was an error fetching the audio information. Please try again later.' });
                }
            }
        }
    }
};