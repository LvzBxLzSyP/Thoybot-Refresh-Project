module.exports = {
    name: 'exit',
    execute(rl, client) {
        logWithTimestamp('Closing bot');
        client.destroy();
        rl.close();
    }
};