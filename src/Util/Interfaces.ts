export interface ActionSettings {
	enabled: boolean;
	reasonRequired: boolean;
	evidenceRequired: boolean;
	whitelistedRoles: string[] | null;
	defaultDuration?: number | null;
	fallbackLogChannel?: string | null;
	logChannel?: string | null;
	muteRoleId?: string | null;
}

export interface ThrowSettings {
	customItems: string[];
	blacklistedChannels: string[];
	customItemsOnly: boolean;
	guildId: string;
}

export interface throwItemValidationResult {
	validItems: string[];
	rejectedItems: { item: string; reasons: string[] }[];
	summaryMessage: string;
}

export interface ModerationCase {
	guildId: string;
	caseId: string;
	action: string;
	targetId: string;
	moderatorId: string;
	reason: string;
	duration: number;
	createdAt: Date;
	expiresAt: Date;
	active: boolean;
	mutedRoleId: string;
	edited: boolean;
	closingStaffId: string;
	closeReason: string;
	evidenceUrls: string[];
	automodMetadata: string;
}
