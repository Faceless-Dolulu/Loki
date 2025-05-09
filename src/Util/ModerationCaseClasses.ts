import prettyMilliseconds from "pretty-ms";
import ModerationCase from "../models/ModerationCase.js";
import {
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	time,
	TimestampStyles,
	userMention,
} from "discord.js";

abstract class BaseModerationCase {
	caseId: number;
	guildId: string;
	targetId: string;
	staffId: string;
	reason: string;
	automodMetadata?: string | null; // Automod metadata
	evidenceUrls?: string[];
	timeStamp: Date;
	duration?: number; // Milliseconds
	muteRoleId?: string;
	active?: boolean; // Useful for temporary punishments
	closeReason?: string;
	closingStaffId?: string;
	edited?: boolean;

	constructor(
		caseId: number,
		guildId: string,
		targetId: string,
		staffId: string,
		reason: string
	) {
		this.caseId = caseId;
		this.guildId = guildId;
		this.targetId = targetId;
		this.staffId = staffId;
		this.reason = reason;
		this.timeStamp = new Date();
	}

	static formatDuration(ms: number): string {
		return prettyMilliseconds(ms, {
			verbose: false,
			hideSeconds: true,
			unitCount: 4,
		});
	}
	abstract getActionKey(): string;

	setActivity(state: boolean) {
		this.active = state;
		return this;
	}

	setDuration(ms: number) {
		this.duration = ms;
		return this;
	}

	setEvidenceUrls(values: string[]) {
		this.evidenceUrls = values;
		return this;
	}

	addEvidenceUrls(values: string[] | string) {
		if (!this.evidenceUrls) {
			this.evidenceUrls = [];
		}

		if (Array.isArray(values)) {
			this.evidenceUrls.push(...values);
		} else {
			this.evidenceUrls.push(values);
		}

		return this;
	}

	removeEvidenceUrls(values: string[]) {
		this.evidenceUrls?.filter((item) => !values.includes(item));
		return this;
	}

	toObject(): Record<string, unknown> {
		let duration: number | null;
		if (this.duration) {
			if (this.duration > 0) {
				duration = this.duration;
			} else {
				duration = null;
			}
		} else {
			duration = null;
		}
		return {
			guildId: this.guildId,
			caseId: this.caseId,
			targetId: this.targetId,
			moderatorId: this.staffId,
			action: this.getActionKey(),
			reason: this.reason,
			createdAt: this.timeStamp,
			evidenceUrls: this.evidenceUrls ?? [],
			duration: duration,
			active: this.active ?? null,
			autoModMetadata: this.automodMetadata ?? null,
			mutedRoleId: this.muteRoleId,
			edited: this.edited ?? null,
			closingStaffId: this.closingStaffId ?? null,
			closeReason: this.closeReason ?? null,
			expiresAt:
				new Date(this.timeStamp.getTime() + (this.duration ?? 0)) ?? null,
		};
	}
	async createCase(): Promise<void> {
		await ModerationCase.create(this.toObject());
	}

