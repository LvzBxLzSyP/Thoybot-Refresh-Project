const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // 定義 Slash 命令的資料
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reload a specific command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Command name to reload')
                .setRequired(true)
        ),

    // 處理命令執行邏輯
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // 檢查使用者是否為管理員 (檢查 ownerId)
        if (interaction.user.id !== config.ownerId) {
            return interaction.editReply({ content: 'You do not have permission to reload commands!' });
        }

        // 取得要重新加載的命令名稱
        const commandName = interaction.options.getString('command');
        const commandPath = path.join(__dirname, '../commands', `${commandName}.js`);

        // 檢查命令是否存在
        if (!fs.existsSync(commandPath)) {
            return interaction.editReply({ content: `Command ${commandName} not found.`, ephemeral: true });
        }

        // 日誌：紀錄誰在重新加載命令
        warnWithTimestamp(`[Command] Command ${commandName} is being reloaded by ${interaction.user.username} using reload command`);

        try {
            // 刪除舊的命令模組緩存
            delete require.cache[require.resolve(commandPath)];

            // 重新加載指定命令
            const command = require(commandPath);

            // 更新 client.commands
            interaction.client.commands.set(command.data.name, command);

            // 如果命令包含 info，將其插入到 client.commandInfo
            if (command.info) {
                interaction.client.commandInfo[command.data.name] = command.info;
            }

            // 日誌：重新加載成功
            logWithTimestamp(`[Command] Command ${commandName} was successfully reloaded`);

            // 返回成功的回應
            return interaction.editReply({ content: `Command ${commandName} has been reloaded successfully!` });
        } catch (error) {
            // 捕捉錯誤並回應
            errorWithTimestamp(error);
            return interaction.editReply({ content: `An error occurred while reloading the command: ${error.message}`, ephemeral: true });
        }
    }
};