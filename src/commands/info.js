import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";

export const slash = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Info menu about the bot")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .setNSFW(false);

export default async function run(bot, i) {
    function msToTime(ms) {
        const time = {
            day: Math.floor(ms / (24 * 60 * 60 * 1000)),
            hour: Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
            minute: Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000)),
            second: Math.floor((ms % (60 * 1000)) / 1000),
        };

        let result = [];

        if (time.day) result.push(`${time.day} day${time.day > 1 ? "s" : ""}`);
        if (time.hour) result.push(`${time.hour} hour${time.hour > 1 ? "s" : ""}`);
        if (time.minute) result.push(`${time.minute} minute${time.minute > 1 ? "s" : ""}`);
        if (time.second) result.push(`${time.second} second${time.second > 1 ? "s" : ""}`);

        return result.length > 0 ? result.join(", ") : "0 seconds";
    }

    const db = fs.readdirSync(path.resolve("./db/"));
    let setups = 0;
    for (const guild of db) {
        if (guild === "01.json") continue;
        const setupsDB = JSON.parse(fs.readFileSync(path.join(path.resolve("./db/"), guild), "utf-8"));
        setups = setups + setupsDB.length;
    }

    let helpEmbed = new EmbedBuilder()
        .setTitle("Bot Information")
        .setFields([
            {
                name: `Status`, inline: true,
                value:
                    `> **Ping:** \`${bot.ws.ping > 1 ? bot.ws.ping + " ms" : "N/A"}\``
                    + `\n> **Uptime:** \`${msToTime(bot.uptime)}\``
            },
            {
                name: `Stats`, inline: true,
                value:
                    `> **Servers:** \`${db.length - 1}\``
                    + `\n> **Setups:** \`${setups}\``
            },
            {
                name: `Info`, inline: false,
                value:
                    `> **Made by:** [ArimDev](https://github.com/ArimDev)`
                    + `\n> **Author:** [PetyXbron](https://github.com/PetyXbron)`
                    + `\n> **Source code:** [github.com](https://github.com/ArimDev/AdvancedReactions)`
            }
        ])
        .setColor(bot.AR.color)
        .setThumbnail(bot.user.avatarURL())
        .setFooter({ text: `AdvancedReactions v${process.env.version} 💫`, iconURL: bot.user.avatarURL() });

    return i.reply({ embeds: [helpEmbed], ephemeral: true });
}