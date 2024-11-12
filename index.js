const { Client, Collection, GatewayIntentBits, REST, Routes, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

global.client = client;

client.commands = new Collection();
client.commandInfo = {}; // 用來存儲每個命令的info

const loadCommands = () => {
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

            // 如果存在 command.info，將其加入 client.commandInfo 中
            if (command.info) {
                client.commandInfo[command.data.name] = command.info;
            }
            
        } catch (error) {
            console.error(`Error loading command file ${file}:`, error);
        }
    }

    return commands;
};

// 載入事件模組
const loadEvents = () => {
    const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
};

// 註冊斜線命令
const registerSlashCommands = async (commands) => {
    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }
};

const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 初始化機器人
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // 註冊斜線命令
    const commands = loadCommands();
    await registerSlashCommands(commands);
});

// index.js 內的 interactionCreate 事件中
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply({ content: '執行指令時發生錯誤！', ephemeral: true });
        }
    } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId !== 'help_menu') return;
    
        const selectedCommand = interaction.values[0];
    
        if (selectedCommand === 'close') {
            await interaction.update({ content: 'Select menu closed', components: [] });
            await interaction.followUp({ content: 'Select menu closed', ephemeral: true});
            return;
        }
    
        const command = client.commands.get(selectedCommand);
        if (command) {
            const commandInfo = client.commandInfo[selectedCommand];
            const commandEmbed = new EmbedBuilder()
                .setTitle(`Command: ${selectedCommand}`)
                .setDescription(commandInfo?.full || command.data.description || 'No detailed information available')
                .setColor(getRandomColor());
    
            await interaction.deferUpdate();
            await interaction.followUp({ embeds: [commandEmbed], ephemeral: true });
        }
    }
});

// 登入機器人
client.login(config.token);

// 呼叫載入事件
loadEvents();