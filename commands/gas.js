import { EmbedBuilder } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import axios from 'axios'

const styleGasMessage = (gasPrices) => {
    const embed = new EmbedBuilder().setTitle('⛽ Current Gas Prices')
    if (gasPrices.result.FastGasPrice > 200) {
        embed.setColor('#ff0000')
        embed.setImage('https://c.tenor.com/-kZOB16tELEAAAAC/this-is-fine-fire.gif')
    } else if (gasPrices.result.FastGasPrice > 100) {
        embed.setColor('#ff0000')
        embed.setImage('https://c.tenor.com/O2Tz9B1UEMsAAAAd/sxv-wtf.gif')
    } else if (gasPrices.result.FastGasPrice > 40) {
        embed.setColor('#ff8000')
        embed.setImage('https://c.tenor.com/WpSTTJe3SpgAAAAC/not-good-enough-randy-marsh.gif')
    } else {
        embed.setColor('#2fff00')
        embed.setImage('https://c.tenor.com/xxFSg4CCwmwAAAAC/leonardo-dicaprio-maket-it-rain.gif')
    }

    embed.addFields({ name: 'Slow 🐢 | >10 minutes', value: `${gasPrices.result.SafeGasPrice} Gwei` },
        { name: 'Proposed 🚶 | 3 minutes', value: `${gasPrices.result.ProposeGasPrice} Gwei` },
        { name: 'Fast ⚡ | 15 seconds', value: `${gasPrices.result.FastGasPrice} Gwei` },
    )
    return embed
    
}

const styleBadDataMessage = () => {
    const embed = new EmbedBuilder().setTitle(`Error`)
        .setDescription(`error getting data`)
    return embed
}

const command = {
    data: new SlashCommandBuilder()
		.setName('gas')
		.setDescription('replies with current gas prices on etherscan'),
	async execute(client, interaction) {

        // Defer reply to get data
        await interaction.deferReply()

        let gasPrices
        let message

        try {
            const resGas = await axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_PRIV}`)
            gasPrices = resGas.data
		    message = styleGasMessage(gasPrices)
        } catch (err) {
            console.log(err)
            message = styleBadDataMessage()
        }
        
        // Send message
        await interaction.editReply({embeds: [message] })

	},
}

export { command }