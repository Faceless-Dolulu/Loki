import { Schema, model } from "mongoose";

const Tickets = new Schema({
	guildId: {
		type: String,
		required: true,
	},
	ticketChannelId: {
		type: String,
		required: true,
	},
	ticketUserId: {
		type: String,
		required: true,
	},
	adminOnly: {
		type: Boolean,
	},
});

export default model(`Opened Tickets`, Tickets);
