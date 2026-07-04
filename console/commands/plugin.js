const pm = require('../../utils/pluginManager');

/**
 * Readline console command: plugin
 * Usage:
 *   plugin list
 *   plugin reload <name>
 *   plugin enable <name>
 *   plugin disable <name>
 */
module.exports = {
    name: 'plugin',
    description: 'Manage plugins from the console',

    /**
     * @param {import('readline').Interface} rl
     * @param {import('discord.js').Client} client
     * @param {string[]} args
     */
    async execute(rl, client, args) {
        const sub = args[0];

        switch (sub) {

            // ── list ──────────────────────────────────────────────────────
            case 'list':
            case undefined: {
                const plugins = pm.list();

                if (!plugins.length) {
                    console.log('[Plugin] No plugins registered.');
                    break;
                }

                console.log('[Plugin] ══════════════════════════════════════');
                for (const p of plugins) {
                    const status = p.enabled ? '●' : '○';
                    console.log(`[Plugin] ${status} ${p.name} v${p.version} — ${p.description || 'No description'}`);
                    if (p.enabled) {
                        if (p.commands.length)  console.log(`         Commands:  ${p.commands.filter(c => !c.includes(' ')).join(', ')}`);
                        if (p.events.length)    console.log(`         Events:    ${p.events.join(', ')}`);
                        if (p.schedules.length) console.log(`         Schedules: ${p.schedules.join(', ')}`);
                    }
                }
                console.log('[Plugin] ══════════════════════════════════════');
                break;
            }

            // ── reload ────────────────────────────────────────────────────
            case 'reload': {
                const name = args[1];
                if (!name) { console.log('[Plugin] Usage: plugin reload <name>'); break; }

                console.log(`[Plugin] Reloading '${name}'...`);
                const result = await pm.reload(client, name);

                if (result.success) {
                    console.log(`[Plugin] ✓ '${name}' reloaded successfully`);
                } else {
                    console.log(`[Plugin] ✗ Reload failed: ${result.error}`);
                }
                break;
            }

            // ── enable ────────────────────────────────────────────────────
            case 'enable': {
                const name = args[1];
                if (!name) { console.log('[Plugin] Usage: plugin enable <name>'); break; }

                console.log(`[Plugin] Enabling '${name}'...`);
                const result = await pm.enable(client, name);

                if (result.success) {
                    console.log(`[Plugin] ✓ '${name}' enabled`);
                } else {
                    console.log(`[Plugin] ✗ Enable failed: ${result.error}`);
                }
                break;
            }

            // ── disable ───────────────────────────────────────────────────
            case 'disable': {
                const name = args[1];
                if (!name) { console.log('[Plugin] Usage: plugin disable <name>'); break; }

                console.log(`[Plugin] Disabling '${name}'...`);
                const result = await pm.disable(client, name);

                if (result.success) {
                    console.log(`[Plugin] ✓ '${name}' disabled`);
                } else {
                    console.log(`[Plugin] ✗ Disable failed: ${result.error}`);
                }
                break;
            }

            default:
                console.log('[Plugin] Unknown subcommand. Available: list, reload, enable, disable');
        }
    }
};
