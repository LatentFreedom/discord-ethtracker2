const {Constants, Client, Intents, MessageEmbed} = require('discord.js');
const axios = require('axios');
require('dotenv').config();

let gasPrices = [];
let gasAlerts = new Map();
let ethAlerts = new Map();

const client = new Client({
    intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
});

client.on('ready', () => {
    console.log('Eth Tracker 2 Running...');
    createCommands();
    getData();
});

const createCommands = () => {
    const Guilds = client.guilds.cache.map(guild => guild.id);
    // Add commands to all guilds
    Guilds.forEach(guildId => {
        const guild = client.guilds.cache.get(guildId);
        let commands = guild.commands;
        // gas command
        commands?.create({
            name: "gas",
            description: "replies with current gas prices on etherscan"
        })
        // gas alert command
        commands?.create({
            name: "gasalert",
            description: "alert user when gas reaches specified amount",
            options: [
                {
                    name: "amount",
                    description: "gas amount to be alerted for",
                    required: true,
                    type: Constants.ApplicationCommandOptionTypes.NUMBER
                }
            ]
        })
        // eth alert command
        commands?.create({
            name: "ethalert",
            description: "alert user when eth reaches specified price",
            options: [
                {
                    name: "price",
                    description: "eth price to be alerted for",
                    required: true,
                    type: Constants.ApplicationCommandOptionTypes.NUMBER
                }
            ]
        })
    });
}

const styleGasMessage = () => {
    const embed = new MessageEmbed().setTitle('⛽ Current Gas Prices');
    if (gasPrices.result.FastGasPrice > 200) {
        embed.setColor('#ff0000');
        embed.setImage('https://c.tenor.com/-kZOB16tELEAAAAC/this-is-fine-fire.gif');
    } else if (gasPrices.result.FastGasPrice > 100) {
        embed.setColor('#ff0000');
        embed.setImage('https://c.tenor.com/O2Tz9B1UEMsAAAAd/sxv-wtf.gif');
    } else if (gasPrices.result.FastGasPrice > 40) {
        embed.setColor('#ff8000');
        embed.setImage('https://c.tenor.com/WpSTTJe3SpgAAAAC/not-good-enough-randy-marsh.gif');
    } else {
        embed.setColor('#2fff00');
        embed.setImage('https://c.tenor.com/xxFSg4CCwmwAAAAC/leonardo-dicaprio-maket-it-rain.gif');
    }

    embed.addFields({ name: 'Slow 🐢 | >10 minutes', value: `${gasPrices.result.SafeGasPrice} Gwei` },
        { name: 'Proposed 🚶 | 3 minutes', value: `${gasPrices.result.ProposeGasPrice} Gwei` },
        { name: 'Fast ⚡ | 15 seconds', value: `${gasPrices.result.FastGasPrice} Gwei` },
    );
    return [embed];
    
}

const getData = async () => {
    try {
        const resGas = await axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_PRIV}`)
        const resEth = await axios.get(`https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${process.env.ETHERSCAN_PRIV}`)
        gasPrices = resGas.data;
        ethPrice = resEth.data
        client.user.setActivity(`ETH $${Math.round(ethPrice.result.ethusd).toLocaleString()}│⛽️${gasPrices.result.ProposeGasPrice}`, {type: 'WATCHING'});
    } catch (err) {
        console.log(err);
    }
}

const checkGasAlerts = () => {
    gasAlerts.forEach((amounts, author) => {
        amounts.forEach(({amount, channelId}, index) => {
            try {
                if (amount >= gasPrices.result.FastGasPrice) {
                    const res = author.send(`Gas price is now ${gasPrices.result.FastGasPrice} gwei.`).catch(error => {
                        if (error.code === Constants.APIErrors.CANNOT_MESSAGE_USER) {
                            // console.error(`Failed to send direct message to ${author.username}#${author.discriminator}`);
                            client.channels.cache.get(channelId)
                                .send(`<@${author.id}>, gas price is **${gasPrices.result.FastGasPrice}** gwei.`)
                                .catch(error => {
                                    if (error.code === Constants.APIErrors.MISSING_ACCESS) {
                                        console.error(`Failed to send message to ${author.username}#${author.discriminator}. Bot missing access to channel.`);
                                    }
                                });
                        }
                    });
                    let newAlertList = [...gasAlerts.get(author).slice(0, index), ...gasAlerts.get(author).slice(index+1)];
                    gasAlerts.set(author, newAlertList);
                }
            } catch (err) {
                console.log(err);
            }
        })
    })
}

const checkEthAlerts = () => {
    ethAlerts.forEach((prices, author) => {
        prices.forEach(({price, channelId}, index) => {
            try {
                if (price >= ethPrice.result.ethusd) {
                    const res = author.send(`ETH is now $${ethPrice.result.ethusd}.`).catch(error => {
                        if (error.code === Constants.APIErrors.CANNOT_MESSAGE_USER) {
                            // console.error(`Failed to send direct message to ${author.username}#${author.discriminator}`);
                            client.channels.cache.get(channelId)
                                .send(`<@${author.id}>, ETH is now **$${ethPrice.result.ethusd}**.`)
                                .catch(error => {
                                    if (error.code === Constants.APIErrors.MISSING_ACCESS) {
                                        console.error(`Failed to send message to ${author.username}#${author.discriminator}. Bot missing access to channel.`);
                                    }
                                });
                        }
                    });
                    let newAlertList = [...ethAlerts.get(author).slice(0, index), ...ethAlerts.get(author).slice(index+1)];
                    ethAlerts.set(author, newAlertList);
                }
            } catch (err) {
                console.log(err);
            }
        })
    })
}

setInterval(getData, 10 * 2000);
setInterval(checkGasAlerts, 10 * 3000);
setInterval(checkEthAlerts, 10 * 3000);

client.on('interactionCreate', (interaction) => {
    if (!interaction.isCommand()) { return; }
    const { commandName, options } = interaction;
    if (commandName === 'gas') {
        // Process gas command
        interaction.reply({
            // ephemeral: true,
            embeds: styleGasMessage(),
        })
    } else if (commandName === 'gasalert') {
        // Process alert command
        const amount = options.getNumber('amount');
        const user = interaction.user;
        const name = user.username;
        interaction.reply({
            content: `Thanks, **${name}**. I will send a private message when gas is below **${amount}** Gwei.`,
            ephemeral: true
        })
        // Add alert to alerts mapping
        const alert = {
            amount: amount,
            channelId: interaction.channelId
        };
        if (!gasAlerts.has(user)) {
            gasAlerts.set(user, [alert]);
        } else {
            let newAlertList = gasAlerts.get(user);
            newAlertList.push(alert);
            gasAlerts.set(user,newAlertList);
        }
    } else if (commandName === 'ethalert') {
        // Process alert command
        const price = options.getNumber('price');
        const user = interaction.user;
        const name = user.username;
        interaction.reply({
            content: `Thanks, **${name}**. I will send a private message when ETH is below **$${price}**.`,
            ephemeral: true
        })
        // Add alert to alerts mapping
        const alert = {
            price: price,
            channelId: interaction.channelId
        };
        if (!ethAlerts.has(user)) {
            ethAlerts.set(user, [alert]);
        } else {
            let newAlertList = ethAlerts.get(user);
            newAlertList.push(alert);
            ethAlerts.set(user,newAlertList);
        }
    }
})

client.login(process.env.DISCORD_TOKEN);