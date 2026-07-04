const fs   = require('fs');
const path = require('path');

const getPluginsDir = () => path.join(__projname, 'plugins');

// ─── Permission System ────────────────────────────────────────────────────────

const {
    PERMISSION_CATALOGUE,
    wrapObject
} = require('./pluginPermissions');

// Properties always exposed regardless of permissions (safe read-only metadata)
const ALWAYS_ALLOWED = new Set(['application', 'readyAt', 'readyTimestamp', 'uptime', 'ws']);

// ─── Client Proxy Factory ─────────────────────────────────────────────────────

/**
 * Wrap the real client in a Proxy that enforces the plugin's declared permissions.
 * Blocked accesses return undefined silently and are logged at debug level.
 *
 * @param {import('discord.js').Client} client
 * @param {string[]} permissions
 * @param {string}   pluginName
 * @returns {Proxy}
 */
const createClientProxy = (client, permissions, pluginName) => {
    const activePerms = permissions
        .filter(p => PERMISSION_CATALOGUE[p])
        .map(p => PERMISSION_CATALOGUE[p]);

    if (permissions.length !== activePerms.length) {
        const unknown = permissions.filter(p => !PERMISSION_CATALOGUE[p]);
        warnWithTimestamp(`[PluginManager:${pluginName}] Unknown permission(s) in plugin.json: ${unknown.join(', ')}`);
    }

    // Convenience: wrap any Discord.js object using the active permission set
    const wrap = (obj) => wrapObject(obj, activePerms, pluginName);

    return new Proxy(client, {
        get(target, prop) {
            if (typeof prop === 'symbol') return target[prop];
            if (ALWAYS_ALLOWED.has(prop)) return target[prop];

            for (const perm of activePerms) {
                const value = perm.allow(target, prop, wrap);
                if (value !== undefined) return value;
            }

            debugWithTimestamp(`[PluginManager:${pluginName}] Blocked access to client.${prop}`);
            return undefined;
        },

        set(target, prop) {
            debugWithTimestamp(`[PluginManager:${pluginName}] Blocked write to client.${String(prop)}`);
            return false;
        },

        has(target, prop) {
            return prop in target;
        }
    });
};

/**
 * Return a human-readable summary of a plugin's requested permissions.
 * @param {string[]} permissions
 * @returns {{ low: string[], medium: string[], high: string[] }}
 */
const describePermissions = (permissions) => {
    const result = { low: [], medium: [], high: [] };
    for (const key of permissions) {
        const entry = PERMISSION_CATALOGUE[key];
        if (entry) result[entry.risk].push(`${key} — ${entry.description}`);
    }
    return result;
};

// ─── Plugin Registry ──────────────────────────────────────────────────────────

/**
 * @type {Map<string, PluginInstance>}
 *
 * @typedef {Object} PluginInstance
 * @property {string}    name
 * @property {string}    version
 * @property {string}    description
 * @property {boolean}   enabled
 * @property {string[]}  permissions
 * @property {string}    dirPath
 * @property {string}    dataPath
 * @property {string[]}  commands
 * @property {{ name: string, once: boolean, handler: Function }[]} events
 * @property {{ name: string, timer: { ref: () => NodeJS.Timeout } }[]} schedules
 */
const registry = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clearDirCache = (dirPath) => {
    Object.keys(require.cache).forEach(key => {
        if (key.startsWith(dirPath)) delete require.cache[key];
    });
};

const syncSlashCommands = async (client) => {
    const { REST, Routes } = require('discord.js');
    const rest = new REST({ version: '10' }).setToken(client.token);
    const body = [...client.commands.entries()]
        .filter(([name, cmd]) => !name.includes(' ') && cmd.data?.toJSON)
        .map(([, cmd]) => cmd.data.toJSON());

    const names = body.map(c => c.name);
    debugWithTimestamp(`[PluginManager] Syncing commands: ${names.join(', ')}`);

    // Check for duplicates before sending
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length) {
        warnWithTimestamp(`[PluginManager] Duplicate command names detected: ${dupes.join(', ')}`);
    }

    await rest.put(Routes.applicationCommands(client.user.id), { body });
    logWithTimestamp(`[PluginManager] Synced ${body.length} slash commands to Discord`);
};

/**
 * Install or update a plugin's npm dependencies declared in plugin.json.
 *
 * Strategy:
 *  - No dependencies field → skip entirely
 *  - node_modules absent   → full install
 *  - node_modules present  → compare declared deps against installed versions
 *    in node_modules/.package-lock.json; only re-run npm install if something
 *    is missing or the declared version range changed
 *
 * Always uses --omit=dev so devDependencies are never installed at runtime.
 *
 * @param {string} dirPath   - Absolute path to the plugin folder
 * @param {string} pluginName
 * @returns {{ installed: boolean, error?: string }}
 */
