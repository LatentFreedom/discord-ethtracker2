import { Client, Collection, GatewayIntentBits, ActivityType } from 'discord.js'
import axios from 'axios'
import { config } from 'dotenv'

import { createCommands } from './utils/helpers.js'
import { checkGasAlerts } from './commands/gasalert.js'
import { checkEthAlerts } from './commands/ethalert.js'

config({ path: './.env' })

let slashCommands = new Collection()

const client = new Client({
    intents : [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent
    ]
})

client.on('ready', () => {
    console.log('Eth Tracker 2 Running...')
    createCommands(client, slashCommands)
    setInterval(getData, 10 * 2000)
})

const getData = async () => {
    let gasPrices
    let ethPrice
    try {
        const resGas = await axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_PRIV}`, { timeout: 5000 })
        const resEth = await axios.get(`https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${process.env.ETHERSCAN_PRIV}`, { timeout: 5000 })
        gasPrices = resGas.data
        ethPrice = resEth.data
        client.user.setActivity(`ETH $${Math.round(ethPrice.result.ethusd).toLocaleString()}│⛽️${gasPrices.result.ProposeGasPrice}`, {type: ActivityType.Watching})
    } catch (error) {
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            console.error('Request timed out: ECONNABORTED')
        } else if (error.code === 'ETIMEDOUT' && error.message.includes('timeout')) {
            console.error('Request timed out: ETIMEDOUT')
        } else {
            console.error(error)
        }
    }
    checkGasAlerts(client, gasPrices)
    checkEthAlerts(client, ethPrice)
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return

    const command = slashCommands.get(interaction.commandName)
    
	if (!command) return

	try {
		await command.execute(client, interaction)
	} catch (e) {
		console.error(`[ethtracker2:interactionCreate] [ERROR] ${e}`)
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
	}
})

client.login(process.env.DISCORD_TOKEN)