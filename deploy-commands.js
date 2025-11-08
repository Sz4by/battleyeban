const { REST } = require('@discordjs/rest');

const { Routes } = require('discord-api-types/v10');

const { SlashCommandBuilder } = require('discord.js');

require('dotenv').config();

const token = process.env.TOKEN;

const clientId = process.env.CLIENT_ID;

const guildId = process.env.GUILD_ID;

const commands = [

	new SlashCommandBuilder()

		.setName('bancheck')

		.setDescription('Megnézi, hogy egy felhasználó tiltva van-e (dudx.info).')

		.addStringOption(option =>

			option.setName('username')

				.setDescription('A felhasználónév (pl. nol1401 vagy Oszaby0)')

				.setRequired(true)),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {

	try {

		console.log('Parancsok frissítése...');

		await rest.put(

			Routes.applicationGuildCommands(clientId, guildId),

			{ body: commands },

		);

		console.log('A parancsok sikeresen regisztrálva a szerverre!');

	} catch (error) {

		console.error(error);

	}

})();