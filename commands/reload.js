const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { reloadAllComponents, reloadComponent } = require('../utils/moduleLoader');

/**
 * Check if user has permission to reload
 */
const checkPermission = (interaction) => {
    if (interaction.user.id !== config.ownerId) {
        return { 
            allowed: false, 
            message: 'You do not have permission to reload commands!' 
        };
    }
    return { allowed: true };
};

/**
 * Reload a single command file
 */
const reloadSingleCommand = async (interaction, commandName) => {
    const commandPath = path.join(__dirname, '..', 'commands', `${commandName}.js`);

    // Check if the command exists
    if (!fs.existsSync(commandPath)) {
        return interaction.editReply({ 
            content: `❌ Command \`${commandName}\` not found.`, 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Log: record who is reloading the command
    warnWithTimestamp(`[Command] Command ${commandName} is being reloaded by ${interaction.user.username}`);

    try {
        // Delete old command module cache
        delete require.cache[require.resolve(commandPath)];

        // Reload the specified command
        const commandModule = require(commandPath);
        
        // Support both single command and array of commands
        const commandsToProcess = Array.isArray(commandModule) ? commandModule : [commandModule];

        for (const command of commandsToProcess) {
            // Update client.commands
            interaction.client.commands.set(command.data.name, command);

            // If the command contains info, insert it into client.commandInfo
            if (command.info) {
                interaction.client.commandInfo[command.data.name] = command.info;
            }
        }

        // Log: Reload successful
        logWithTimestamp(`[Command] Command ${commandName} was successfully reloaded (${commandsToProcess.length} command(s))`);

        // Return a successful response
        return interaction.editReply({ 
            content: `✅ Command \`${commandName}\` has been reloaded successfully! (${commandsToProcess.length} command(s))` 
        });
    } catch (error) {
        // Catching errors and responding
        errorWithTimestamp(`[Command] Error reloading ${commandName}: ${error}`);
        return interaction.editReply({ 
            content: `❌ An error occurred while reloading the command: ${error.message}`, 
            flags: MessageFlags.Ephemeral 
        });
    }
};

/**
 * Command 1: Reload a single command
 */
const reloadCommand = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setNameLocalizations({
            'zh-TW': translate('reload', 'zh-TW', 'name')
        })
        .setDescription('Reload a specific command.')
        .setDescriptionLocalizations({
            'zh-TW': translate('reload', 'zh-TW', 'description')
        })
        .addStringOption(option =>
            option.setName('command')
                .setNameLocalizations({
                    'zh-TW': '指令'
                })
                .setDescription('Command name to reload')
                .setDescriptionLocalizations({
                    'zh-TW': '要重新載入的指令名稱'
                })
                .setRequired(true)
        )
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const permCheck = checkPermission(interaction);
        if (!permCheck.allowed) {
            return interaction.editReply({ content: permCheck.message });
        }

        const commandName = interaction.options.getString('command');
        return reloadSingleCommand(interaction, commandName);
    }
};

/**
 * Command 2: Reload all components
 */
const reloadAllCommand = {
    data: new SlashCommandBuilder()
        .setName('reloadall')
        .setNameLocalizations({
            'zh-TW': translate('reloadall', 'zh-TW', 'name')
        })
        .setDescription('Reload all bot components (commands, buttons, select menus)')
        .setDescriptionLocalizations({
            'zh-TW': translate('reloadall', 'zh-TW', 'description')
        })
        .addBooleanOption(option =>
            option.setName('register')
                .setNameLocalizations({
                    'zh-TW': '註冊'
                })
                .setDescription('Whether to re-register commands to Discord')
                .setDescriptionLocalizations({
                    'zh-TW': '是否重新註冊指令到 Discord'
                })
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('guild_id')
                .setNameLocalizations({
                    'zh-TW': '伺服器編號'
                })
                .setDescription('Guild ID for faster registration (testing only)')
                .setDescriptionLocalizations({
                    'zh-TW': '伺服器 ID，用於快速註冊（僅測試用）'
                })
                .setRequired(false)
        )
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const permCheck = checkPermission(interaction);
        if (!permCheck.allowed) {
            return interaction.editReply({ content: permCheck.message });
        }

        const shouldRegister = interaction.options.getBoolean('register') ?? true;
        const guildId = interaction.options.getString('guild_id') || null;

        warnWithTimestamp(`[Reload] All components are being reloaded by ${interaction.user.username}`);

        try {
            await interaction.editReply({ content: '⏳ Reloading all components...' });

            const result = await reloadAllComponents(interaction.client, __projname, {
                registerCommands: shouldRegister,
                guildId: guildId
            });

            const summary = [
                '✅ **All components reloaded successfully!**',
                '',
                `📋 Commands: ${result.commandsCount}`,
                `🔘 Buttons: ${result.buttonsCount}`,
                `📝 Select Menus: ${result.selectMenusCount}`,
                `${shouldRegister ? '✓' : '✗'} Commands ${result.registered ? 'registered' : 'not registered'}`,
            ];

            if (result.errors.length > 0) {
                summary.push('', `⚠️ Errors: ${result.errors.length}`);
            }

            if (guildId) {
                summary.push('', `🎯 Registered to guild: ${guildId}`);
            }

            logWithTimestamp(`[Reload] All components reloaded successfully by ${interaction.user.username}`);

            return interaction.editReply({ content: summary.join('\n') });
        } catch (error) {
            errorWithTimestamp(`[Reload] Error reloading all components: ${error}`);
            return interaction.editReply({ 
                content: `❌ An error occurred while reloading: ${error.message}`, 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
};

/**
 * Command 3: Reload specific component type
 */
const reloadCompCommand = {
    data: new SlashCommandBuilder()
        .setName('reloadcomp')
        .setNameLocalizations({
            'zh-TW': translate('reloadcomp', 'zh-TW', 'name')
        })
        .setDescription('Reload a specific component type')
        .setDescriptionLocalizations({
            'zh-TW': translate('reloadcomp', 'zh-TW', 'description')
        })
        .addStringOption(option =>
            option.setName('type')
                .setNameLocalizations({
                    'zh-TW': '類型'
                })
                .setDescription('Component type to reload')
                .setDescriptionLocalizations({
                    'zh-TW': '要重新載入的組件類型'
                })
                .setRequired(true)
                .addChoices(
                    { name: 'Commands', name_localizations: { 'zh-TW': '指令' }, value: 'commands' },
                    { name: 'Buttons', name_localizations: { 'zh-TW': '按鈕' }, value: 'buttons' },
                    { name: 'Select Menus', name_localizations: { 'zh-TW': '選單' }, value: 'selectMenus' }
                )
        )
        .addBooleanOption(option =>
            option.setName('register')
                .setNameLocalizations({
                    'zh-TW': '註冊'
                })
                .setDescription('Whether to re-register commands (commands only)')
                .setDescriptionLocalizations({
                    'zh-TW': '是否重新註冊指令（僅限指令）'
                })
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('guild_id')
                .setNameLocalizations({
                    'zh-TW': '伺服器編號'
                })
                .setDescription('Guild ID for faster registration (commands only, testing)')
                .setDescriptionLocalizations({
                    'zh-TW': '伺服器 ID（僅限指令，測試用）'
                })
                .setRequired(false)
        )
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const permCheck = checkPermission(interaction);
        if (!permCheck.allowed) {
            return interaction.editReply({ content: permCheck.message });
        }

        const componentType = interaction.options.getString('type');
        const shouldRegister = interaction.options.getBoolean('register') ?? true;
        const guildId = interaction.options.getString('guild_id') || null;

        const typeNames = {
            'commands': 'Commands',
            'buttons': 'Buttons',
            'selectMenus': 'Select Menus'
        };

        warnWithTimestamp(`[Reload] ${typeNames[componentType]} are being reloaded by ${interaction.user.username}`);

        try {
            await interaction.editReply({ content: `⏳ Reloading ${typeNames[componentType]}...` });

            const result = await reloadComponent(interaction.client, __projname, componentType, {
                registerCommands: componentType === 'commands' ? shouldRegister : false,
                guildId: componentType === 'commands' ? guildId : null
            });

            const summary = [
                `✅ **${typeNames[componentType]} reloaded successfully!**`,
                ''
            ];

            if (componentType === 'commands') {
                summary.push(
                    `📋 Commands loaded: ${result.commandsCount}`,
                    `${shouldRegister ? '✓' : '✗'} Commands ${result.registered ? 'registered' : 'not registered'}`
                );
                if (guildId) {
                    summary.push(`🎯 Registered to guild: ${guildId}`);
                }
            } else if (componentType === 'buttons') {
                summary.push(`🔘 Buttons loaded: ${result.buttonsCount}`);
            } else if (componentType === 'selectMenus') {
                summary.push(`📝 Select Menus loaded: ${result.selectMenusCount}`);
            }

            if (result.errors.length > 0) {
                summary.push('', `⚠️ Errors: ${result.errors.length}`);
            }

            logWithTimestamp(`[Reload] ${typeNames[componentType]} reloaded successfully by ${interaction.user.username}`);

            return interaction.editReply({ content: summary.join('\n') });
        } catch (error) {
            errorWithTimestamp(`[Reload] Error reloading ${typeNames[componentType]}: ${error}`);
            return interaction.editReply({ 
                content: `❌ An error occurred while reloading: ${error.message}`, 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
};

// Export all three commands
module.exports = [
    reloadCommand,
    reloadAllCommand,
    reloadCompCommand
];