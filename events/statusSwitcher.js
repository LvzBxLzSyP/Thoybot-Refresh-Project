const { ActivityType } = require('discord.js');
const moment = require('moment-timezone');

/**
 * Event that triggers when the bot is ready and updates its status periodically based on different time zones.
 * 
 * Every minute, the bot will display the time according to the current time zone and switch between different time zones.
 * The displayed time will be formatted with the time zone name and a corresponding clock emoji.
 * 
 * @module events/ready
 */
module.exports = {
  name: 'ready', // The name of the event, indicating when the bot is ready
  once: true, // This event triggers only once when the bot is ready
  /**
   * Executes when the bot is ready, updating the bot's status based on the time zone.
   * 
   * @param {Client} client - The Discord client instance used to set the bot's activity.
   */
  execute(client) {
    let currentTimeZoneIndex = 0; // Index of the current time zone
    const timeZones = [
      { name: 'Taipei Standard Time', timeZone: 'Asia/Taipei' },
      { name: 'Coordinated Universal Time', timeZone: 'UTC' },
      { name: 'Central European Time', timeZone: 'Europe/Berlin' },
      { name: 'Central Standard Time', timeZone: 'America/Chicago' }
    ];

    /**
     * Updates the bot's status with the current time in the selected time zone.
     * The status includes the time and the appropriate clock emoji.
     */
    function updateStatus() {
      const now = moment(); // Get the current moment
      const { name, timeZone } = timeZones[currentTimeZoneIndex];
      const timeInTimeZone = getTimeInTimeZone(now, timeZone);

      // Format the time string
      const timeString = formatTimeString(timeInTimeZone, name, timeZone);

      // Get the appropriate clock emoji based on the time
      const clockEmoji = getClockEmoji(timeInTimeZone);

      // Update the bot's activity status
      client.user.setActivity(`${clockEmoji} ${timeString}`, { type: ActivityType.Custom });

      // Move to the next time zone in the list
      currentTimeZoneIndex = (currentTimeZoneIndex + 1) % timeZones.length;
    }

    /**
     * Schedules the next update after waiting for the next minute to start,
     * and then updates the status every 15 seconds.
     */
    function scheduleNextUpdate() {
      const now = moment();
      const timeToNextMinute = (60 - now.seconds()) * 1000; // Wait until the next minute

      setTimeout(() => {
        currentTimeZoneIndex = 0;  // Reset to the first time zone
        updateStatus(); // Update the status
        setInterval(updateStatus, 15 * 1000); // Update the status every 15 seconds
      }, timeToNextMinute);
    }

    /**
     * Converts the current time to a specified time zone using moment-timezone.
     * 
     * @param {Moment} time - The current moment object.
     * @param {string} timeZone - The name of the time zone (e.g., 'Asia/Taipei').
     * @returns {Moment} - The moment object in the specified time zone.
     */
    function getTimeInTimeZone(time, timeZone) {
      return time.tz(timeZone); // Convert the time to the specified time zone
    }

    /**
     * Determines if the specified moment is in Daylight Saving Time (DST).
     * 
     * @param {Moment} time - The current moment object.
     * @param {string} timeZone - The time zone to check (e.g., 'Asia/Taipei').
     * @returns {boolean} - Returns true if the time is in DST, otherwise false.
     */
    function isDST(time, timeZone) {
      const january = moment.tz(time.year(), timeZone).month(0).date(1); // January 1st of the current year
      return time.isDST(); // Check if the current time is in DST
    }

    /**
     * Formats the time string based on the specified time zone.
     * 
     * @param {Moment} time - The moment object in the specified time zone.
     * @param {string} timeZoneName - The name of the time zone (e.g., 'Taipei Standard Time').
     * @param {string} timeZone - The name of the time zone (e.g., 'Asia/Taipei').
     * @returns {string} - The formatted time string, including AM/PM and time zone information.
     */
    function formatTimeString(time, timeZoneName, timeZone) {
      const hour12 = time.hours() % 12 || 12;
      const ampm = time.hours() >= 12 ? 'PM' : 'AM';
      const isDSTActive = isDST(time, timeZone);

      switch (timeZoneName) {
        case 'Central European Time':
          return `${hour12.toString().padStart(2, '0')}:${time.minutes().toString().padStart(2, '0')} ${ampm} | ${isDSTActive ? 'Central European Summer Time' : 'Central European Time'}`;
        case 'Central Standard Time':
          return `${hour12.toString().padStart(2, '0')}:${time.minutes().toString().padStart(2, '0')} ${ampm} | ${isDSTActive ? 'Central Daylight Time' : 'Central Standard Time'}`;
        default:
          return `${hour12.toString().padStart(2, '0')}:${time.minutes().toString().padStart(2, '0')} ${ampm} | ${timeZoneName}`;
      }
    }

    /**
     * Returns a clock emoji based on the current time.
     * 
     * @param {Moment} time - The moment object representing the time.
     * @returns {string} - A clock emoji representing the current time.
     */

    scheduleNextUpdate(); // Start the update scheduling
  },
};