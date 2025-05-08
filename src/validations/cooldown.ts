import { ValidationProps } from "commandkit";
import { cooldowns, isOnCooldown } from "../Util/cooldown.js";
import { MessageFlags } from "discord.js";

export default async function ({
	interaction,
	commandObj,
	handler,
}: ValidationProps) {
	if (!interaction.isChatInputCommand()) return false;
	const cooldown = commandObj.options?.cooldown ?? 5000;
	const cooldownScope = (commandObj.options?.cooldownScope ?? "guild") as
		| "guild"
		| "global";
	const result = isOnCooldown(
		interaction.user.id,
		commandObj.data.name,
		cooldown,
		cooldownScope,
		interaction.guildId ?? undefined
	);

	if (result.onCooldown) {
		await interaction.reply({
			content: `⏳ You're on cooldown! Try again in ${Math.ceil(
				result.retryAfter / 1000
			)}s`,
			flags: MessageFlags.Ephemeral,
		});

		return true;
	}
	return false;
}
