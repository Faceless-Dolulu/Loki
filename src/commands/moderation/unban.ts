import { SlashCommandProps, CommandOptions } from "commandkit";
import {
	BaseGuildTextChannel,
	EmbedBuilder,
	GuildMember,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
	User,
} from "discord.js";
import ServerConfig from "../../models/ServerConfig.js";
import { fileURLToPath } from "url";
import tempBans from "../../models/tempBans.js";

export const data = new SlashCommandBuilder()
	.setName("unban")
	.setDescription("Unbans a user from this server")
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user you want to unban")
			.setRequired(true)
	)
	.addStringOption((option) =>
		option.setName("reason").setDescription("The reason for unbanning the user")
	)
	.setContexts(InteractionContextType.Guild);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	try {
		const targetUser = interaction.options.getUser("user") as User;
		const reason =
			interaction.options.getString("reason") ?? "No reason was provided";
		const executor = interaction.member as GuildMember;
		await interaction.deferReply();

		const unBanMessage = new EmbedBuilder()
			.setColor(0x24e926)
			.setAuthor({
				name: `${executor.user.username} (ID ${executor.id})`,
				iconURL: executor.displayAvatarURL(),
			})
			.setThumbnail(targetUser?.displayAvatarURL() as string)
			.setFields(
				{
					name: "\u200b",
					value: `:tools: **Unbanned:** ${targetUser?.username} (ID ${targetUser?.id})`,
				},
				{
					name: `\u200b`,
					value: `:page_facing_up: **Reason:** ${reason}`,
				}
			)
			.setTimestamp();

		await interaction.guild?.bans.fetch().then(async (bans) => {
			if (bans.size == 0) {
				await interaction.followUp(
					`❌ Nobody has been banned from this server yet!`
				);
				return;
			}

			const bannedId = bans.find((ban) => ban.user.id == targetUser?.id);

			if (!bannedId) {
				await interaction.followUp(
					`❌ This user hasn't been banned from this server!`
				);
				return;
			}
		});

		const serverConfig = await ServerConfig.findOne({
			guildId: interaction.guildId,
		});

		const banLogChannel =
			(interaction.guild?.channels.cache.get(
				serverConfig?.banLogsChannelId as string
			) as BaseGuildTextChannel) ??
			((await interaction.guild?.channels.fetch(
				serverConfig?.banLogsChannelId as string
			)) as BaseGuildTextChannel);
		await interaction.guild?.bans.remove(targetUser, reason).catch((error) => {
			interaction.followUp("❌ An error occurred, please try again later");
			console.log(
				`An error occured in ${fileURLToPath(import.meta.url)}:\n`,
				error
			);
			return;
		});

		banLogChannel.send({ embeds: [unBanMessage] });

		await interaction.followUp(`✅ ${targetUser} has been unbanned!`);

		tempBans
			.findOneAndDelete({ guildId: interaction.guildId, userId: targetUser.id })
			.catch(() => {});
	} catch (error) {
		interaction.followUp(`❌ An error occurred. Please try again in a moment.`);
		console.log(
			`An error occurred in ${fileURLToPath(import.meta.url)}:\n`,
			error
		);
	}
}

export const options: CommandOptions = {
	botPermssions: ["BanMembers"],
};
