const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, Collection } = require('discord.js');

/**
 * Load all Discord bot components (commands, buttons, select menus)
 * @param {Client} client - Discord client instance
 * @param {string} projectPath - Project root path
 * @param {Object} options - Loading options
 * @param {boolean} options.loadCommands - Whether to load commands (default: true)
 * @param {boolean} options.loadButtons - Whether to load buttons (default: true)
 * @param {boolean} options.loadSelectMenus - Whether to load select menus (default: true)
 * @param {boolean} options.clearCache - Whether to clear require cache for hot-reloading (default: false)
 * @param {boolean} options.registerCommands - Whether to register slash commands to Discord (default: true)
 * @param {string} options.guildId - Guild ID for guild-specific commands (optional, omit for global commands)
 * @returns {Object} - Object containing loaded components
 */
const loadAllComponents = async (client, projectPath, options = {}) => {
    const {
        loadCommands = true,
        loadButtons = true,
        loadSelectMenus = true,
        clearCache = false,
        registerCommands = true,
        guildId = null
    } = options;

    logWithTimestamp('[Loader] Starting to load all components');

    const result = {
        commands: [],
        commandsCount: 0,
        buttonsCount: 0,
        selectMenusCount: 0,
        registered: false,
        errors: []
    };

    // Initialize collections
    if (!client.commands) client.commands = new Collection();
    if (!client.commandInfo) client.commandInfo = {};
    if (!client.buttons) client.buttons = new Collection();
    if (!client.selectMenus) client.selectMenus = new Collection();

    // Load Commands
    if (loadCommands) {
        try {
            const commandsResult = _loadCommands(client, projectPath, clearCache);
            result.commands = commandsResult.commands;
            result.commandsCount = commandsResult.count;

            // Register commands to Discord
            if (registerCommands && result.commands.length > 0) {
                try {
                    await _registerSlashCommands(client, result.commands, guildId);
                    result.registered = true;
                } catch (error) {
                    errorWithTimestamp(`[Loader] Failed to register commands: ${error}`);
                    result.errors.push({ type: 'registration', error: error.message });
                }
            }
        } catch (error) {
            errorWithTimestamp(`[Loader] Failed to load commands: ${error}`);
            result.errors.push({ type: 'commands', error: error.message });
        }
    }

    // Load Buttons
    if (loadButtons) {
        try {
            result.buttonsCount = _loadButtons(client, projectPath, clearCache);
        } catch (error) {
            errorWithTimestamp(`[Loader] Failed to load buttons: ${error}`);
            result.errors.push({ type: 'buttons', error: error.message });
        }
    }

    // Load Select Menus
    if (loadSelectMenus) {
        try {
            result.selectMenusCount = _loadSelectMenus(client, projectPath, clearCache);
        } catch (error) {
            errorWithTimestamp(`[Loader] Failed to load select menus: ${error}`);
            result.errors.push({ type: 'selectMenus', error: error.message });
        }
    }

    // Summary
    logWithTimestamp('[Loader] ═══════════════════════════════════════');
    logWithTimestamp(`[Loader] Commands loaded: ${result.commandsCount}`);
    logWithTimestamp(`[Loader] Commands registered: ${result.registered ? 'Yes' : 'No'}`);
    logWithTimestamp(`[Loader] Buttons loaded: ${result.buttonsCount}`);
    logWithTimestamp(`[Loader] Select menus loaded: ${result.selectMenusCount}`);
    if (result.errors.length > 0) {
        warnWithTimestamp(`[Loader] Errors encountered: ${result.errors.length}`);
    }
    logWithTimestamp('[Loader] ═══════════════════════════════════════');
    logWithTimestamp('[Loader] All components loaded successfully');

    return result;
};

/**
 * Reload all components with cache clearing
 * @param {Client} client - Discord client instance
 * @param {string} projectPath - Project root path
 * @param {Object} options - Reload options
 * @param {boolean} options.reloadCommands - Whether to reload commands (default: true)
 * @param {boolean} options.reloadButtons - Whether to reload buttons (default: true)
 * @param {boolean} options.reloadSelectMenus - Whether to reload select menus (default: true)
 * @param {boolean} options.registerCommands - Whether to re-register slash commands (default: true)
 * @param {string} options.guildId - Guild ID for guild-specific commands (optional)
 * @returns {Object} - Object containing reload results
 */
