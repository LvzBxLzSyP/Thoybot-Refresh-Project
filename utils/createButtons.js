const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Creates a button row containing pagination buttons.
 * 
 * This function generates a set of buttons that allow the user to navigate between pages in a paginated interface.
 * The buttons are labeled "Previous" and "Next", and they are disabled when the user is on the first or last page.
 * 
 * @param {number} page - The current page number, starting from 0.
 * @param {number} totalPages - The total number of pages.
 * @returns {ActionRowBuilder} - A row of buttons containing pagination controls.
 */
const createButtons = (page, totalPages) => {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`time_previous_${page}`)
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 0),  // Disable the "Previous" button if on the first page
            new ButtonBuilder()
                .setCustomId(`time_next_${page}`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages - 1)  // Disable the "Next" button if on the last page
        );
};

module.exports = { createButtons };