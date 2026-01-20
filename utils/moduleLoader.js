const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
/**
 * Load all commands from commands
 * @returns {*[]} - Commands array
 */
const loadCommands = () => {
    logWithTimestamp('[Command] Starting to load commands');
    
    if (!client.commands) client.commands = new Collection();
    if (!client.commandInfo) client.commandInfo = {};

    const commandFiles = fs.readdirSync(path.join(__projname, 'commands')).filter(file => file.endsWith('.js'));
    const commands = [];
    let loadedCommandCount = 0; // Track the number of commands loaded

    const isValidCommand = (command, file) => {
        if (!command.data || !command.execute) {
            warnWithTimestamp(`[Command] Warning: Command file ${file} is missing 'data' or 'execute'. Skipping.`);
            return false;
        }
        if (command.enabled === false) {
            warnWithTimestamp(`[Command] Command '${command.data.name}' is disabled, skipping.`);
            return false;
        }
        return true;
    };

    for (const file of commandFiles) {
        try {
            const command = require(path.join(__projname, 'commands', file));

            // Handle legacy format by assigning 'data' from 'name' if necessary
            if (!command.data) {
                if (command.name) {
                    command.data = { name: command.name };
                } else {
                    warnWithTimestamp(`[Command] Warning: Command file ${file} is missing 'data' or 'name'. Skipping.`);
                    continue;
                }
            }

            // Validate the command format
            if (!isValidCommand(command, file)) continue;

            // If using SlashCommandBuilder format, ensure it is valid
            if (command.data instanceof SlashCommandBuilder) {
                if (!command.data.name || !command.execute) {
                    warnWithTimestamp(`[Command] Warning: Command file ${file} is missing 'data.name' or 'execute'. Skipping.`);
                    continue;
                }
            }

            // Log the successfully loaded command
            debugWithTimestamp(`[Command] Loaded command: ${command.data.name}`);
            loadedCommandCount++;

            // Load subcommands if they exist
            if (command.subcommands) {
                loadSubcommands(command.subcommands, command.data);
            }

            // Add the command to the collection
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON ? command.data.toJSON() : command.data);

            // Store additional command info
            if (command.info) {
                client.commandInfo[command.data.name] = command.info;
            }

        } catch (error) {
            errorWithTimestamp(`[Command] Error loading command file ${file}: ${error.stack}`);
        }
    }

    verboseWithTimestamp(`[VariableTest] client.commands: ${JSON.stringify(client.commands, null, 2)}`);
    verboseWithTimestamp(`[VariableTest] \nclient.commandInfo = ${JSON.stringify(client.commandInfo, null, 2)}`);

    // Log the total number of commands loaded
    logWithTimestamp(`[Command] Total commands loaded: ${loadedCommandCount}`);
    logWithTimestamp('[Command] All commands loaded');

    return commands;
};

/**
 * If parent command has subcommands then load it
 * @param subcommands - command.subcommand[]
 * @param parentCommandData - command
 */
// Loading subcommands
const loadSubcommands = (subcommands, parentCommandData) => {

    logWithTimestamp('[Subcommand] Starting load subcommands');
    // Ensure the parent command has the method `addSubcommand`
    if (!parentCommandData.addSubcommand) {
        errorWithTimestamp(`[Subcommand] Parent command '${parentCommandData.name}' does not have the method 'addSubcommand'. Skipping subcommands.`);
        return;
    }
    
    logWithTimestamp(`[Subcommand] Loading subcommands for ${parentCommandData.name}`);

    // Initialize a counter for the number of loaded subcommands
    let loadedSubcommandsCount = 0;

    // Iterate over all subcommands
    for (const subcommand of subcommands) {
        const fullCommandName = `${parentCommandData.name} ${subcommand.data.name}`;

        try {
            // Make sure the subcommand structure is correct
            if (!subcommand || !subcommand.data || !subcommand.data.name || !subcommand.execute) {
                warnWithTimestamp(`[Subcommand] Warning: Subcommand '${fullCommandName}' is missing 'data' or 'name' or 'execute'. Skipping.`);
                continue;
            }

            // If the subcommand is disabled, it is skipped.
            if (subcommand.enabled === false) {
                warnWithTimestamp(`[Subcommand] Subcommand '${fullCommandName}' is disabled, skipping.`);
                continue;
            }

            // Add subcommand to the parent command's subcommand
            parentCommandData.addSubcommand(subcommand.data);

            // Output information about successful subcommand loading
            debugWithTimestamp(`[Subcommand] Loaded subcommand: ${fullCommandName}`);

            // If there is additional information, it can be stored
            if (subcommand.info) {
                client.commandInfo[fullCommandName] = subcommand.info;
            }

            // Subcommands are added to the client's command set.
            client.commands.set(fullCommandName, subcommand);

            // Increment the count of loaded subcommands
            loadedSubcommandsCount++;

        } catch (error) {
            errorWithTimestamp(`[Subcommand] Error loading subcommand '${fullCommandName}': ${error}`);
        }
    }

    // Display the number of loaded subcommands for the parent command
    const subcommandWord = loadedSubcommandsCount === 1 ? 'subcommand' : 'subcommands';
    logWithTimestamp(`[Subcommand] Loaded ${loadedSubcommandsCount} ${subcommandWord} for ${parentCommandData.name}`);
};

const loadButtons = () => {
    const buttonFiles = fs.readdirSync(path.join(__projname, 'buttons')).filter(file => file.endsWith('.js'));
    
    logWithTimestamp('[Button] Starting load buttons');

    for (const file of buttonFiles) {
        try {
            const button = require(path.join(__projname, 'buttons', file));
            if (button.customId && button.execute) {
                if (Array.isArray(button.customId)) {
                    // If there are multiple customIds, register them separately
                    button.customId.forEach(id => client.buttons.set(id, button));
                } else {
                    client.buttons.set(button.customId, button);
                }
                debugWithTimestamp(`[Button] Loaded button: ${button.customId}`);
            } else {
                warnWithTimestamp(`[Button] Invalid button file: ${file}`);
            }
        } catch (error) {
            errorWithTimestamp(`[Button] Failed to load button file ${file}: ${error}`);
        }
    }

    logWithTimestamp('[Button] Loaded all buttons');
};

const loadSelectMenus = () => {
    const selectMenuPath = path.join(__projname, 'selectmenu'); // Get the path to the selectmenu directory

    // Read all files ending with .js in the directory
    const selectMenuFiles = fs.readdirSync(selectMenuPath).filter(file => file.endsWith('.js'));
    
    logWithTimestamp('[SelectMenu] Starting load select menus')
    
    // Traverse each select menu file
    for (const file of selectMenuFiles) {
        const filePath = path.join(selectMenuPath, file);  // Get the full path of the file

        try {
            const selectMenu = require(filePath);  // Dynamically loading modules

            if (selectMenu.data && selectMenu.execute) {
                // Register the custom_id and corresponding execution method of each select menu
                client.selectMenus.set(selectMenu.data.custom_id, selectMenu);
                debugWithTimestamp(`[SelectMenu] Loaded select menu: ${selectMenu.data.custom_id}`);
            } else {
                warnWithTimestamp(`[SelectMenu] Invalid select menu file: ${file}`);
            }
        } catch (error) {
            errorWithTimestamp(`[SelectMenu] Failed to load select menu file ${file}: ${error}`);
        }
    }

    logWithTimestamp('[SelectMenu] Loaded all select menus');
};

module.exports = { loadCommands, loadSubcommands, loadButtons, loadSelectMenus };