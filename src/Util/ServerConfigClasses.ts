import ThrowItemList from "../models/ThrowItemList.js";
import { ModerationSettingBase } from "./AbstractClasses.js";
import { arraysEqual, normalize } from "./ValidationHelpers.js";
import { ActionSettings, ThrowSettings } from "./Interfaces.js";

export class BanSettings
	extends ModerationSettingBase
	implements ActionSettings
{
	constructor(
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		whitelistedRoles: string[],
		logChannel: string | null
	) {
		super(
			enabled,
			reasonRequired,
			evidenceRequired,
			whitelistedRoles,
			logChannel
		);
	}

	getCollectionKey(): string {
		return "ban";
	}
}

export class KickSettings
	extends ModerationSettingBase
	implements ActionSettings
{
	constructor(
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		whitelistedRoles: string[],
		logChannel: string | null
	) {
		super(
			enabled,
			reasonRequired,
			evidenceRequired,
			whitelistedRoles,
			logChannel
		);
	}

	getCollectionKey(): string {
		return "kick";
	}
}

export class WarnSettings
	extends ModerationSettingBase
	implements ActionSettings
{
	constructor(
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		whitelistedRoles: string[],
		logChannel: string | null
	) {
		super(
			enabled,
			reasonRequired,
			evidenceRequired,
			whitelistedRoles,
			logChannel
		);
	}
	getCollectionKey(): string {
		return "warn";
	}
}

export class TimeoutSettings
	extends ModerationSettingBase
	implements ActionSettings
{
	public defaultDuration: number | null | undefined;
	constructor(
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		whiteListedRoles: string[],
		defaultDuration: number,
		logChannel: string | null
	) {
		super(
			enabled,
			reasonRequired,
			evidenceRequired,
			whiteListedRoles,
			logChannel
		);
		this.defaultDuration = defaultDuration;
	}
	set DefaultDuration(value: number) {
		this.defaultDuration = value;
	}
	get DefaultDuration(): number {
		return this.defaultDuration as number;
	}

	hasChangedFrom(other: ActionSettings): boolean {
		if (
			this.enabled !== other.enabled ||
			this.evidenceRequired !== other.evidenceRequired ||
			this.reasonRequired !== other.reasonRequired ||
			this.defaultDuration !== other.defaultDuration ||
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

	getCollectionKey(): string {
		return "timeout";
	}
}

export class MuteSettings
	extends ModerationSettingBase
	implements ActionSettings
{
	public defaultDuration: number | null | undefined;
	public muteRoleId: string | null | undefined;
	constructor(
		enabled: boolean,
		reasonRequired: boolean,
		evidenceRequired: boolean,
		whitelistedRoles: string[],
		defaultDuration: number,
		logChannel: string | null,
		muteRoleId: string
	) {
		super(
			enabled,
			reasonRequired,
			evidenceRequired,
			whitelistedRoles,
			logChannel
		);
		this.defaultDuration = defaultDuration;
		this.muteRoleId = muteRoleId;
	}
	set DefaultDuration(value: number) {
		this.defaultDuration = value;
	}
	get DefaultDuration(): number {
		return this.defaultDuration as number;
	}

	set MuteRoleId(value: string) {
		this.muteRoleId = value;
	}
	get MuteRoleId(): string {
		return this.muteRoleId as string;
	}
	hasChangedFrom(other: ActionSettings): boolean {
		if (
			this.enabled !== other.enabled ||
			this.evidenceRequired !== other.evidenceRequired ||
			this.reasonRequired !== other.reasonRequired ||
			this.defaultDuration !== other.defaultDuration ||
			this.muteRoleId !== other.muteRoleId ||
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
	getCollectionKey(): string {
		return "mute";
	}
}

export class ThrowClass implements ThrowSettings {
	customItems: string[];
	blacklistedChannels: string[];
	customItemsOnly: boolean;
	guildId!: string;
	constructor(
		customItems: string[],
		blacklistedChannels: string[],
		customItemsOnly: boolean
	) {
		(this.customItems = customItems),
			(this.blacklistedChannels = blacklistedChannels),
			(this.customItemsOnly = customItemsOnly);
	}

	set onlyCustomItems(value: boolean) {
		this.customItemsOnly = value;
	}
	get onlyCustomItems(): boolean {
		return this.customItemsOnly;
	}
	addCustomItems(values: string[]) {
		this.customItems = Array.from(new Set(this.customItems.concat(values)));
	}

	removeCustomItems(values: string[]) {
		this.customItems = this.customItems.filter(
			(item) => !values.includes(item)
		);
	}

	set BlacklistedChannels(values: string[]) {
		this.blacklistedChannels = values;
	}

	get BlacklistedChannels(): string[] {
		return this.blacklistedChannels;
	}

	hasChangedFrom(other: ThrowSettings): boolean {
		if (this.customItemsOnly !== other.customItemsOnly) {
			return true;
		}
		if (
			!arraysEqual(this.customItems, other.customItems) ||
			!arraysEqual(this.blacklistedChannels, other.blacklistedChannels)
		) {
			return true;
		}
		return false;
	}

	async saveToDatabase(guildId: string) {
		return await ThrowItemList.updateOne(
			{ guildId },
			{
				$set: {
					customItems: this.customItems,
					blacklistedChannels: this.blacklistedChannels,
					customItemsOnly: this.customItemsOnly,
				},
			},
			{ new: true }
		);
	}
}
