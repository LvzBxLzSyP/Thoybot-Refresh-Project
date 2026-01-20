function loadConsoleAdapter(env) {
    if (env.shouldEnablePrompt) {
        return require('./readline');
    }
    return require('./disabled');
}

module.exports = { loadConsoleAdapter };