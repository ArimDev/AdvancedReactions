import fs from "fs";
import path from "path";

export default async function (bot, r, u) {
    if (u.bot) return;
    let { message } = r;
    const { guild } = message;
    const guildPath = path.join(path.resolve("./db/"), guild.id + ".json");
    if (!fs.existsSync(guildPath)) return; //Is this guild in the DB?

    const db = JSON.parse(fs.readFileSync(guildPath, "utf-8")); //Get the parsed JSON data of DB record
    const ar = db.filter(arr => arr.emoji === r.emoji.name && arr.msgID === message.id); //Find the individual setup(s) in the DB record
    if (!ar.length) return; //Did it find anything?

    const member = await guild.members.fetch(u.id);
    for (const arr of ar) { //Do something for each setup
        const rr = await r.users.fetch();
        if (arr.limit && rr.filter(u => ![arr.adminID, bot.user.id].includes(u.id)) >= arr.limit) //Ignore an admin's and/or a bot's reaction
            return r.users.remove(u.id); //Has been the limit of reactions reached?

        if (arr.maxClaims) {
            let alreadyClaimed = 0;
            const allR = message.reactions.cache;

            for (let oneR of allR.values()) { //Cycle every reaction
                oneR = await oneR.users.fetch();
                if (oneR.has(u.id)) alreadyClaimed++; //Did user react on this one?
            }

            if (arr.maxClaims < alreadyClaimed) return r.users.remove(u.id);
        }

        const role = await guild.roles.fetch(arr.roleID).catch(() => null);
        if (!role) return r.users.remove(u.id);
        if (!role.editable) return r.users.remove(u.id);

        member.roles.add(
            role,
            `${member.user.tag} reacted with ${r.emoji.name} in ${message.channel.name}.`
        ).then(async () => {
            fs.writeFileSync(
                guildPath,
                JSON.stringify(db, null, 4)
            );

            const welcome = arr.welcome
                .replaceAll("{memberNickname}", member.nickname || member.user.displayName)
                .replaceAll("{memberUsername}", member.user.tag)
                .replaceAll("{memberName}", member.user.displayName)
                .replaceAll("{memberID}", member.user.id)
                .replaceAll("{memberMention}", `<@${member.user.id}>`)
                .replaceAll("{roleName}", role.name)
                .replaceAll("{roleID}", role.id)
                .replaceAll("{roleMention}", `<@&${role.id}>`)
                .replaceAll("{guild}", guild.name);

            let welcomeChannel = false;
            if (arr.welcomeChannelID) welcomeChannel = await guild.channels.fetch(arr.welcomeChannelID).catch(() => null);

            if (welcomeChannel && welcomeChannel.viewable) await welcomeChannel.send({ content: welcome });
            else await u.send({ content: welcome });

            return console.log(u.tag, "from", guild.name, "reacted with", r.emoji.name);
        }).catch((e) => console.error(e));
    }
}