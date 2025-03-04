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
    const POLL_INTERVAL = 20000 // 20 seconds
    client.dataInterval = setInterval(getData, POLL_INTERVAL)
})

const getData = async () => {
    let gasPrices
    let ethPrice
    try {
        const [resGas, resEth] = await Promise.all([
            axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_PRIV}`, { timeout: 5000 }),
            axios.get(`https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${process.env.ETHERSCAN_PRIV}`, { timeout: 5000 })
        ]);
        
        gasPrices = resGas.data;
        ethPrice = resEth.data;
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
    if (gasPrices?.result && ethPrice?.result) {
        checkGasAlerts(client, gasPrices)
        checkEthAlerts(client, ethPrice)
    }
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

client.on('disconnect', () => {
    console.log('Bot disconnecting, cleaning up resources...')
    if (client.dataInterval) {
        clearInterval(client.dataInterval)
    }
})

client.login(process.env.DISCORD_TOKEN)