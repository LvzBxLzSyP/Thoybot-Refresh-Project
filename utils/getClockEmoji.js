/**
 * Generates a detailed clock emoji representation based on the given time.
 * 
 * This function provides a precise clock emoji matching the input time, 
 * with support for half-hour increments. It uses the Luxon DateTime object 
 * to extract hour and minute information.
 * 
 * @example
 * // Returns '🕒' for 1:25 PM
 * const time = DateTime.now().set({ hour: 13, minute: 25 });
 * const emoji = getClockEmoji(time);
 * 
 * @param {DateTime} time - The Luxon DateTime object representing the current time.
 * @returns {string} A clock emoji precisely representing the time.
 * 
 * @description
 * - Uses a 24-emoji array to represent times from 12:00 AM to 11:30 PM
 * - Differentiates between exact hours and half-hour marks
 * - Converts 24-hour time to 12-hour clock emoji representation
 * 
 * @throws {TypeError} Throws an error if the input is not a valid Luxon DateTime object
 * 
 * @see {@link https://moment.github.io/luxon/|Luxon Documentation}
 */
function getClockEmoji(time) {
    // Validate input
    if (!time || typeof time.hour !== 'number' || typeof time.minute !== 'number') {
        throw new TypeError('Input must be a valid Luxon DateTime object');
    }

    // Clock emoji array representing times from 12:00 to 11:30
    const clockEmojis = [
        '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠',
        '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦'
    ];

    // Convert 24-hour time to 12-hour format
    const hour = time.hour % 12; 
    
    // Determine if time is past the half-hour mark
    const halfHour = time.minute >= 30 ? 1 : 0; 
    
    // Calculate the precise emoji index
    const emojiIndex = hour * 2 + halfHour;
    
    // Return the corresponding clock emoji
    return clockEmojis[emojiIndex];
}

module.exports = { getClockEmoji };