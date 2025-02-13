import tempBans from "../../models/tempBans.js";
export default async function (c, client, handler) {
    //@ts-ignore
    async function unban(banData) {
        const delay = banData.banTime - Date.now();
        if (delay <= 0)
            return;
        setTimeout(async () => {
            try {
                const guild = await client.guilds.fetch(banData.guildId);
                await guild.bans.remove(banData.userId).catch(() => { });
                await tempBans
                    .deleteOne({
                    guildId: banData.guildId,
                    userId: banData.userId,
                })
                    .catch(() => { });
            }
            catch (error) {
                console.error(`Error unbanning member`, error);
            }
        }, delay);
    }
    const data = await tempBans.find();
    data.forEach(unban);
    tempBans.watch().on("change", async (change) => {
        if (change.operationType === "insert") {
            const newUnban = change.fullDocument;
            unban(newUnban);
        }
    });
}