const reloadAllComponents = async (client, projectPath, options = {}) => {
    const {
        reloadCommands = true,
        reloadButtons = true,
        reloadSelectMenus = true,
        registerCommands = true,
        guildId = null
    } = options;

    logWithTimestamp('[Reload] ═══════════════════════════════════════');
    logWithTimestamp('[Reload] Starting hot reload of all components');
    logWithTimestamp('[Reload] ═══════════════════════════════════════');

    // Clear existing collections
    if (reloadCommands) {
        const oldCommandsCount = client.commands?.size || 0;
        client.commands?.clear();
        client.commandInfo = {};
        logWithTimestamp(`[Reload] Cleared ${oldCommandsCount} existing commands`);
    }

    if (reloadButtons) {
        const oldButtonsCount = client.buttons?.size || 0;
        client.buttons?.clear();
        logWithTimestamp(`[Reload] Cleared ${oldButtonsCount} existing buttons`);
    }

    if (reloadSelectMenus) {
        const oldSelectMenusCount = client.selectMenus?.size || 0;
        client.selectMenus?.clear();
        logWithTimestamp(`[Reload] Cleared ${oldSelectMenusCount} existing select menus`);
    }

    // Reload with cache clearing enabled
    const result = await loadAllComponents(client, projectPath, {
        loadCommands: reloadCommands,
        loadButtons: reloadButtons,
        loadSelectMenus: reloadSelectMenus,
        clearCache: true, // Be sure to clear the cache when reloading.
        registerCommands: registerCommands,
        guildId: guildId
    });

    logWithTimestamp('[Reload] ═══════════════════════════════════════');
    logWithTimestamp('[Reload] Hot reload completed successfully');
    logWithTimestamp('[Reload] ═══════════════════════════════════════');

    return result;
};

/**
 * Reload specific component type
 * @param {Client} client - Discord client instance
 * @param {string} projectPath - Project root path
 * @param {string} componentType - Type of component ('commands', 'buttons', 'selectMenus')
 * @param {Object} options - Additional options
 * @returns {Object} - Reload result
 */
const reloadComponent = async (client, projectPath, componentType, options = {}) => {
    logWithTimestamp(`[Reload] Reloading ${componentType}...`);

    const reloadOptions = {
        reloadCommands: componentType === 'commands',
        reloadButtons: componentType === 'buttons',
        reloadSelectMenus: componentType === 'selectMenus',
        ...options
    };

    return await reloadAllComponents(client, projectPath, reloadOptions);
};

/**
 * Register slash commands to Discord
 * @private
 */
const _registerSlashCommands = async (client, commands, guildId = null) => {
    const { REST, Routes } = require('discord.js');
    
    logWithTimestamp('[Registration] Starting to register slash commands');

    try {
        const rest = new REST({ version: '10' }).setToken(client.token);

        if (guildId) {
            // Register guild-specific commands (faster for testing)
            logWithTimestamp(`[Registration] Registering ${commands.length} guild commands to guild: ${guildId}`);
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: commands }
            );
            logWithTimestamp(`[Registration] Successfully registered ${commands.length} guild commands`);
        } else {
            // Register global commands (takes up to 1 hour to propagate)
            logWithTimestamp(`[Registration] Registering ${commands.length} global commands`);
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            logWithTimestamp(`[Registration] Successfully registered ${commands.length} global commands`);
        }

        return true;
    } catch (error) {
        errorWithTimestamp(`[Registration] Error registering commands: ${error}`);
        throw error;
    }
};

/**
 * Internal function to load commands
 * @private
 */
const _loadCommands = (client, projectPath, clearCache) => {
    logWithTimestamp('[Command] Starting to load commands');
    
    const commandsPath = path.join(projectPath, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        warnWithTimestamp(`[Command] Commands directory not found: ${commandsPath}`);
        return { commands: [], count: 0 };
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    const commands = [];
    let loadedCommandCount = 0;

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
            const filePath = path.join(commandsPath, file);
            
            if (clearCache) {
                delete require.cache[require.resolve(filePath)];
            }
            
            const commandModule = require(filePath);
            
            // Support both single command and array of commands
            const commandsToProcess = Array.isArray(commandModule) ? commandModule : [commandModule];

            for (const command of commandsToProcess) {
                // Handle legacy format
                if (!command.data) {
                    if (command.name) {
                        command.data = { name: command.name };
                    } else {
                        warnWithTimestamp(`[Command] Warning: Command in file ${file} is missing 'data' or 'name'. Skipping.`);
                        continue;
                    }
                }

                if (!isValidCommand(command, file)) continue;

                // Validate SlashCommandBuilder format
                if (command.data instanceof SlashCommandBuilder) {
                    if (!command.data.name || !command.execute) {
                        warnWithTimestamp(`[Command] Warning: Command in file ${file} is missing 'data.name' or 'execute'. Skipping.`);
                        continue;
                    }
                }

                debugWithTimestamp(`[Command] Loaded command: ${command.data.name}`);
                loadedCommandCount++;

                // Load subcommands if they exist
                if (command.subcommands) {
                    _loadSubcommands(client, command.subcommands, command.data);
                }

                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON ? command.data.toJSON() : command.data);

                if (command.info) {
                    client.commandInfo[command.data.name] = command.info;
                }
            }

        } catch (error) {
            errorWithTimestamp(`[Command] Error loading command file ${file}: ${error.stack}`);
        }
    }

    logWithTimestamp(`[Command] Total commands loaded: ${loadedCommandCount}`);
    
    return { commands, count: loadedCommandCount };
};

