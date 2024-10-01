import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import AsciiTable from "ascii-table";

export default async function (bot) {
    const db = fs.readdirSync(path.resolve("./db/"));
    let records = 0;
    for (const guild of db) {
        if (guild === "01.json") continue;
        const recs = JSON.parse(fs.readFileSync(path.join(path.resolve("./db/"), guild), "utf-8"));
        records = records + recs.length;
    }
    const cmds = [];
    bot.commands.forEach((value, key) => {
        if (value.slash) {
            cmds.push(value.slash);
        }
    });
    const rest = new REST().setToken(bot.token);

    try {
        await rest.put(
            Routes.applicationCommands(bot.user.id),
            { body: cmds },
        ).then(() => {
            const table = new AsciiTable('AdvancedReactions')
                .addRow("Bot Tag", bot.user.tag)
                .addRow("Ready", true)
                .addRow("Guilds", db.length - 1)
                .addRow("Records", records)
                .addRow("Events", bot.events)
                .addRow("Commands", cmds.length)
                .setAlign(1, AsciiTable.CENTER);
            console.log(table.toString());
        });
    } catch (err) {
        console.log(err);
    };

    console.log("Waiting for interactions...");
}