const installDeps = async (dirPath, pluginName) => {
    const { spawn } = require('child_process');

    const jsonPath = path.join(dirPath, 'plugin.json');
    const meta     = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const deps     = meta.dependencies ?? {};

    if (!Object.keys(deps).length) return { installed: false };

    const modulesPath   = path.join(dirPath, 'node_modules');
    const lockPath      = path.join(modulesPath, '.package-lock.json');
    const modulesExists = fs.existsSync(modulesPath);

    // Check whether installed versions satisfy declared ranges
    const needsInstall = (() => {
        if (!modulesExists) return true;

        // Read the lock file written by npm into node_modules/
        if (!fs.existsSync(lockPath)) return true;

        let lock;
        try { lock = JSON.parse(fs.readFileSync(lockPath, 'utf8')); }
        catch { return true; }

        const installed = lock.packages ?? {};

        for (const [pkg, range] of Object.entries(deps)) {
            const entry = installed[`node_modules/${pkg}`];
            if (!entry) return true; // Package missing entirely

            // Use semver if available, otherwise fall back to a simple string check
            try {
                const semver = require('semver');
                if (!semver.satisfies(entry.version, range)) return true;
            } catch {
                // semver not available in root — do a loose check
                if (entry.version !== range.replace(/^[\^~]/, '')) return true;
            }
        }

        return false;
    })();

    if (!needsInstall) {
        debugWithTimestamp(`[PluginManager:${pluginName}] Dependencies up to date, skipping npm install`);
        return { installed: false };
    }

    logWithTimestamp(`[PluginManager:${pluginName}] Installing dependencies: ${Object.keys(deps).join(', ')}`);

    // Generate a minimal package.json if one doesn't exist
    // npm requires it even when using --prefix
    const pkgJsonPath = path.join(dirPath, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
        const pkgJson = {
            name:    meta.name ?? pluginName,
            version: meta.version ?? '1.0.0',
            private: true,
            dependencies: deps
        };
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 4));
        debugWithTimestamp(`[PluginManager:${pluginName}] Generated package.json`);
    }

    try {
        await new Promise((resolve, reject) => {
            const proc = spawn(
                'npm',
                ['install', '--omit=dev', `--prefix=${dirPath}`],
                {
                    cwd:   dirPath,
                    env:   { ...process.env, CXXFLAGS: '-std=c++20' },
                    shell: process.env.SHELL || true
                }
            );

            // Buffer each stream and emit line by line into winston
            const pipeToWinston = (stream, logFn) => {
                let buf = '';
                stream.on('data', (chunk) => {
                    buf += chunk.toString();
                    const lines = buf.split('\n');
                    buf = lines.pop(); // keep incomplete last line in buffer
                    for (const line of lines) {
                        if (line.trim()) logFn(`[npm:${pluginName}] ${line}`);
                    }
                });
                stream.on('end', () => {
                    if (buf.trim()) logFn(`[npm:${pluginName}] ${buf}`);
                });
            };

            pipeToWinston(proc.stdout, debugWithTimestamp);
            pipeToWinston(proc.stderr, (line) => {
                // npm writes progress/warnings to stderr too, not just real errors
                if (/\[npm:.*?\] npm (error|warn)/i.test(line)) {
                    warnWithTimestamp(line);
                } else {
                    debugWithTimestamp(line);
                }
            });

            proc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`npm exited with code ${code}`));
            });

            proc.on('error', reject);
        });

    } catch (err) {
        const msg = err.message;
        errorWithTimestamp(`[PluginManager:${pluginName}] npm install failed: ${msg}`);
        return { installed: false, error: msg };
    }

    // Verify every declared dependency can actually be required
    // (catches native addon build failures that npm exits 0 for)
    const failed = [];
    for (const pkg of Object.keys(deps)) {
        try {
            require(path.join(dirPath, 'node_modules', pkg));
        } catch {
            failed.push(pkg);
        }
    }

    if (failed.length) {
        const msg = `Installed but failed to load: ${failed.join(', ')} — native build may have failed`;
        errorWithTimestamp(`[PluginManager:${pluginName}] ${msg}`);
        return { installed: false, error: msg };
    }

    logWithTimestamp(`[PluginManager:${pluginName}] Dependencies installed successfully`);
    return { installed: true };
};

// ─── Load ─────────────────────────────────────────────────────────────────────

