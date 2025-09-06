const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { createButtons } = require('../utils/loadUtils');
const { DateTime } = require('luxon');

/**
 * Generate fields for the timezones to be displayed in the embed.
 * @param {number} page - The page number to display.
 * @returns {Array<Object>} An array of objects representing the timezones and their formatted times.
 */
const getTimezoneFields = (page) => {
    // Retrieve timezone names using custom JSON
    const timezones = require('../jsons/timezones.json');
    const tzCodes = timezones.map(item => item.utc); // Get an array of all first UTC values
    const tzNameMap = Object.fromEntries(timezones.map(tz => [tz.utc, tz.text])); // Create a correspondence table between text and utc
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const timezonesOnPage = tzCodes.slice(startIndex, endIndex);

    // Create fields for each timezone
    return timezonesOnPage.map(tz => {
        const time = DateTime.now().setZone(tz);
        const tzName = tzNameMap[tz] || 'Unknown Timezone'; // Find the corresponding tzNames. If it does not exist, 'Unknown Timezone' will be displayed.
        const emoji = global.getClockEmoji(time); // Use the global getClockEmoji function
        return {
            name: `${tzName}`, // Show the timezone
            value: time.toFormat(`${emoji} yyyy-MM-dd HH:mm:ss`),
            inline: false, // Make sure each field is displayed in a separate line
        };
    });
};

/**
 * Create navigation buttons for the embed.
 * @param {number} page - The current page number.
 * @param {number} totalPages - The total number of pages.
 * @returns {ActionRowBuilder} A row of buttons for navigation.
 */
// const createButtons = (page, totalPages) => {
//    return new ActionRowBuilder()
//        .addComponents(
//            new ButtonBuilder()
//                .setCustomId(`time_previous_${page}`)
//                .setLabel('Previous')
//                .setStyle(ButtonStyle.Primary)
//                .setDisabled(page === 0),
//            new ButtonBuilder()
//                .setCustomId(`time_next_${page}`)
//                .setLabel('Next')
//                .setStyle(ButtonStyle.Primary)
//                .setDisabled(page === totalPages - 1)
//        );
// };

/**
 * Time command handler to show the current time in various timezones.
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setNameLocalizations({
            'zh-TW': translate('time', 'zh-TW', 'name')
        })
        .setDescription('Display the current time in different timezones.')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addStringOption(option =>
            option.setName('timezone')
                .setDescription('Show the time for a specific timezone (e.g., Asia/Taipei)')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('Whether to display the message as ephemeral')
                .setRequired(false)
        ),
    info: {
        short: 'Display the current time in different timezones',
        full: `Display the current time for all IANA defined timezones.
        Command usage:
        \`/time\`
        Or show a specific timezone: \`/time timezone:<timezone>\``
    },
    enabled: true,
    /**
     * Executes the command to display the current time in different timezones.
     * @param {import('discord.js').CommandInteraction} interaction - The interaction that triggered the command.
     */
    async execute(interaction) {
        const defaultEphemeral = interaction.channel ? false : true;
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? defaultEphemeral;
        const specifiedTimezone = interaction.options.getString('timezone');

        // Defer the reply to avoid Unknown Interaction error
        await interaction.deferReply({ ephemeral });
        
        // If a timezone is specified, show the time for that timezone
        if (specifiedTimezone) {
            const timezones = require('../jsons/tzCode.json');
            if (!timezones.includes(specifiedTimezone)) {
                return interaction.editReply({
                    content: `Invalid timezone name: \`${specifiedTimezone}\`. Please enter a valid timezone!`,
                });
            }

            const timeInSpecifiedZone = DateTime.now().setZone(specifiedTimezone);
            const emoji = global.getClockEmoji(timeInSpecifiedZone); // Get the clock emoji for the specified timezone
            const embed = new EmbedBuilder()
                .setTitle(`Timezone: ${specifiedTimezone}`)
                .setDescription(`Current time: ${emoji} ${timeInSpecifiedZone.toFormat('yyyy-MM-dd HH:mm:ss')}`)
                .setColor(getRandomColor());

            return interaction.editReply({ embeds: [embed] });
        }
        
        const timezones = require('../jsons/timezones.json');
        
        // If no timezone is specified, show the first page of timezones
        const totalPages = Math.ceil(timezones.length / ITEMS_PER_PAGE);
        const currentPage = 0;

        const embed = new EmbedBuilder()
            .setTitle('Current Time in Different Timezones')
            .setDescription(`This is page 1 of ${totalPages}:`)
            .setColor(getRandomColor())
            .addFields(getTimezoneFields(currentPage));

        await interaction.editReply({
            embeds: [embed],
            components: [createButtons(currentPage, totalPages)],
        });
    },
};