export default function (c, client, handler) {
    console.log(`${c.user.username} is ready!`);
    // client.user.setPresence({
    // 	activities: [
    // 		{
    // 			name: `over ${client.guilds.cache.size} servers.`,
    // 			type: ActivityType.Watching,
    // 		},
    // 	],
    // 	status: PresenceUpdateStatus.Online,
    // });
}
