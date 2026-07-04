/**
 * pluginPermissions.js
 *
 * Defines the permission catalogue and the dynamic object wrapper.
 *
 * Each permission entry has:
 *   - description : shown during install / confirm flow
 *   - risk        : 'low' | 'medium' | 'high'
 *   - allow       : (client, prop, wrapFn) => value | undefined
 *                   Intercepts client.<prop> access. Return undefined to block.
 *   - objects     : { TypeName: { propName: true | false | (value, wrapFn) => wrappedValue } }
 *                   Defines what a plugin can access on Discord.js objects of that type.
 *                   true  = pass through as-is
 *                   false = block explicitly (useful to override a broader permission)
 *                   fn    = transform / wrap the value before returning
 *
 * wrapObject(obj, activePerms) is the universal proxy factory.
 * It detects the Discord.js type of obj, merges all active permissions'
 * object rules for that type, and returns a Proxy that enforces them.
 * Return values that are themselves Discord.js objects are recursively wrapped.
 */

// ─── Type detection ───────────────────────────────────────────────────────────

/**
 * Map a Discord.js object to a canonical type name used in permission `objects`.
 * Uses constructor name so we don't need to import every class.
 * @param {any} obj
 * @returns {string|null}
 */
const detectType = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    const name = obj.constructor?.name;

    // Normalise subclasses to their base type
    const TYPE_MAP = {
        TextChannel:          'GuildChannel',
        VoiceChannel:         'GuildChannel',
        CategoryChannel:      'GuildChannel',
        NewsChannel:          'GuildChannel',
        StageChannel:         'GuildChannel',
        ForumChannel:         'GuildChannel',
        ThreadChannel:        'GuildChannel',
        DMChannel:            'DMChannel',
        PartialDMChannel:     'DMChannel',
        Guild:                'Guild',
        OAuth2Guild:          'Guild',
        GuildMember:          'GuildMember',
        User:                 'User',
        PartialUser:          'User',
        Role:                 'Role',
        Message:              'Message',
        PartialMessage:       'Message',
        GuildChannelManager:  'ChannelManager',
        ChannelManager:       'ChannelManager',
        GuildManager:         'GuildManager',
        GuildMemberManager:   'GuildMemberManager',
        RoleManager:          'RoleManager',
        UserManager:          'UserManager',
        Collection:           'Collection',
    };

    return TYPE_MAP[name] ?? name ?? null;
};

// ─── Object wrapper ───────────────────────────────────────────────────────────

/**
 * Wrap a Discord.js object in a Proxy that enforces the merged rules
 * from all active permissions for that object's type.
 *
 * @param {any}      obj          - The Discord.js object to wrap
 * @param {Array}    activePerms  - Active permission entries (from PERMISSION_CATALOGUE)
 * @param {string}   pluginName   - For logging blocked accesses
 * @returns {Proxy|any}
 */
const wrapObject = (obj, activePerms, pluginName) => {
    // Primitives, null, already-primitive returns — pass through
    if (!obj || typeof obj !== 'object') return obj;

    const type = detectType(obj);
    if (!type) return obj;

    // Merge rules for this type from all active permissions
    // Later permissions can override earlier ones (false wins over true)
    const mergedRules = {};
    for (const perm of activePerms) {
        const rules = perm.objects?.[type];
        if (!rules) continue;
        for (const [prop, rule] of Object.entries(rules)) {
            // false is an explicit block — never overridden
            if (mergedRules[prop] === false) continue;
            mergedRules[prop] = rule;
        }
    }

    // No rules for this type — block everything
    return new Proxy(obj, {
        get(target, prop) {
            // Always allow Symbols (JS internals, discord.js needs these)
            if (typeof prop === 'symbol') return target[prop];

            // then / catch / finally — needed for Promise chains on objects
            if (prop === 'then' || prop === 'catch' || prop === 'finally') return target[prop];

            const rule = mergedRules[prop];

            if (rule === undefined || rule === false) {
                debugWithTimestamp?.(`[Plugin:${pluginName}] Blocked access to ${type}.${prop}`);
                return undefined;
            }

            const rawValue = target[prop];

            // true = pass through, but wrap the return value if it's a Discord object
            if (rule === true) {
                if (typeof rawValue === 'function') {
                    // Wrap the function so its return value is also wrapped
                    return async (...args) => {
                        const result = await rawValue.apply(target, args);
                        return wrapObject(result, activePerms, pluginName);
                    };
                }
                return wrapObject(rawValue, activePerms, pluginName);
            }

            // Function rule = custom transform
            if (typeof rule === 'function') {
                if (typeof rawValue === 'function') {
                    return (...args) => {
                        const bound = rawValue.bind(target);
                        return rule(bound, wrapObject, activePerms, pluginName)(...args);
                    };
                }
                return rule(rawValue, wrapObject, activePerms, pluginName);
            }

            return undefined;
        },

        set() {
            debugWithTimestamp?.(`[Plugin:${pluginName}] Blocked write on ${type}`);
            return false;
        }
    });
};

