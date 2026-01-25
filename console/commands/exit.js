module.exports = {
    name: 'exit',
    description: 'Exit the bot gracefully',
    execute(rl, client, args) {
        shutdown('exit');
    }
};