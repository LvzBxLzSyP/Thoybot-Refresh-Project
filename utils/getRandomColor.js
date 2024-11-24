/**
 * Generates a random hexadecimal color value.
 * 
 * This function generates a random integer between 0x000000 and 0xFFFFFF, representing a color in the hexadecimal format.
 * 
 * @returns {number} A randomly generated color value (between 0x000000 and 0xFFFFFF).
 */
function getRandomColor() {
    return Math.floor(Math.random() * 0xFFFFFF); // Generate a random integer between 0 and 0xFFFFFF
}

module.exports = { getRandomColor };