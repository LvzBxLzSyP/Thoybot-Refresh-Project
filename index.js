const { Client, Collection, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// 載入指令模組
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// 當機器人就緒時註冊斜線命令
client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
    console.log(`Logged in as ${client.user.tag}!`);
});

// 當收到斜線命令時執行相應的指令
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: '執行指令時發生錯誤！', ephemeral: true });
    }
});

// 登入機器人
client.login(config.token);