// ─── Permission Catalogue ─────────────────────────────────────────────────────

const PERMISSION_CATALOGUE = {

    // ── Low risk ──────────────────────────────────────────────────────────────

    'channels.read': {
        description: 'Read channel information',
        risk: 'low',

        allow: (client, prop, wrap) => {
            if (prop === 'channels') return wrap(client.channels);
        },

        objects: {
            ChannelManager: {
                fetch: true,
                cache: true,
            },
            GuildChannel: {
                id:         true,
                name:       true,
                type:       true,
                guildId:    true,
                guild:      true,
                parentId:   true,
                parent:     true,
                position:   true,
                createdAt:  true,
                isTextBased: true,
            },
            DMChannel: {
                id:        true,
                type:      true,
                createdAt: true,
            },
            Collection: {
                get:      true,
                has:      true,
                find:     true,
                filter:   true,
                map:      true,
                size:     true,
                values:   true,
                keys:     true,
                entries:  true,
                forEach:  true,
                first:    true,
                toJSON:   true,
            }
        }
    },

    'channels.send': {
        description: 'Send messages to channels',
        risk: 'low',

        allow: () => undefined, // no direct client prop

        objects: {
            GuildChannel: {
                send:        true,
                sendTyping:  true,
            },
            DMChannel: {
                send:        true,
                sendTyping:  true,
            }
        }
    },

    'guilds.read': {
        description: 'Read server information (name, icon, member count…)',
        risk: 'low',

        allow: (client, prop, wrap) => {
            if (prop === 'guilds') return wrap(client.guilds);
        },

        objects: {
            GuildManager: {
                fetch: true,
                cache: true,
            },
            Guild: {
                id:               true,
                name:             true,
                icon:             true,
                iconURL:          true,
                memberCount:      true,
                ownerId:          true,
                description:      true,
                createdAt:        true,
                available:        true,
                large:            true,
                premiumTier:      true,
                premiumSubscriptionCount: true,
            },
            Collection: {
                get:     true,
                has:     true,
                find:    true,
                filter:  true,
                map:     true,
                size:    true,
                values:  true,
                keys:    true,
                entries: true,
                forEach: true,
                first:   true,
                toJSON:  true,
            }
        }
    },

    'users.read': {
        description: 'Fetch user information',
        risk: 'low',

        allow: (client, prop, wrap) => {
            if (prop === 'users') return wrap(client.users);
        },

        objects: {
            UserManager: {
                fetch: true,
                cache: true,
            },
            User: {
                id:            true,
                username:      true,
                discriminator: true,
                globalName:    true,
                avatar:        true,
                avatarURL:     true,
                bot:           true,
                system:        true,
                createdAt:     true,
                tag:           true,
            },
            Collection: {
                get:     true,
                has:     true,
                find:    true,
                filter:  true,
                map:     true,
                size:    true,
                values:  true,
                keys:    true,
                entries: true,
                forEach: true,
                first:   true,
                toJSON:  true,
            }
        }
    },

    'users.dm': {
        description: 'Send direct messages to users',
        risk: 'low',

        allow: (client, prop, wrap) => {
            if (prop === 'users') return wrap(client.users);
        },

        objects: {
            UserManager: {
                fetch: true,
                cache: true,
            },
            User: {
                id:       true,
                username: true,
                bot:      true,
                // createDM returns a DMChannel — wrapped via channels.send rules
                createDM: true,
            },
            DMChannel: {
                id:   true,
                type: true,
            }
        }
    },

    // ── Medium risk ───────────────────────────────────────────────────────────

    'channels.manage': {
        description: 'Create, edit, or delete channels',
        risk: 'medium',

        allow: (client, prop, wrap) => {
            if (prop === 'channels') return wrap(client.channels);
        },

        objects: {
            ChannelManager: {
                fetch:  true,
                cache:  true,
                create: true,
                delete: true,
            },
            GuildChannel: {
                edit:       true,
                delete:     true,
                setName:    true,
                setTopic:   true,
                setParent:  true,
                setPosition: true,
                clone:      true,
                // Inherit read props via channels.read
            }
        }
    },

    'members.read': {
        description: 'Fetch guild member lists',
        risk: 'medium',

        allow: () => undefined,

        objects: {
            Guild: {
                members: true,  // unlocks guild.members
            },
            GuildMemberManager: {
                fetch:  true,
                cache:  true,
                search: true,
            },
            GuildMember: {
                id:         true,
                user:       true,
                nickname:   true,
                joinedAt:   true,
                roles:      true,
                pending:    true,
                premiumSince: true,
                displayName: true,
                displayAvatarURL: true,
            }
        }
    },

    'members.manage': {
        description: 'Kick, ban, or timeout members',
        risk: 'medium',

        allow: () => undefined,

        objects: {
            GuildMember: {
                kick:        true,
                ban:         true,
                timeout:     true,
                setNickname: true,
            }
        }
    },

    'roles.read': {
        description: 'Read role information',
        risk: 'medium',

        allow: () => undefined,

        objects: {
            Guild: {
                roles: true,
            },
            RoleManager: {
                fetch: true,
                cache: true,
            },
            Role: {
                id:          true,
                name:        true,
                color:       true,
                hexColor:    true,
                position:    true,
                permissions: true,
                mentionable: true,
                hoist:       true,
                createdAt:   true,
                managed:     true,
            }
        }
    },

    'roles.manage': {
        description: 'Create, edit, or delete roles',
        risk: 'medium',

        allow: () => undefined,

        objects: {
            RoleManager: {
                create: true,
                delete: true,
            },
            Role: {
                edit:       true,
                delete:     true,
                setName:    true,
                setColor:   true,
                setPosition: true,
                setPermissions: true,
            }
        }
    },

    'messages.manage': {
        description: "Delete or edit other users' messages",
        risk: 'medium',

        allow: () => undefined,

        objects: {
            GuildChannel: {
                messages: true,
            },
            Message: {
                id:        true,
                content:   true,
                author:    true,
                createdAt: true,
                delete:    true,
                edit:      true,
                pin:       true,
                unpin:     true,
            }
        }
    },

    'presence': {
        description: "Change the bot's status or activity",
        risk: 'medium',

        allow: (client, prop, wrap) => {
            if (prop === 'user') return wrap(client.user);
        },

        objects: {
            // ClientUser type
            ClientUser: {
                id:            true,
                username:      true,
                discriminator: true,
                avatar:        true,
                tag:           true,
                setPresence:   true,
                setActivity:   true,
                setStatus:     true,
            }
        }
    },

    // ── High risk ─────────────────────────────────────────────────────────────

    'guilds.manage': {
        description: '⚠️ Edit or delete servers the bot is in',
        risk: 'high',

        allow: (client, prop, wrap) => {
            if (prop === 'guilds') return wrap(client.guilds);
        },

        objects: {
            Guild: {
                edit:   true,
                delete: true,
                leave:  true,
                setName: true,
                setIcon: true,
            }
        }
    },

    'webhooks': {
        description: '⚠️ Create and manage webhooks',
        risk: 'high',

        allow: () => undefined,

        objects: {
            GuildChannel: {
                createWebhook:  true,
                fetchWebhooks:  true,
            }
        }
    },

    'commands.manage': {
        description: '⚠️ Dynamically add or remove slash commands at runtime',
        risk: 'high',

        allow: (client, prop) => {
            // Full access — intentionally no wrap, plugin manages commands directly
            if (prop === 'commands') return client.commands;
        },

        objects: {}
    }
};

module.exports = { PERMISSION_CATALOGUE, wrapObject, detectType };
