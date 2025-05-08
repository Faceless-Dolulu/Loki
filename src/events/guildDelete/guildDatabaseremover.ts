import { Client, Guild } from "discord.js";
import ServerConfigs from "../../models/ServerConfigs.js";

export default async (guild: Guild, client: Client) => {
	await ServerConfigs.deleteOne({ guildId: guild.id });
};
