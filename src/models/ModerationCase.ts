import { Schema, model } from "mongoose";
import { ModerationCase } from "../Util/Interfaces";

const CaseSchema = new Schema<ModerationCase>({
	guildId: {
		type: String,
		required: true,
		index: true,
	},
	caseId: {
		type: String,
		required: true,
	},
	action: {
		type: String, // e.g., 'ban', 'kick', etc.
		required: true,
	},
	targetId: {
		type: String,
		required: true,
		index: true,
	},
	moderatorId: {
		type: String,
		required: true,
		index: true,
	},
	reason: {
		type: String,
		default: `No reason was provided`,
	},
	duration: {
		type: Number, // In milliseconds if applicable (Null if permanent or not timed)
		default: null,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		index: true,
	},
	expiresAt: {
		type: Date,
		index: true,
	},
	active: {
		type: Boolean,
		default: null,
	},

	mutedRoleId: {
		type: String,
		default: null,
	},
	edited: {
		type: Boolean,
		default: false,
	},
	closingStaffId: {
		type: String,
		default: null,
	},
	closeReason: {
		type: String,
		default: null,
	},
	evidenceUrls: {
		type: [String],
		default: [],
	},
	automodMetadata: {
		type: String,
		default: null,
	},
});

CaseSchema.index(
	{ guildId: 1, caseId: 1, expiresAt: 1, action: 1, active: 1 },
	{ unique: true }
);

export default model("Moderation Cases", CaseSchema);
