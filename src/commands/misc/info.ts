import { SlashCommandProps } from "commandkit";
import {
	ActivityType,
	BaseGuildTextChannel,
	ChannelType,
	EmbedBuilder,
	GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import prettyMilliseconds from "pretty-ms";
import { fileURLToPath } from "url";

export const data = new SlashCommandBuilder()
	.setName("info")
	.setDescription("Provides info about the server")
	.setDMPermission(false)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("user")
			.setDescription("Provides info about a user.")
			.addUserOption((option) =>
				option
					.setName("user")
					.setDescription("The user you want to run the command on.")
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("server")
			.setDescription("Provides info about the server.")
	);

export async function run({ interaction, client, handler }: SlashCommandProps) {
	try {
		const subCommand = interaction.options.getSubcommand();
		await interaction.deferReply();

		if (subCommand === "server") {
			await interaction.guild?.fetch();
			const MemberCount = interaction.guild?.memberCount;
			const serverName = interaction.guild?.name as string;
			const serverOwner = await interaction.guild?.fetchOwner();
			const serverCreationDate = new Date(
				interaction.guild?.createdTimestamp as number
			);
			const categoryChannels = interaction.guild?.channels.cache.filter(
				(channel) => channel.type == ChannelType.GuildCategory
			).size as number;
			const textChannels = interaction.guild?.channels.cache.filter(
				(channel) => channel.type == ChannelType.GuildText
			).size as number;
			const announcementChannels = interaction.guild?.channels.cache.filter(
				(channel) => channel.type == ChannelType.GuildAnnouncement
			).size as number;
			const voiceChannels = interaction.guild?.channels.cache.filter(
				(channel) => channel.type == ChannelType.GuildVoice
			).size as number;
			const stageVoiceChannels = interaction.guild?.channels.cache.filter(
				(channel) => channel.type == ChannelType.GuildStageVoice
			).size as number;
			const forumChannels = interaction.guild?.channels.cache.filter(
				(channel) => channel.type == ChannelType.GuildForum
			).size as number;
			const privateThreadChannels = interaction.guild?.channels.cache.filter(
				(channel) => channel.type == ChannelType.PrivateThread
			).size as number;
			const publicThreadChannels = interaction.guild?.channels.cache.filter(
				(channel) => channel.type == ChannelType.PublicThread
			).size as number;

			const serverIcon = interaction.guild?.iconURL();
			const thumbnail = interaction.guild?.iconURL() || "";

			const textTotal = textChannels + announcementChannels;
			const voiceTotal = voiceChannels + stageVoiceChannels;
			const threadTotal =
				forumChannels + privateThreadChannels + publicThreadChannels;

			const serverInfo = new EmbedBuilder()
				.setAuthor({ name: serverName, iconURL: serverIcon || undefined })
				.setThumbnail(thumbnail)
				.addFields(
					{
						name: "Owner",
						value: `${serverOwner?.user.username}`,
						inline: true,
					},
					{ name: "Members", value: `${MemberCount}`, inline: true },
					{
						name: "Category Channels",
						value: `${categoryChannels}`,
						inline: true,
					},
					{ name: "Text Channels", value: `${textTotal}`, inline: true },
					{ name: "Voice Channels", value: `${voiceTotal}`, inline: true },
					{ name: "Threads", value: `${threadTotal}`, inline: true }
				)
				.setColor(0x00b8c7)
				//@ts-ignore
				.setFooter({
					text: `ID: ${
						interaction.guild?.id
					} | Server Creation: ${serverCreationDate.getUTCFullYear()}/${serverCreationDate.getMonth()}/${serverCreationDate.getDate()}`,
				});

			interaction.followUp({ embeds: [serverInfo] });
		}

		if (subCommand === "user") {
			const member =
				(interaction.options.getMember("user") as GuildMember) ??
				(interaction.member as GuildMember);

			const memberStatus = member?.presence?.activities.find(
				(a) => a.type === ActivityType.Custom
			)?.state;

			const userInfo = new EmbedBuilder()
				.setTitle(`${member?.user.username}`)
				.addFields(
					{ name: "ID", value: member.id as string, inline: true },
					{
						name: "Avatar",
						value: `[Link](${member.displayAvatarURL()})`,
						inline: true,
					},
					{
						name: "Account Created",
						//@ts-ignore
						value: member.user.createdAt.toUTCString(),
						inline: true,
					},
					{
						name: `Account Age`,
						value: prettyMilliseconds(
							(Date.now() - member?.user.createdAt.valueOf()) as number,
							{ formatSubMilliseconds: false, unitCount: 3, verbose: true }
						),
						inline: true,
					},
					{
						name: "Joined Server At",
						value: member.joinedAt?.toUTCString() as string,
						inline: true,
					},
					{
						name: "Join Server Age",

						value: prettyMilliseconds(
							//@ts-ignore
							(Date.now() - member.joinedTimestamp?.valueOf()) as number,
							{
								unitCount: 3,
								verbose: true,
								formatSubMilliseconds: false,
								hideSeconds: true,
							}
						),
						inline: true,
					},
					{
						name: "Status",
						value:
							memberStatus ??
							`Has no active status, is invisible/offline or is not in the bot's cache.`,
						inline: false,
					}
				)
				.setThumbnail(member.displayAvatarURL())
				.setTimestamp();

			interaction.followUp({ embeds: [userInfo] });
		}
	} catch (error) {
		console.log(`Error in ${fileURLToPath(import.meta.url)}: \n`, error);
	}
}
