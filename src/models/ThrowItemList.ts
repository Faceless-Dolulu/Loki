import { Schema, model } from "mongoose";
import { ThrowSettings } from "../Util/Interfaces.js";

const throwItemListSchema = new Schema<ThrowSettings>({
	guildId: { type: String, required: true, unique: true },
	customItems: { type: [String], default: [] },
	blacklistedChannels: { type: [String], default: [] },
	customItemsOnly: { type: Boolean, default: false },
});

export default model(`Custom Throwable Items`, throwItemListSchema);
