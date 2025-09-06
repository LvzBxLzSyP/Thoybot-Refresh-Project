// Basic(core) configuration 
const token = 'YOUR_BOT_TOKEN_HERE';    // Your Discord bot token
const clientId = 'YOUR_CLIENT_ID_HERE';    // Your application's Client ID
const errorChannelId = 'YOUR_ERROR_CHANNEL_ID_HERE';    // Channel ID for error reporting
const ownerId = 'YOUR_OWNER_ID_HERE';    // Your Discord user ID (bot owner)

// NetherGames API Search Configuration 
const ngmcEnabled = false;    // Enable NetherGames API (default: false)
const ngmcApiKey = 'YOUR_NETHERGAMES_API_KEY_HERE';    //NetherGames API key

// Time command configs
const timezone = 'Asia/Taipei';    // Timezone setting (e.g., 'Asia/Taipei')
const tzPerPages = 25;    // Number of timezones shown per page

// Log level setting
// Available levels (severity from highest to lowest):
// fatal (0), error (1), warn (2), help (3), data (4), info (5), debug (6), prompt (7),
// verbose (8), input (9), silly (10)
// Choose one based on the verbosity you want. Lower number = higher severity.
const logLevel = 'debug';    // Example: 'debug' (6)

export default {
    token,
    clientId,
    errorChannelId,
    ownerId,
    ngmcEnabled,
    ngmcApiKey,
    timezone,
    tzPerPages,
    logLevel
};