const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

// Read configuration from config.json to get the default timezone
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8'));
const defaultTimezone = config.timezone || 'Asia/Taipei'; // Default timezone is set to 'Asia/Taipei' if not provided

/**
 * `/addcron` command module
 * @module addcron
 */
module.exports = {
    /**
     * Command data structure defining the slash command
     * @returns {SlashCommandBuilder} The SlashCommandBuilder object defining the command's structure
     */
    data: new SlashCommandBuilder()
        .setName('addcron')
        .setDescription('Set a reminder for a specific time or a daily reminder')
        .addStringOption(option =>
            option.setName('datetime')
                .setDescription('Enter the date and time for the reminder (e.g., "2024/11/02 11:40" or "11:40" for daily reminder)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send at the specified time')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('timezone')
                .setDescription('Select the timezone (defaults to Taipei timezone)')
                .setRequired(false))  // Timezone option is not required
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the channel to send the reminder to (leave empty to send it in the same channel or DM)')),

    /**
     * A short and full description of the command
     * @type {Object}
     * @property {string} short - Short description of the command
     * @property {string} full - Detailed description of the command
     */
    info: {
        short: 'Set a one-time or daily reminder with a specific time and message.',
        full: `/addcron <datetime> <message>
Set a reminder with either a one-time or daily recurrence.

Parameters:
- <datetime>:
    - One-time reminder: Provide the exact date and time in "YYYY/MM/DD HH:mm" format.
    - Daily reminder: Provide only the time in "HH:mm" format. This reminder will trigger daily at the specified time.
Examples:
- One-time reminder: 2024/11/02 11:40
- Daily reminder: 11:40

- <message>: The message to send at the specified time.

Note:
- One-time reminders will trigger at the specified time. If the specified time has already passed, provide a future time.
- Daily reminders will trigger at the specified time every day.

Examples:
1. \`/addcron 2024/11/02 11:40 Meeting reminder\` — Sets a one-time reminder for "Meeting reminder" on 2024/11/02 at 11:40.
2. \`/addcron 11:40 Good morning!\` — Sets a daily reminder for "Good morning!" at 11:40 every day.`
    },
    enabled: true,

    /**
     * Executes the `/addcron` command logic
     * @async
     * @function
     * @param {import('discord.js').Interaction} interaction - The interaction object from Discord
     * @returns {Promise<void>} A Promise that resolves with no value
     */
    async execute(interaction) {
        const dateTime = interaction.options.getString('datetime');
        const message = interaction.options.getString('message');
        const userTimezone = interaction.options.getString('timezone'); // User-selected timezone
        const channelOption = interaction.options.getChannel('channel'); // User-selected channel for reminder

        // Use the user-provided timezone, or fallback to the default timezone if not provided
        const timezone = userTimezone || defaultTimezone;

        // Attempt to parse the full datetime (one-time reminder)
        const fullDateTime = DateTime.fromFormat(dateTime, 'yyyy/MM/dd HH:mm', { zone: timezone });

        // Attempt to parse the time part only (daily reminder)
        const timeOnly = DateTime.fromFormat(dateTime, 'HH:mm', { zone: timezone });

        // Default channel is the current channel, or DM if no channel is provided
        const targetChannel = channelOption || interaction.channel || interaction.user;

        if (fullDateTime.isValid) {
            // One-time reminder, with specific date and time
            const now = DateTime.now().setZone(timezone); // Get the current time in the specified timezone
            const delay = fullDateTime.diff(now).milliseconds;

            if (delay <= 0) {
                return interaction.reply({ content: 'The specified time has already passed. Please provide a future time.', ephemeral: true });
            }

            // Send the reminder to the target channel at the specified time
            setTimeout(() => {
                targetChannel.send(message).catch(err => {
                    console.error('Error sending reminder:', err);
                });
            }, delay);

            await interaction.reply({ content: `Reminder set for ${fullDateTime.toFormat('yyyy/MM/dd HH:mm')} in ${targetChannel instanceof interaction.user.constructor ? 'DM' : targetChannel.name}.`, ephemeral: true });
        } else if (timeOnly.isValid) {
            // Daily reminder, only time part
            const hour = timeOnly.hour;
            const minute = timeOnly.minute;
            const cronExpression = `${minute} ${hour} * * *`; // Cron expression for daily reminders

            // Use the cron expression to trigger the reminder daily
            const delay = DateTime.now().setZone(timezone).endOf('day').plus({ days: 1 }).set({ hour, minute }).diffNow().milliseconds;

            setTimeout(() => {
                targetChannel.send(message).catch(err => {
                    console.error('Error sending reminder:', err);
                });
            }, delay);

            await interaction.reply({ content: `Daily reminder set for ${hour}:${minute} in ${targetChannel instanceof interaction.user.constructor ? 'DM' : targetChannel.name}.`, ephemeral: true });
        } else {
            // Invalid time format
            await interaction.reply({ content: 'Invalid time format. Please use the "YYYY/MM/DD HH:mm" or "HH:mm" format.', ephemeral: true });
        }
    },
};