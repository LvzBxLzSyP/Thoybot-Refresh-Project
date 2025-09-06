// commands/time.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import loadUtils from '../utils/loadUtils.js';
const utils = await loadUtils();
const { createButtons } = utils;
import { DateTime } from 'luxon';
import timezonesJson from '../jsons/timezones.json' with { type: 'json' };
import tzCodeJson from '../jsons/tzCode.json' with { type: 'json' };
/**
 * Generate fields for the timezones to be displayed in the embed.
 * @param {number} page
 */
const getTimezoneFields = (page) => {
    const tzCodes = timezonesJson.map(item => item.utc);
    const tzNameMap = Object.fromEntries(timezonesJson.map(tz => [tz.utc, tz.text]));

    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const timezonesOnPage = tzCodes.slice(startIndex, endIndex);

    return timezonesOnPage.map(tz => {
        const time = DateTime.now().setZone(tz);
        const tzName = tzNameMap[tz] || 'Unknown Timezone';
        const emoji = global.getClockEmoji(time);
        return {
            name: `${tzName}`,
            value: time.toFormat(`${emoji} yyyy-MM-dd HH:mm:ss`),
            inline: false,
        };
    });
};

export const data = new SlashCommandBuilder()
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
    );

export const info = {
    short: 'Display the current time in different timezones',
    full: `Display the current time for all IANA defined timezones.
Command usage:
\`/time\`
Or show a specific timezone: \`/time timezone:<timezone>\``
};

export const enabled = true;

export async function execute(interaction) {
    const defaultEphemeral = interaction.channel ? false : true;
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? defaultEphemeral;
    const specifiedTimezone = interaction.options.getString('timezone');

    await interaction.deferReply({ ephemeral });

    if (specifiedTimezone) {
        if (!tzCodeJson.includes(specifiedTimezone)) {
            return interaction.editReply({
                content: `Invalid timezone name: \`${specifiedTimezone}\`. Please enter a valid timezone!`,
            });
        }

        const timeInSpecifiedZone = DateTime.now().setZone(specifiedTimezone);
        const emoji = global.getClockEmoji(timeInSpecifiedZone);
        const embed = new EmbedBuilder()
            .setTitle(`Timezone: ${specifiedTimezone}`)
            .setDescription(`Current time: ${emoji} ${timeInSpecifiedZone.toFormat('yyyy-MM-dd HH:mm:ss')}`)
            .setColor(getRandomColor());

        return interaction.editReply({ embeds: [embed] });
    }

    const totalPages = Math.ceil(timezonesJson.length / ITEMS_PER_PAGE);
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
}
