const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ping = require('ping'); // 確保已安裝 `ping` 模組

/**
 * The pingserver command that pings a given host and returns latency statistics.
 * 
 * @type {import('discord.js').SlashCommand}
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('pingserver')
        .setDescription('Test the latency of a specified host.')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addStringOption(option => 
            option.setName('host')
                .setDescription('Enter the host name or IP address to ping.')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('count')
                .setDescription('Specify the number of pings (default is 5).')
                .setRequired(false)),
                
    info: {
        short: 'Test latency to a remote server.',
        full: `Send ICMP packets to a remote host to measure latency (default is 5 pings)
        Command usage:
        \`/pingserver <host:IP address> [count: number of pings]\`
        Example:
        \`/pingserver host:192.168.2.100\`
        \`/pingserver host:www.google.com count:5\``
    },
    enabled: true,

    /**
     * Executes the /pingserver command.
     * 
     * @param {import('discord.js').CommandInteraction} interaction The interaction object
     */
    async execute(interaction) {
        const host = interaction.options.getString('host');  // The host/IP to ping
        const count = interaction.options.getInteger('count') || 5; // Number of pings (default is 5)

        // Create the initial embed message
        const embed = new EmbedBuilder()
            .setTitle(`Pinging ${host}...`)
            .setDescription('Please wait...')
            .setColor('Random');

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        let pingResults = []; // Array to store ping results
        let successfulPings = 0; // Counter for successful pings
        let failedPings = 0; // Counter for failed pings

        // Loop through the number of pings to send
        for (let i = 1; i <= count; i++) {
            try {
                const res = await ping.promise.probe(host);  // Perform the ping
                let currentPing = res.alive ? res.time : 'Failed'; // Check if ping was successful

                // Track ping results
                if (res.alive) {
                    successfulPings++;
                    pingResults.push(res.time);
                } else {
                    failedPings++;
                    pingResults.push(null); // Record failed pings as null
                }

                // Calculate the max, min, and average ping
                const validPings = pingResults.filter(time => time !== null);
                const maxPing = validPings.length ? Math.max(...validPings) : 'N/A';
                const minPing = validPings.length ? Math.min(...validPings) : 'N/A';
                const avgPing = validPings.length ? (validPings.reduce((a, b) => a + b, 0) / validPings.length).toFixed(2) : 'N/A';

                // Update embed with current ping statistics
                embed.setDescription(`Ping attempt ${i}/${count}\nSuccessful: ${successfulPings}, Failed: ${failedPings}`)
                    .setFields(
                        { name: 'Current Latency', value: `${currentPing} ms`, inline: true },
                        { name: 'Max Latency', value: `${maxPing} ms`, inline: true },
                        { name: 'Min Latency', value: `${minPing} ms`, inline: true },
                        { name: 'Avg Latency', value: `${avgPing} ms`, inline: true }
                    )
                    .setColor(res.alive ? 'Random' : 'Red');

                // Edit the reply with the updated embed
                await interaction.editReply({ embeds: [embed] });

                // Add 1 second delay between each ping
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                failedPings++;
                pingResults.push(null); // Record failed pings as null
                embed.setDescription(`Ping attempt ${i}/${count}\nSuccessful: ${successfulPings}, Failed: ${failedPings}`)
                    .setColor('Red')
                    .setFooter({ text: 'An error occurred, please check the host address or network connection.' });

                // Edit the reply with the updated embed
                await interaction.editReply({ embeds: [embed] });
                console.error(`Ping error on attempt ${i}:`, error);
            }
        }

        // Final statistics calculation
        const validPings = pingResults.filter(time => time !== null);
        const maxPing = validPings.length ? Math.max(...validPings) : 'N/A';
        const minPing = validPings.length ? Math.min(...validPings) : 'N/A';
        const avgPing = validPings.length ? (validPings.reduce((a, b) => a + b, 0) / validPings.length).toFixed(2) : 'N/A';

        // Update final embed message with overall statistics
        embed.setTitle(`Ping to ${host} Complete`)
            .setColor(successfulPings === count ? 'Green' : 'Red')
            .setDescription(`Total Pings: ${count}\nSuccessful: ${successfulPings}, Failed: ${failedPings}`)
            .setFields(
                { name: 'Max Latency', value: `${maxPing} ms`, inline: true },
                { name: 'Min Latency', value: `${minPing} ms`, inline: true },
                { name: 'Avg Latency', value: `${avgPing} ms`, inline: true }
            );

        // Final update of the reply with the final embed
        await interaction.editReply({ embeds: [embed] });
    },
};