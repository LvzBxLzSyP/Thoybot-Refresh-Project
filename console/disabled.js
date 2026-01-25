module.exports = {
    start() {
        1
    },
    crash() {
        1
    },
    stop() {
        1
    },
    reload() {
        return { success: false, count: 0 };
    },
    getCommands() {
        return {};
    }
};