import { Schema, model } from "mongoose";
const tempBans = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    banTime: {
        type: String,
        required: true,
    },
});
export default model("Soft Bans", tempBans);
