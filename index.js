const { Client, Collection, GatewayIntentBits, REST, Routes, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// 載入指令模組
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);

        if (!command || !command.data || !command.data.name) {
            console.warn(`Warning: Command file ${file} is missing 'data' or 'name'. Skipping this file.`);
            continue;
        }

        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());

    } catch (error) {
        console.error(`Error loading command file ${file}:`, error);
    }
}

// 載入事件模組
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
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

// 當收到斜線命令或選單選項時執行相應的處理
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        // 處理斜線命令
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '執行指令時發生錯誤！', ephemeral: true });
        }
    } else if (interaction.isStringSelectMenu()) {
        // 處理選單互動
        if (interaction.customId !== 'help_menu') return;
    
        const selectedCommand = interaction.values[0];
    
        if (selectedCommand === 'close') {
            await interaction.update({ content: 'Help menu closed.', components: [] });
            return;
        }
    
        const command = client.commands.get(selectedCommand);
        if (command) {
            const commandEmbed = new EmbedBuilder()
                .setTitle(`Command: ${selectedCommand}`)
                .setDescription(command.data.description || 'No description available')
                .setColor('#00AAFF'); // 您可以更改這裡的顏色
    
            // 延遲更新交互，以避免錯誤
            await interaction.deferUpdate();
            
            // 發送一個臨時的followUp消息
            await interaction.followUp({ embeds: [commandEmbed], ephemeral: true });
        }
    }
});

// 登入機器人
client.login(config.token);