/**
 * Internal function to load subcommands
 * @private
 */
const _loadSubcommands = (client, subcommands, parentCommandData) => {
    logWithTimestamp('[Subcommand] Starting load subcommands');
    
    if (!parentCommandData.addSubcommand) {
        errorWithTimestamp(`[Subcommand] Parent command '${parentCommandData.name}' does not have the method 'addSubcommand'. Skipping subcommands.`);
        return;
    }
    
    logWithTimestamp(`[Subcommand] Loading subcommands for ${parentCommandData.name}`);

    let loadedSubcommandsCount = 0;

    for (const subcommand of subcommands) {
        const fullCommandName = `${parentCommandData.name} ${subcommand.data.name}`;

        try {
            if (!subcommand?.data?.name || !subcommand.execute) {
                warnWithTimestamp(`[Subcommand] Warning: Subcommand '${fullCommandName}' is missing 'data' or 'name' or 'execute'. Skipping.`);
                continue;
            }

            if (subcommand.enabled === false) {
                warnWithTimestamp(`[Subcommand] Subcommand '${fullCommandName}' is disabled, skipping.`);
                continue;
            }

            parentCommandData.addSubcommand(subcommand.data);
            debugWithTimestamp(`[Subcommand] Loaded subcommand: ${fullCommandName}`);

            if (subcommand.info) {
                client.commandInfo[fullCommandName] = subcommand.info;
            }

            client.commands.set(fullCommandName, subcommand);
            loadedSubcommandsCount++;

        } catch (error) {
            errorWithTimestamp(`[Subcommand] Error loading subcommand '${fullCommandName}': ${error}`);
        }
    }

    const subcommandWord = loadedSubcommandsCount === 1 ? 'subcommand' : 'subcommands';
    logWithTimestamp(`[Subcommand] Loaded ${loadedSubcommandsCount} ${subcommandWord} for ${parentCommandData.name}`);
};

/**
 * Internal function to load buttons
 * @private
 */
const _loadButtons = (client, projectPath, clearCache) => {
    const buttonsPath = path.join(projectPath, 'buttons');
    
    if (!fs.existsSync(buttonsPath)) {
        warnWithTimestamp(`[Button] Buttons directory not found: ${buttonsPath}`);
        return 0;
    }

    const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
    
    logWithTimestamp('[Button] Starting load buttons');

    for (const file of buttonFiles) {
        try {
            const filePath = path.join(buttonsPath, file);
            
            if (clearCache) {
                delete require.cache[require.resolve(filePath)];
            }
            
            const button = require(filePath);
            
            if (button.customId && button.execute) {
                if (Array.isArray(button.customId)) {
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

    logWithTimestamp(`[Button] Loaded ${client.buttons.size} buttons`);
    return client.buttons.size;
};

/**
 * Internal function to load select menus
 * @private
 */
const _loadSelectMenus = (client, projectPath, clearCache) => {
    const selectMenuPath = path.join(projectPath, 'selectmenu');
    
    if (!fs.existsSync(selectMenuPath)) {
        warnWithTimestamp(`[SelectMenu] Select menu directory not found: ${selectMenuPath}`);
        return 0;
    }

    const selectMenuFiles = fs.readdirSync(selectMenuPath).filter(file => file.endsWith('.js'));
    
    logWithTimestamp('[SelectMenu] Starting load select menus');
    
    for (const file of selectMenuFiles) {
        const filePath = path.join(selectMenuPath, file);

        try {
            if (clearCache) {
                delete require.cache[require.resolve(filePath)];
            }
            
            const selectMenu = require(filePath);

            if (selectMenu.data?.custom_id && selectMenu.execute) {
                client.selectMenus.set(selectMenu.data.custom_id, selectMenu);
                debugWithTimestamp(`[SelectMenu] Loaded select menu: ${selectMenu.data.custom_id}`);
            } else {
                warnWithTimestamp(`[SelectMenu] Invalid select menu file: ${file}`);
            }
        } catch (error) {
            errorWithTimestamp(`[SelectMenu] Failed to load select menu file ${file}: ${error}`);
        }
    }

    logWithTimestamp(`[SelectMenu] Loaded ${client.selectMenus.size} select menus`);
    return client.selectMenus.size;
};

module.exports = { 
    loadAllComponents,
    reloadAllComponents,
    reloadComponent,
    // Export individual loaders if needed
    registerSlashCommands: (client, commands, guildId = null) => _registerSlashCommands(client, commands, guildId),
    loadCommands: (client, projectPath, clearCache = false) => _loadCommands(client, projectPath, clearCache),
    loadButtons: (client, projectPath, clearCache = false) => _loadButtons(client, projectPath, clearCache),
    loadSelectMenus: (client, projectPath, clearCache = false) => _loadSelectMenus(client, projectPath, clearCache)
};