import fs from "fs";
import path from "path";

export default async function (bot, r, u) {
    if (u.bot) return;
    const { message } = r;
    const { guild } = message;
    const guildPath = path.join(path.resolve("./db/"), guild.id + ".json");
    if (!fs.existsSync(guildPath)) return;

    const db = JSON.parse(fs.readFileSync(guildPath, "utf-8"));
    const ar = db.filter(arr => arr.emoji === r.emoji.name && arr.msgID === message.id);
    if (!ar.length) return;

    const member = await guild.members.fetch(u.id);
    for (const arr of ar) {
        const role = await guild.roles.fetch(arr.roleID);
        if (!role) return;
        if (!role.editable) return;

        member.roles.remove(role).then(async () => {
            db[db.indexOf(arr)].uses--;
            fs.writeFileSync(
                guildPath,
                JSON.stringify(db, null, 4)
            );
            const goodbye = arr.goodbye
                .replaceAll("{role}", role.name)
                .replaceAll("{guild}", guild.name);
            await u.send(goodbye);

            return console.log(u.tag, "from", guild.name, "unreacted with", emoji);
        }).catch((e) => console.error(e));
    }
}