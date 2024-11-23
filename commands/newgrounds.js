const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const { get } = require('axios');
const cheerio = require('cheerio');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('newgrounds')
        .setDescription('Get any info from Newgrounds')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addSubcommand(subcommand =>
            subcommand
                .setName('audio')
                .setDescription('Get music from Newgrounds')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Music ID')
                        .setRequired(true)
                )
        ),
    info: {
        short: 'Get anything from Newgrounds',
        full: `Get Games, Movies, Sound, Arts From Newgrounds!
        Command syntax:
        \`/newgrounds audio <id:audio id>\`
        example:
        \`/newgrounds audio id:467339\``
    },
    enabled: true,
    async execute(interaction) {
        const subcmd = interaction.options.getSubcommand();
        interaction.deferReply();
        
        if (subcmd === 'audio') {
            
            const audioId = interaction.options.getInteger('id')
            const { data } = await get(`https://www.newgrounds.com/audio/listen/${audioId}`);
            const audioInfo = cheerio.load(data);
            
            const audioTitle = audioInfo("meta[property='og:title']").attr("content") || "Unknown Title";
            const audioAuthor = audioInfo("a.user").text().trim();
            const audioDesc = audioInfo("meta[property='og:description']").attr("content") || "Unknown Description";
            const audioEmbed = new EmbedBuilder()
                .setTitle(`Info of audio ${audioTitle} (${audioId})`)
                .setDescription(audioDesc)
                .setFooter({ text: 'newgrounds.com'})
            
            interaction.editReply({ embeds: [audioEmbed] });
        }
    }
};