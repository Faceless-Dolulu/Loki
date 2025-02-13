import { EmbedBuilder } from "discord.js";
export default async (guild, client) => {
    try {
        const channel = client.channels.cache.get(`1338574037101707354`) ??
            (await client.channels.fetch(`1338574037101707354`));
        const embed = new EmbedBuilder()
            .setTitle(`Joined New Server`)
            .setColor(0x1a9011)
            .addFields({
            name: `Server Name`,
            value: guild.name,
            inline: true,
        }, {
            name: `Server ID`,
            value: guild.id,
            inline: true,
        }, {
            name: `Server Creation Date`,
            value: guild.createdAt.toDateString(),
            inline: true,
        });
        channel.send({ embeds: [embed] });
    }
    catch (error) { }
};
