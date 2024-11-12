const { token } = require('../config.json');

module.exports = {
    name: 'disconnect',
    once: false,
    execute(client) {
        const MAX_RETRIES = 5; // 設置最大重試次數
        let retryCount = 0;

        client.on('disconnect', () => {
            console.log('機器人斷線，10秒後嘗試重新連接...');
            
            const reconnect = () => {
                if (retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        client.login(token)
                            .then(() => {
                                console.log('重新連接成功');
                                retryCount = 0; // 重置計數器
                            })
                            .catch((err) => {
                                retryCount++;
                                console.error(`重新連接失敗 (第 ${retryCount} 次)：`, err);
                                if (retryCount >= MAX_RETRIES) {
                                    console.error('已達到最大重試次數，程序即將退出...');
                                    process.exit(1);
                                } else {
                                    reconnect(); // 再次嘗試
                                }
                            });
                    }, 10000); // 10秒延遲
                }
            };

            reconnect(); // 初次重連嘗試
        });
    },
};