import { SlashCommandProps } from "commandkit";
import { MessageFlags, SlashCommandBuilder, userMention } from "discord.js";
import { objects } from "./throwable-objects.js";
import ThrowItemList from "../../../models/ThrowItemList.js";
import { throwResponses } from "./throwResponses.js";

export const data = new SlashCommandBuilder()
	.setName("throw")
	.setDescription(`Throwing things is fun`)
	.addUserOption((option) =>
		option
			.setName("target")
			.setDescription("The user you want to throw things at.")
			.setRequired(false)
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	const targetUser = interaction.options.getUser("target");

	const target = targetUser
		? userMention(targetUser.id)
		: "a random person nearby";

	const config = await ThrowItemList.findOne({
		guildId: interaction.guildId,
	});
	if (config?.blacklistedChannels.includes(interaction.channelId)) {
		return interaction.reply({
			content: `❌ This command is disabled in this channel`,
			flags: MessageFlags.Ephemeral,
		});
	}
	let pool: string[] = [];
	if (!config) {
		pool = [...objects];
	} else if (config.customItemsOnly === false) {
		pool = [...objects, ...config.customItems];
	} else if (config.customItemsOnly === true) {
		pool = [...config.customItems];
	}

	if (pool.length === 0) {
		return interaction.reply({
			content:
				"⚠️ No throwable items are configured. If you are seeing this, make a bug report",
			flags: MessageFlags.Ephemeral,
		});
	}

	function randomItem() {
		return pool[Math.floor(Math.random() * pool.length)];
	}

	const rng = Math.floor(Math.random() * 100);
	let responsePool: string[] = [];
	let response: string;
	if (rng <= 5) {
		responsePool = throwResponses.miss;
		response = responsePool[Math.floor(Math.random() * responsePool.length)]
			.replace(`{user}`, userMention(interaction.user.id))
			.replace(`{item}`, randomItem())
			.replace(`{target}`, target as string);
	} else if (rng <= 15) {
		responsePool = throwResponses.threeItem;
		response = responsePool[Math.floor(Math.random() * responsePool.length)]
			.replace(`{user}`, userMention(interaction.user.id))
			.replace(`{item1}`, randomItem())
			.replace(`{item2}`, randomItem())
			.replace(`{item3}`, randomItem())
			.replace(`{target}`, target as string);
	} else if (rng <= 50) {
		responsePool = throwResponses.twoItem;
		response = responsePool[Math.floor(Math.random() * responsePool.length)]
			.replace(`{user}`, userMention(interaction.user.id))
			.replace(`{item1}`, randomItem())
			.replace(`{item2}`, randomItem())
			.replace(`{target}`, target as string);
	} else {
		responsePool = throwResponses.oneItem;
		response = responsePool[Math.floor(Math.random() * responsePool.length)]
			.replace(`{user}`, userMention(interaction.user.id))
			.replace(`{item}`, randomItem())
			.replace(`{target}`, target as string);
	}

	return await interaction.reply(response);
}
