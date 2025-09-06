const { ActivityType } = require("discord.js");
const { DateTime } = require("luxon");

/**
 * Event that triggers when the bot is ready and updates its status periodically based on different time zones.
 *
 * Every minute, the bot will display the time according to the current time zone and switch between different time zones.
 * The displayed time will be formatted with the time zone name and a corresponding clock emoji.
 *
 * @module events/ready
 */
module.exports = {
    name: "ready", // The name of the event, indicating when the bot is ready
    once: true, // This event triggers only once when the bot is ready
    /**
     * Executes when the bot is ready, updating the bot's status based on the time zone.
     *
     * @param {Client} client - The Discord client instance used to set the bot's activity.
     */
    execute(client) {
        let currentTimeZoneIndex = 0; // Index of the current time zone
        const timeZones = [
            { name: "Taipei Standard Time", timeZone: "Asia/Taipei" },
            { name: "Coordinated Universal Time", timeZone: "UTC" },
            { name: "Central European Time", timeZone: "Europe/Berlin" },
            { name: "Central Standard Time", timeZone: "America/Chicago" },
        ];

        /**
         * Updates the bot's status with the current time in the selected time zone.
         * The status includes the time and the appropriate clock emoji.
         */
        function updateStatus(now) {
            const { name, timeZone } = timeZones[currentTimeZoneIndex];
            const timeInTimeZone = getTimeInTimeZone(now, timeZone);
        
            const timeString = formatTimeString(timeInTimeZone, name, timeZone);
            const clockEmoji = getClockEmoji(timeInTimeZone);
        
            client.user.setActivity(`${clockEmoji} ${timeString}`, {
                type: ActivityType.Custom, // 或改用 Watching/Playing 見前一則回覆
            });
        
            currentTimeZoneIndex = (currentTimeZoneIndex + 1) % timeZones.length;
        }

        /**
         * Schedules the next update after waiting for the next minute to start,
         * and then updates the status every 15 seconds.
         */
        function scheduleNextUpdate() {
            const now = DateTime.now();
            const timeToNextMinute = (60 - now.second) * 1000;
        
            setTimeout(() => {
                currentTimeZoneIndex = 0;
        
                // 在這裡先取得一次時間並傳入
                let now = DateTime.now();
                updateStatus(now);
        
                setInterval(() => {
                    now = DateTime.now(); // 每次都重新取得一次時間，但只用一次
                    updateStatus(now);
                }, 15 * 1000);
            }, timeToNextMinute);
        }

        /**
         * Converts the current time to a specified time zone using Luxon.
         *
         * @param {DateTime} time - The current DateTime object.
         * @param {string} timeZone - The name of the time zone (e.g., 'Asia/Taipei').
         * @returns {DateTime} - The DateTime object in the specified time zone.
         */
        function getTimeInTimeZone(time, timeZone) {
            return time.setZone(timeZone); // Convert the time to the specified time zone
        }

        /**
         * Determines if the specified DateTime is in Daylight Saving Time (DST).
         *
         * @param {DateTime} time - The current DateTime object.
         * @returns {boolean} - Returns true if the time is in DST, otherwise false.
         */
        function isDST(time) {
            return time.isInDST;
        }

        /**
         * Formats the time string based on the specified time zone.
         *
         * @param {DateTime} time - The DateTime object in the specified time zone.
         * @param {string} timeZoneName - The name of the time zone (e.g., 'Taipei Standard Time').
         * @param {string} timeZone - The name of the time zone (e.g., 'Asia/Taipei').
         * @returns {string} - The formatted time string, including AM/PM and time zone information.
         */
        function formatTimeString(time, timeZoneName, timeZone) {
            const hour12 = time.hour % 12 || 12;
            const ampm = time.hour >= 12 ? "PM" : "AM";
            const isDSTActive = isDST(time);

            switch (timeZoneName) {
                case "Central European Time":
                    return `${hour12.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")} ${ampm} | ${isDSTActive ? "Central European Summer Time" : "Central European Time"}`;
                case "Central Standard Time":
                    return `${hour12.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")} ${ampm} | ${isDSTActive ? "Central Daylight Time" : "Central Standard Time"}`;
                default:
                    return `${hour12.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")} ${ampm} | ${timeZoneName}`;
            }
        }

        scheduleNextUpdate(); // Start the update scheduling
    },
};
