import { SlashCommandBuilder } from '@discordjs/builders'

let ethAlerts = new Map()

const checkEthAlerts = (client, ethPrice) => {
    ethAlerts.forEach((prices, author) => {
        prices.forEach(({price, alertType, channelId}, index) => {
            try {
                if (alertType === 'below' && price >= ethPrice?.result.ethusd ||
                    alertType === 'above' && price <= ethPrice?.result.ethusd) {
                    const res = author.send(`ETH is now $${ethPrice.result.ethusd}.`).catch(error => {
                        if (error.code === 50007) {
                            // console.error(`Failed to send direct message to ${author.username}#${author.discriminator}`)
                            client.channels.cache.get(channelId)
                                .send(`<@${author.id}>, ETH is now **$${ethPrice.result.ethusd}**.`)
                                .catch(error => {
                                    if (error.code === 50001) {
                                        console.error(`[checkEthAlerts] [ERROR]: Failed to send message to ${author.username}#${author.discriminator}. Bot missing access to channel.`)
                                    }
                                })
                        }
                    })
                    let newAlertList = [...ethAlerts.get(author).slice(0, index), ...ethAlerts.get(author).slice(index+1)]
                    ethAlerts.set(author, newAlertList)
                }
            } catch (e) {
                console.log(`[checkEthAlerts] [ERROR]: ${e}`)
            }
        })
    })
}

const command = {
    data: new SlashCommandBuilder()
		.setName('ethalert')
		.setDescription('alert user when eth reaches specified price')
        .addStringOption(option =>
            option
                .setName('alert')
                .setDescription('Type of alert')
                .setRequired(true)
                .addChoices(
                    { name: 'Above', value: 'above' },
                    { name: 'Below', value: 'below' },
                ))
        .addNumberOption(option =>
			option
				.setName('price')
				.setDescription('eth price to be alerted for')
				.setRequired(true)
                .setMaxValue(100000)
                .setMinValue(1)),
	async execute(client, interaction) {
        
        // Process alert command
        const price = interaction.options.getNumber('price')
        const alertType = interaction.options.getString('alert')
        const user = interaction.user
        const name = user.username
        interaction.reply({
            content: `Thanks, **${name}**. I will send a private message when ETH is **${alertType} ${price}**.`,
            ephemeral: true
        })
        // Add alert to alerts mapping
        const alert = {
            price: price,
            alertType: alertType,
            channelId: interaction.channelId
        }
        if (!ethAlerts.has(user)) {
            ethAlerts.set(user, [alert])
        } else {
            let newAlertList = ethAlerts.get(user)
            newAlertList.push(alert)
            ethAlerts.set(user,newAlertList)
        }

	},
}

export { command, checkEthAlerts }