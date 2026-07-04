const { SlashCommandBuilder, SlashCommandSubcommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const pm = require('../utils/pluginManager');

// ─── /plugin list ─────────────────────────────────────────────────────────────

const listSubcommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('list')
        .setDescription('List all plugins and their status'),

    info: {
        short: 'List all plugins',
        full: 'Show all registered plugins, their version, and current status.\n\nSyntax: `/plugin list`'
    },

    enabled: true,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const plugins = pm.list();

        if (!plugins.length) {
            return interaction.editReply({ content: '📭 No plugins registered.' });
        }

        const embed = new EmbedBuilder()
            .setTitle('🧩 Plugins')
            .setColor(0x5865F2)
            .setFooter({ text: `${plugins.length} plugin(s) total` });

        for (const p of plugins) {
            const status = p.enabled ? '🟢' : '🔴';
            const lines = [
                p.description || '*No description*',
                `\`v${p.version}\``,
                p.enabled ? [
                    p.commands.length   ? `Commands: ${p.commands.filter(c => !c.includes(' ')).join(', ')}` : null,
                    p.events.length     ? `Events: ${p.events.join(', ')}` : null,
                    p.schedules.length  ? `Schedules: ${p.schedules.join(', ')}` : null
                ].filter(Boolean).join('\n') : '*Disabled*'
            ].join('\n');

            embed.addFields({ name: `${status} ${p.name}`, value: lines });
        }

        return interaction.editReply({ embeds: [embed] });
    }
};

// ─── /plugin reload ───────────────────────────────────────────────────────────

const reloadSubcommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('reload')
        .setDescription('Hot-reload a plugin without restarting the bot')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('Plugin folder name')
                .setRequired(true)),

    info: {
        short: 'Hot-reload a plugin',
        full: 'Reload a plugin\'s commands, events, and schedules without restarting.\n\nSyntax: `/plugin reload name: <plugin>`'
    },

    enabled: true,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const name = interaction.options.getString('name');

        const result = await pm.reload(client, name);

        if (!result.success) {
            return interaction.editReply({ content: `❌ Reload failed: \`${result.error}\`` });
        }

        return interaction.editReply({ content: `✅ Plugin **${name}** reloaded successfully.` });
    }
};

// ─── /plugin enable ───────────────────────────────────────────────────────────

const enableSubcommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('enable')
        .setDescription('Enable a disabled plugin')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('Plugin folder name')
                .setRequired(true)),

    info: {
        short: 'Enable a plugin',
        full: 'Enable a plugin and load it immediately.\n\nSyntax: `/plugin enable name: <plugin>`'
    },

    enabled: true,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const name = interaction.options.getString('name');

        const result = await pm.enable(client, name);

        if (!result.success) {
            return interaction.editReply({ content: `❌ Enable failed: \`${result.error}\`` });
        }

        return interaction.editReply({ content: `✅ Plugin **${name}** enabled.` });
    }
};

// ─── /plugin disable ──────────────────────────────────────────────────────────

const disableSubcommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable and unload a plugin')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('Plugin folder name')
                .setRequired(true)),

    info: {
        short: 'Disable a plugin',
        full: 'Unload a plugin and mark it as disabled in plugin.json.\n\nSyntax: `/plugin disable name: <plugin>`'
    },

    enabled: true,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const name = interaction.options.getString('name');

        const result = await pm.disable(client, name);

        if (!result.success) {
            return interaction.editReply({ content: `❌ Disable failed: \`${result.error}\`` });
        }

        return interaction.editReply({ content: `✅ Plugin **${name}** disabled.` });
    }
};

// ─── Main export ──────────────────────────────────────────────────────────────

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plugin')
        .setDescription('Manage bot plugins')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    info: {
        short: 'Manage bot plugins',
        full: 'List, reload, enable, or disable plugins at runtime.\n\nSubcommands:\n`/plugin list` `/plugin reload` `/plugin enable` `/plugin disable`'
    },

    enabled: true,

    subcommands: [listSubcommand, reloadSubcommand, enableSubcommand, disableSubcommand],

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const handler = this.subcommands.find(s => s.data.name === sub);
        if (handler) return handler.execute(interaction);
    }
};