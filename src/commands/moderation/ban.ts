import {
	BaseGuildTextChannel,
	EmbedBuilder,
	GuildMember,
	GuildMemberRoleManager,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
	User,
} from "discord.js";
import serverConfigSchema from "../../models/ServerConfig.js";
import tempBans from "../../models/tempBans.js";
import { CommandOptions, SlashCommandProps } from "commandkit";
import ms from "ms";
import prettyMilliseconds from "pretty-ms";
import { fileURLToPath } from "url";

export const data = new SlashCommandBuilder()
	.setName("ban")
	.setDescription("Bans a user from this server.")
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user you want to ban")
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName("reason")
			.setDescription("The reason for issuing the ban")
			.setMaxLength(512)
	)
	.addStringOption((option) =>
		option
			.setName("duration")
			.setDescription(
				`The duration of the user's ban. Default is permanent. Ex. 30d, 12h, 8w, 10y`
			)
	)
	.addStringOption((option) =>
		option
			.setName("delete-messages")
			.setDescription(
				"The amount of time to delete the members messages from. Max is 7 days."
			)
	)
	.setContexts(InteractionContextType.Guild);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	await interaction.deferReply();
	try {
		const targetUser = interaction.options.getUser("user") as User;
		const targetMember = interaction.options.getMember("user") as GuildMember;
		const reason =
			interaction.options.getString("reason") ?? "No reason was provided";
		const time = interaction.options.getString("duration") ?? "0";
		//@ts-ignore
		const duration = ms(time);
		const messages = interaction.options.getString("delete-messages") ?? "0";
		//@ts-ignore
		const deleteMessages = ms(messages);

		const executor = interaction.member as GuildMember;

		const executorRoles = executor?.roles as GuildMemberRoleManager;
		const targetRoles = targetMember?.roles as GuildMemberRoleManager;

		if (
			!interaction.guild?.members.me?.permissions.has(
				PermissionFlagsBits.ModerateMembers
			)
		) {
			interaction.followUp(
				`❌ I do not have the necessary permissions to execute this command!`
			);
			return;
		}

		if (isNaN(duration)) {
			await interaction.followUp(`❌ Please provide a valid duration!`);
			return;
		}

		if (targetUser.id === executor.id) {
			await interaction.followUp(`❌ You can't ban yourself!`);
			return;
		}
		if (targetMember) {
			if (targetRoles?.highest.position >= executorRoles.highest.position) {
				await interaction.followUp(
					`❌ You can't ban a user with equal or higher roles!`
				);
				return;
			}

			if (!targetMember.bannable) {
				interaction.followUp(`❌ This user cannot be banned!`);
				return;
			}
		}
		const bans = await interaction.guild?.bans.fetch();

		await bans?.forEach(async (ban) => {
			if (ban.user.id === targetUser.id) {
				interaction.followUp(`⚠ That user has already been banned`);
				return;
			}
		});

		const serverConfig = await serverConfigSchema.findOne({
			guildId: interaction.guildId,
		});
		const banLogChannel =
			(interaction.guild?.channels.cache.get(
				serverConfig?.banLogsChannelId as string
			) as BaseGuildTextChannel) ??
			((await interaction.guild?.channels.fetch(
				serverConfig?.banLogsChannelId as string
			)) as BaseGuildTextChannel);

		const banLogMessage = new EmbedBuilder()
			.setColor(0xff0000)
			.setAuthor({
				name: `${executor.user.username} (ID ${executor.id})`,
				iconURL: executor.displayAvatarURL(),
			})
			.setThumbnail(targetUser.displayAvatarURL())
			.addFields(
				{
					name: `\u200b`,
					value: `:hammer: **Banned:**${targetUser} (ID ${targetUser.id})`,
				},
				{
					name: `\u200b`,
					value: `:page_facing_up: **Reason:** ${reason}`,
				}
			)
			.setTimestamp();
		if (time !== "0") {
			await tempBans.create({
				guildId: interaction.guildId,
				userId: targetUser.id,
				banTime: Date.now() + duration,
			});
		}
		await interaction.guild?.bans
			.create(targetUser.id, {
				reason: reason,
				deleteMessageSeconds: deleteMessages,
			})
			.then(async () => {
				if (time === "0") {
					if (banLogChannel !== null) {
						banLogChannel.send({ embeds: [banLogMessage] });
					}

					targetUser
						.send({
							embeds: [
								new EmbedBuilder()
									.setColor(0xff0000)
									.setDescription(
										`🔨 You were **banned** from ${interaction.guild?.name}\n📄 **Reason:** ${reason}`
									)
									.setThumbnail(interaction.guild?.iconURL() as string),
							],
						})
						.catch(() => {});

					await interaction.followUp(
						`:hammer: ${targetUser} has been banned indefinitely`
					);
				}
				if (time !== "0") {
					banLogMessage.addFields({
						name: `\u200b`,
						value: `⏱ **Duration:** ${prettyMilliseconds(duration, {
							verbose: true,
						})}`,
					});

					if (banLogChannel !== null) {
						banLogChannel.send({ embeds: [banLogMessage] });
					}
					targetUser
						.send({
							embeds: [
								new EmbedBuilder()
									.setColor(0xff0000)
									.setDescription(
										`⚠ You were **banned** from ${
											interaction.guild?.name
										}\n📄 **Reason:** ${reason}\n⏱ **Duration:** ${prettyMilliseconds(
											duration,
											{ verbose: true }
										)}`
									)
									.setThumbnail(interaction.guild?.iconURL() as string),
							],
						})
						.catch(() => {});
				}
				await interaction.followUp(
					`:hammer: ${targetUser} has been banned for ${prettyMilliseconds(
						duration,
						{ verbose: true }
					)}`
				);
			});
	} catch (error) {
		interaction.followUp(
			`An error occured running this command. Please try again in a moment.`
		);
		console.log(
			`An error occured in ${fileURLToPath(import.meta.url)}:\n`,
			error
		);
	}
}

export const options: CommandOptions = {
	botPermissions: ["BanMembers"],
};
