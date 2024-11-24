const { SlashCommandBuilder } = require('discord.js');
const playerCommand = require('./subcommands/nethergames/player');
const guildCommand = require('./subcommands/nethergames/guild');
const factionCommand = require('./subcommands/nethergames/faction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nethergames')
        .setDescription('Search Nethergames Things')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    subcommands: [
        playerCommand,
        guildCommand,
        factionCommand
    ],
    info: {
        short: '從NGMC API查詢玩家、公會及派系',
        full: `利用NetherGames API查詢玩家、公會、派系的簡略資訊
        命令使用語法:
        \`/nethetgames player <ign:遊戲內名稱> [hide:False|True(Guild模式預設false，User模式預設true)]\`
        \`/nethergames guild <guild:公會名稱> [hide:False|True] [showlink:False|True(Guild模式預設true，User模式預設false)]\`
        \`/nethergames faction <faction:派系名稱> [hide:False|True]\`
        
        使用例:
        \`/nethergames player ign:Herobrine90199\`
        \`/nethergames guild guild:MEOWOWO hide:False showlink:False\`
        \`/nethergames faction faction:Fly hide:True\``
    },
    enabled: true,
    async execute(interaction) {
        const subcmd = interaction.options.getSubcommand();
        
        // 根據子命令執行對應的處理函數
        if (subcmd === 'player') {
            await playerCommand.execute(interaction);
        } else if (subcmd === 'guild') {
            await guildCommand.execute(interaction);
        } else if (subcmd === 'faction') {
            await factionCommand.execute(interaction);
        } else {
            await interaction.editReply({ content: 'Subcommand Not Found!' });
        }
    }
};