	createViewCaseContainer(updated: boolean): ContainerBuilder {
		const container = new ContainerBuilder();

		const CASE_COLOURS: Record<string, number> = {
			warn: 0xffc107, // amber
			kick: 0xff7043, // coral
			ban: 0xf44336, // crimson
			timeout: 0x42a5f5, // sky‑blue
			mute: 0x7e57c2, // muted purple
			unban: 0x66bb6a, // emerald
		};

		container.setAccentColor(CASE_COLOURS[this.getActionKey()] ?? 0x999999);
		let titleSection = new TextDisplayBuilder();
		if (updated) {
			titleSection.setContent(
				`# Updated Case ID: ${this.caseId}\n${time(
					this.timeStamp,
					TimestampStyles.ShortDateTime
				)}`
			);
		} else {
			titleSection.setContent(
				`# Case ID: ${this.caseId}\n${time(
					this.timeStamp,
					TimestampStyles.ShortDateTime
				)}`
			);
		}
		container.addTextDisplayComponents(titleSection);

		const divider = new SeparatorBuilder()
			.setDivider(true)
			.setSpacing(SeparatorSpacingSize.Large);

		container.addSeparatorComponents(divider);

		const userDetails: string[] = [];

		userDetails.push(
			`### User Information`,
			`**User:** ${userMention(this.targetId)} (ID: ${this.targetId})`
		);

		const actionDetails: string[] = [];

		actionDetails.push(
			`### Action Details`,
			`**Type:** ${this.getActionKey()}`
		);

		if (this.duration) {
			const formattedDuration = BaseModerationCase.formatDuration(
				this.duration
			);
			const expiryDate = new Date(this.timeStamp.getTime() + this.duration);

			actionDetails.push(
				`**Duration:** ${formattedDuration}`,
				`**Expires:** ${time(expiryDate, TimestampStyles.RelativeTime)}`
			);
		}
		actionDetails.push(`**Reason:** ${this.reason}`);

		if (this.active === true) {
			actionDetails.push(`**Status:** 🔴 Active`);
		} else if (this.active === false) {
			actionDetails.push(`**Status: ✅ Closed`);
			if (this.closingStaffId) {
				actionDetails.push(
					`**Closing Moderator:** ${userMention(this.closingStaffId as string)}`
				);
				actionDetails.push(`**Closing Reason:** ${this.closeReason}`);
			} else {
				actionDetails.push(`**Closing Reason:** ${this.closeReason}`);
			}
		}

		const modDetails: string[] = [];
		modDetails.push(`### Moderator Information`);

		if (this.staffId) {
			modDetails.push(
				`**Moderator:** ${userMention(this.staffId)} (ID \`${this.staffId}\`)`
			);
		} else if (this.automodMetadata) {
			modDetails.push(
				`**Moderator:** 🤖 Automod System`,
				`**Automod Details:** \`\`\`${this.automodMetadata}\`\`\``
			);
		} else {
			modDetails.push(`**Moderator:** 🤖 Automod System`);
		}

		const detailsSection = new TextDisplayBuilder().setContent(
			[...userDetails, "", ...actionDetails, "", ...modDetails].join(`\n`)
		);

		container.addTextDisplayComponents(detailsSection);

		if (this.evidenceUrls && this.evidenceUrls.length > 0) {
			const evidenceHeader = new TextDisplayBuilder().setContent(
				`### Evidence (${this.evidenceUrls.length} item${
					this.evidenceUrls.length !== 1 ? "s" : ""
				})`
			);
			container.addTextDisplayComponents(evidenceHeader);
			const evidence = new MediaGalleryBuilder();
			this.evidenceUrls.forEach((entry) => {
				evidence.addItems(new MediaGalleryItemBuilder().setURL(entry));
			});
			container.addMediaGalleryComponents(evidence);
		}
		return container;
	}
}

export class WarnCase extends BaseModerationCase {
	constructor(
		caseId: number,
		guildId: string,
		targetId: string,
		staffId: string,
		reason: string,
		automodMetaData?: string
	) {
		super(caseId, guildId, targetId, staffId, reason);
		this.automodMetadata = automodMetaData ?? null;
	}

	getActionKey(): string {
		return "warn";
	}
}

export class KickCase extends BaseModerationCase {
	constructor(
		caseId: number,
		guildId: string,
		targetId: string,
		staffId: string,
		reason: string,
		automodMetaData?: string
	) {
		super(caseId, guildId, targetId, staffId, reason);
		this.automodMetadata = automodMetaData ?? null;
	}

	getActionKey(): string {
		return "kick";
	}
}

export class TimeoutCase extends BaseModerationCase {
	constructor(
		caseId: number,
		guildId: string,
		targetId: string,
		staffId: string,
		reason: string,
		duration: number,
		automodMetaData?: string
	) {
		super(caseId, guildId, targetId, staffId, reason);
		this.automodMetadata = automodMetaData ?? null;
		this.duration = duration;
	}

	getActionKey(): string {
		return "timeout";
	}
}

export class MuteCase extends BaseModerationCase {
	constructor(
		caseId: number,
		guildId: string,
		targetId: string,
		staffId: string,
		reason: string,
		duration: number,
		active: boolean,
		muteRoleId: string,
		automodMetaData?: string
	) {
		super(caseId, guildId, targetId, staffId, reason);
		this.automodMetadata = automodMetaData ?? null;
		this.active = active;
		this.duration = duration;
		this.muteRoleId = muteRoleId;
	}

	getActionKey(): string {
		return "mute";
	}
}

export class BanCase extends BaseModerationCase {
	constructor(
		caseId: number,
		guildId: string,
		targetId: string,
		staffId: string,
		reason: string,
		duration?: number,
		active?: boolean,
		closingStaffId?: string,
		closeReason?: string,

		automodMetaData?: string
	) {
		super(caseId, guildId, targetId, staffId, reason);
		this.duration = duration;
		this.active = active;
		this.automodMetadata = automodMetaData;
		this.closeReason = closeReason;
		this.closingStaffId = closingStaffId;
	}

	getActionKey(): string {
		return "ban";
	}
}
