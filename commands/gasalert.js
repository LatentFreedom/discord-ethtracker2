import { SlashCommandBuilder } from '@discordjs/builders'

let gasAlerts = new Map()

const checkGasAlerts = (client, gasPrices) => {
    gasAlerts.forEach((amounts, author) => {
        amounts.forEach(({amount, alertType, channelId}, index) => {
            try {
                if (alertType === 'below' && amount >= gasPrices?.result.FastGasPrice ||
                    alertType === 'above' && amount <= gasPrices?.result.FastGasPrice) {
                    const res = author.send(`Gas price is now ${gasPrices.result.FastGasPrice} gwei.`).catch(error => {
                        if (error.code === 50007) {
                            // console.error(`Failed to send direct message to ${author.username}#${author.discriminator}`)
                            client.channels.cache.get(channelId)
                                .send(`<@${author.id}>, gas price is **${gasPrices.result.FastGasPrice}** gwei.`)
                                .catch(error => {
                                    if (error.code === 50001) {
                                        console.error(`[checkEthAlerts] [ERROR]: Failed to send message to ${author.username}#${author.discriminator}. Bot missing access to channel.`)
                                    }
                                })
                        }
                    })
                    let newAlertList = [...gasAlerts.get(author).slice(0, index), ...gasAlerts.get(author).slice(index+1)]
                    gasAlerts.set(author, newAlertList)
                }
            } catch (e) {
                console.log(`[checkEthAlerts] [ERROR]: ${e}`)
            }
        })
    })
}

const command = {
    data: new SlashCommandBuilder()
		.setName('gasalert')
		.setDescription('alert user when gas reaches specified amount')
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
				.setName('amount')
				.setDescription('gas amount to be alerted for')
				.setRequired(true)
                .setMaxValue(1000)
                .setMinValue(1)),
	async execute(client, interaction) {
        
        // Process alert command
        const amount = interaction.options.getNumber('amount')
        const alertType = interaction.options.getString('alert')
        const user = interaction.user
        const name = user.username
        interaction.reply({
            content: `Thanks, **${name}**. I will send a private message when gas is **${alertType} ${amount}** Gwei.`,
            ephemeral: true
        })
        // Add alert to alerts mapping
        const alert = {
            amount: amount,
            alertType: alertType,
            channelId: interaction.channelId
        }
        if (!gasAlerts.has(user)) {
            gasAlerts.set(user, [alert])
        } else {
            let newAlertList = gasAlerts.get(user)
            newAlertList.push(alert)
            gasAlerts.set(user,newAlertList)
        }

	},
}

export { command, checkGasAlerts }