/**
 * Load a single plugin by folder name.
 * @param {import('discord.js').Client} client  Real client (stored internally; proxy passed to plugin)
 * @param {string}  pluginName
 * @param {boolean} [sync=true]
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
const load = async (client, pluginName, sync = true) => {
    const dirPath   = path.join(getPluginsDir(), pluginName);
    const jsonPath  = path.join(dirPath, 'plugin.json');
    const entryPath = path.join(dirPath, 'index.js');

    if (!fs.existsSync(dirPath))   return { success: false, error: `Plugin folder not found: ${pluginName}` };
    if (!fs.existsSync(jsonPath))  return { success: false, error: `Missing plugin.json in: ${pluginName}` };
    if (!fs.existsSync(entryPath)) return { success: false, error: `Missing index.js in: ${pluginName}` };

    let meta;
    try {
        meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (err) {
        return { success: false, error: `Invalid plugin.json: ${err.message}` };
    }

    // Install / verify npm dependencies before doing anything else
    const depResult = await installDeps(dirPath, pluginName);
    if (depResult.error) {
        return { success: false, error: `Dependency install failed: ${depResult.error}` };
    }

    // Disabled stub — still registers so list() can show it
    if (!meta.enabled) {
        warnWithTimestamp(`[PluginManager] Plugin '${pluginName}' is disabled, skipping`);
        registry.set(pluginName, {
            name: meta.name ?? pluginName, version: meta.version ?? '?',
            description: meta.description ?? '', enabled: false,
            permissions: meta.permissions ?? [],
            dirPath, dataPath: path.join(dirPath, 'data'),
            commands: [], events: [], schedules: []
        });
        return { success: true };
    }

    if (registry.get(pluginName)?.enabled) {
        return { success: false, error: `Plugin '${pluginName}' is already loaded` };
    }

    // Build the sandboxed client proxy for this plugin
    const permissions   = meta.permissions ?? [];
    const proxiedClient = createClientProxy(client, permissions, pluginName);

    // Log permission summary at load time
    const perms = describePermissions(permissions);
    if (perms.high.length) {
        warnWithTimestamp(`[PluginManager:${pluginName}] High-risk permissions granted: ${perms.high.join(', ')}`);
    }
    debugWithTimestamp(`[PluginManager:${pluginName}] Permissions: ${permissions.join(', ') || 'none'}`);

    let entry;
    try {
        entry = require(entryPath);
    } catch (err) {
        return { success: false, error: `Error requiring index.js: ${err.stack}` };
    }

    const dataPath = path.join(dirPath, 'data');
    fs.mkdirSync(dataPath, { recursive: true });

    const instance = {
        name: meta.name ?? pluginName, version: meta.version ?? '?',
        description: meta.description ?? '', enabled: true,
        permissions,
        dirPath, dataPath,
        commands: [], events: [], schedules: []
    };

    // ── onLoad hook — run FIRST so plugin can populate entry.commands etc. ──
    if (typeof entry.onLoad === 'function') {
        try { await entry.onLoad(proxiedClient, { dataPath }); }
        catch (err) { warnWithTimestamp(`[PluginManager:${pluginName}] onLoad error: ${err.message}`); }
    }

    // ── Commands ───────────────────────────────────────────────────────────
    for (const cmd of (entry.commands ?? [])) {
        if (!cmd.data || !cmd.execute) {
            warnWithTimestamp(`[PluginManager:${pluginName}] Skipped command — missing data or execute`);
            continue;
        }
        if (cmd.enabled === false) continue;

        cmd._pluginDataPath   = dataPath;
        cmd._pluginClient     = proxiedClient;
        client.commands.set(cmd.data.name, cmd);
        instance.commands.push(cmd.data.name);
        if (cmd.info) client.commandInfo[cmd.data.name] = cmd.info;

        for (const sub of (cmd.subcommands ?? [])) {
            if (!sub?.data?.name || !sub.execute || sub.enabled === false) continue;
            sub._pluginDataPath = dataPath;
            sub._pluginClient   = proxiedClient;
            const fullName = `${cmd.data.name} ${sub.data.name}`;
            try { cmd.data.addSubcommand(sub.data); } catch {}
            client.commands.set(fullName, sub);
            instance.commands.push(fullName);
            if (sub.info) client.commandInfo[fullName] = sub.info;
        }

        debugWithTimestamp(`[PluginManager:${pluginName}] Command: ${cmd.data.name}`);
    }

    // ── Events — pass proxied client ───────────────────────────────────────
    for (const ev of (entry.events ?? [])) {
        if (!ev.name || !ev.execute) {
            warnWithTimestamp(`[PluginManager:${pluginName}] Skipped event — missing name or execute`);
            continue;
        }
        const handler = (...args) => ev.execute(...args, proxiedClient);
        ev.once ? client.once(ev.name, handler) : client.on(ev.name, handler);
        instance.events.push({ name: ev.name, once: !!ev.once, handler });
        debugWithTimestamp(`[PluginManager:${pluginName}] Event: ${ev.name}`);
    }

    // ── Schedules — pass proxied client ────────────────────────────────────
    for (const sched of (entry.schedules ?? [])) {
        if (!sched.name || !sched.execute || !sched.interval) {
            warnWithTimestamp(`[PluginManager:${pluginName}] Skipped schedule — missing name, execute, or interval`);
            continue;
        }
        const ref   = { timer: null };
        const start = () => { ref.timer = setInterval(() => sched.execute(proxiedClient), sched.interval); };
        sched.delay > 0 ? setTimeout(start, sched.delay) : start();

        instance.schedules.push({ name: sched.name, timer: { ref: () => ref.timer } });
        debugWithTimestamp(`[PluginManager:${pluginName}] Schedule: ${sched.name} every ${sched.interval}ms`);
    }

    registry.set(pluginName, instance);
    logWithTimestamp(`[PluginManager] Loaded: ${instance.name} v${instance.version} (${permissions.length} permission(s))`);

    if (sync) {
        try { await syncSlashCommands(client); }
        catch (err) { warnWithTimestamp(`[PluginManager] Sync failed: ${err.message}`); }
    }

    return { success: true };
};

// ─── Unload ───────────────────────────────────────────────────────────────────

const unload = async (client, pluginName, sync = true) => {
    const instance = registry.get(pluginName);
    if (!instance)         return { success: false, error: `Plugin '${pluginName}' is not in registry` };
    if (!instance.enabled) return { success: false, error: `Plugin '${pluginName}' is already disabled` };

    for (const name of instance.commands) {
        client.commands.delete(name);
        delete client.commandInfo[name];
    }
    for (const ev of instance.events)       client.removeListener(ev.name, ev.handler);
    for (const sched of instance.schedules) { const t = sched.timer.ref(); if (t) clearInterval(t); }

    clearDirCache(instance.dirPath);
    registry.delete(pluginName);
    logWithTimestamp(`[PluginManager] Unloaded: ${pluginName}`);

    if (sync) {
        try { await syncSlashCommands(client); }
        catch (err) { warnWithTimestamp(`[PluginManager] Sync failed: ${err.message}`); }
    }

    return { success: true };
};

// ─── Reload ───────────────────────────────────────────────────────────────────

const reload = async (client, pluginName) => {
    logWithTimestamp(`[PluginManager] Reloading: ${pluginName}`);
    const u = await unload(client, pluginName, false);
    if (!u.success) return u;
    return await load(client, pluginName, true);
};

// ─── Enable / Disable ─────────────────────────────────────────────────────────

const enable = async (client, pluginName) => {
    const jsonPath = path.join(getPluginsDir(), pluginName, 'plugin.json');
    if (!fs.existsSync(jsonPath)) return { success: false, error: `Plugin '${pluginName}' not found` };

    const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    meta.enabled = true;
    fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4));

    if (registry.has(pluginName)) registry.delete(pluginName);
    return await load(client, pluginName, true);
};

const disable = async (client, pluginName) => {
    const jsonPath = path.join(getPluginsDir(), pluginName, 'plugin.json');
    if (!fs.existsSync(jsonPath)) return { success: false, error: `Plugin '${pluginName}' not found` };

    if (registry.get(pluginName)?.enabled) {
        const u = await unload(client, pluginName, true);
        if (!u.success) return u;
    }

    const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    meta.enabled = false;
    fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4));

    return { success: true };
};

// ─── Load All ─────────────────────────────────────────────────────────────────

const loadAll = async (client) => {
    if (!fs.existsSync(getPluginsDir())) {
        warnWithTimestamp('[PluginManager] plugins/ directory not found, skipping');
        return;
    }

    const folders = fs.readdirSync(getPluginsDir(), { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    logWithTimestamp(`[PluginManager] Found ${folders.length} plugin(s)`);

    for (const folder of folders) {
        const result = await load(client, folder, false);
        if (!result.success) warnWithTimestamp(`[PluginManager] '${folder}' failed: ${result.error}`);
    }

    try { await syncSlashCommands(client); }
    catch (err) { warnWithTimestamp(`[PluginManager] Final sync failed: ${err.message}`); }

    logWithTimestamp(`[PluginManager] Done — ${registry.size} plugin(s) in registry`);
};

// ─── List ─────────────────────────────────────────────────────────────────────

const list = () =>
    [...registry.entries()].map(([key, p]) => ({
        key,
        name:        p.name,
        version:     p.version,
        description: p.description,
        enabled:     p.enabled,
        permissions: p.permissions,
        commands:    p.commands,
        events:      p.events.map(e => e.name),
        schedules:   p.schedules.map(s => s.name)
    }));

module.exports = {
    loadAll, load, unload, reload, enable, disable, list,
    installDeps,                // exported for install / update flows
    describePermissions,        // exported for install flow UI
    PERMISSION_CATALOGUE        // exported for documentation/tooling
};