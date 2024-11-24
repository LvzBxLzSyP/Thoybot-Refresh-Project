/**
 * Generates the corresponding clock emoji based on the given time.
 * 
 * This function takes a time object with methods `.hours()` and `.minutes()`, calculates the corresponding time
 * on a 12-hour clock format, and returns the matching clock emoji.
 * 
 * @param {Object} time - The time object that must support `.hours()` and `.minutes()` methods.
 * @param {function} time.hours - A function that returns the hour in 24-hour format (0-23).
 * @param {function} time.minutes - A function that returns the minute (0-59).
 * @returns {string} The corresponding clock emoji.
 */
function getClockEmoji(time) {
    const clockEmojis = [
        '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠',
        '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦'
    ];
    const hour = time.hours() % 12; // Convert to 12-hour format
    const halfHour = time.minutes() >= 30 ? 1 : 0; // Check if it's past half an hour
    const emojiIndex = hour * 2 + halfHour; // Calculate the emoji index
    return clockEmojis[emojiIndex]; // Return the corresponding clock emoji
}

module.exports = { getClockEmoji };