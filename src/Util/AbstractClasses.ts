import ModerationConfig from "../models/ModerationConfig.js";
import { arraysEqual, normalize } from "./ValidationHelpers.js";
import { ActionSettings } from "./Interfaces.js";
import {
	ChatInputCommandInteraction,
	GuildMember,
	MessageFlags,
} from "discord.js";

export abstract class ModerationSettingBase implements ActionSettings {
	public enabled: boolean;
	public reasonRequired: boolean;
	public evidenceRequired: boolean;
	public whitelistedRoles: string[] | null;
	public logChannel?: string | null;
	public defaultDuration?: number | null | undefined;
	public muteRoleId?: string | null | undefined;
	public fallbackLogChannel?: string | null | undefined;
	constructor(
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		whitelistedRoles: string[],
		logChannel: string | null
	) {
		this.enabled = enabled;
		this.reasonRequired = reasonRequired;
		this.evidenceRequired = evidenceRequired;
		this.logChannel = logChannel;
		this.whitelistedRoles = whitelistedRoles;
	}

	set WhitelistedRoles(values: string[] | null) {
		this.whitelistedRoles = values;
	}

	get WhitelistedRoles(): string[] | null {
		return this.whitelistedRoles ?? null;
	}
	set Enabled(value: boolean) {
		this.enabled = value;
	}
	get Enabled(): boolean {
		return this.enabled;
	}

	set ReasonRequired(value: boolean) {
		this.reasonRequired = value;
	}

	get ReasonRequired(): boolean {
		return this.reasonRequired;
	}

	set EvidenceRequired(value: boolean) {
		this.evidenceRequired = value;
	}

	get EvidenceRequired(): boolean {
		return this.evidenceRequired;
	}

	set LogChannel(value: string | null) {
		this.logChannel = value;
	}

	get LogChannel(): string | null | undefined {
		return this.logChannel;
	}

	abstract getCollectionKey(): string;

	async saveToDatabase(guildId: string) {
		await ModerationConfig.updateOne(
			{ guildId },
			{ $set: { [this.getCollectionKey()]: this } },
			{ upsert: true }
		);
	}
	public async checkRequirements(
		interaction: ChatInputCommandInteraction,
		evidence: unknown
	): Promise<boolean> {
		const label = this.getCollectionKey();
		const executorRoles = (interaction.member as GuildMember).roles;
		const target = interaction.options.getMember(`target`) as GuildMember;
		const reason = interaction.options.getString(`reason`);
		const hasWhitelistedRoles = executorRoles.cache.some((role) =>
			this.whitelistedRoles?.includes(role.id)
		);
		if (!this.enabled) {
			await interaction.followUp({
				content: `⚠️ The \`${label}\` command has been disabled by an administrator.`,
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}
		if (this.reasonRequired && !reason) {
			await interaction.followUp({
				content: `⚠️ A reason is required to \`${label}\` the user.`,
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}
		if (this.evidenceRequired && !evidence) {
			await interaction.followUp({
				content: `⚠️ Evidence is required to \`${label}\` the user.`,
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}

		if (
			!hasWhitelistedRoles &&
			interaction.user.id !== interaction.guild?.ownerId
		) {
			await interaction.followUp({
				content: `⚠️ You do not have the necessary roles to run this command.`,
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}

		if (!target) {
			await interaction.followUp({
				content: `❌ User not member of this server.`,
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}

		if (target.user.bot) {
			await interaction.followUp({
				content: `❌ You cannot warn a bot.`,
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}

		if (target.id === interaction.user.id) {
			await interaction.followUp({
				content: `❌ You cannot warn yourself.`,
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}
		if (
			target.roles.highest.position >= executorRoles.highest.position &&
			interaction.guild?.ownerId !== interaction.user.id
		) {
			await interaction.followUp({
				content: `❌ You cannot warn this user due to role hierarchy.`,
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}
		return true;
	}
	hasChangedFrom(other: ActionSettings) {
		if (
			this.enabled !== other.enabled ||
			this.evidenceRequired !== other.evidenceRequired ||
			this.reasonRequired !== other.reasonRequired ||
			normalize(this.logChannel) !== normalize(other.logChannel)
		) {
			return true;
		}

		if (
			!arraysEqual(
				this.whitelistedRoles as string[],
				other.whitelistedRoles as string[]
			)
		) {
			return true;
		}

		return false;
	}
}
