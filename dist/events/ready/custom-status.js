import { ActivityType } from "discord.js";
export default function (c, client, handler) {
    setInterval(() => {
        client.user.setPresence({
            activities: [
                {
                    name: `Chilling In ${client.guilds.cache.size} Servers!`,
                    type: ActivityType.Custom,
                },
            ],
        });
    }, 60000);
}
