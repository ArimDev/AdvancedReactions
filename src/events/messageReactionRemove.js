import fs from "fs";
import path from "path";

export default async function (bot, r, u) {
    if (u.bot) return;

    let { message, emoji } = r;
    const { guild } = message;
    const guildPath = path.join(path.resolve("./db/"), guild.id + ".json");
    try {
        fs.existsSync(guildPath); //Is this guild in the DB?
    } catch { return; }

    const emojiName = emoji.guild ? `<:${emoji.name}:${emoji.id}>` : emoji.name;

    let db = fs.readFileSync(guildPath, "utf-8"); //Get the DB
    db = JSON.parse(db); //Get the parsed JSON data of DB record

    const member = await guild.members.fetch({ user: u.id, cache: true, force: false, withPresences: false });

    const setupsSameMessage = db.filter(setup => setup.msgID === message.id); //Find the individual setup(s) in the DB record
    const setupsSameReaction = setupsSameMessage.filter(setup => setup.emoji === emojiName); //Find the individual setup(s) in the DB record
    if (!setupsSameReaction.length) return; //Did it find anything?

    for (let setup of setupsSameReaction) {
        let { reacted } = setup;

        if (!member.roles.cache.has(setup.roleID)) return;
        const role = await guild.roles.fetch(setup.roleID, { cache: true, force: false });
        if (!role || !role.editable) return; //Can the bot add/manage this role?

        member.roles.remove(
            role,
            `${member.user.tag} unreacted with ${emojiName} in ${message.channel.name}.`
        ).then(async () => {
            reacted.splice(reacted.indexOf(u.id), 1);
            setup["reacted"] = reacted;
            db[db.indexOf(setup)] = setup;
            fs.writeFileSync(
                guildPath,
                JSON.stringify(db, null, 4)
            );

            const goodbye = setup.goodbye
                .replaceAll("{memberNickname}", member.nickname || member.user.displayName)
                .replaceAll("{memberUsername}", member.user.tag)
                .replaceAll("{memberName}", member.user.displayName)
                .replaceAll("{memberID}", member.user.id)
                .replaceAll("{memberMention}", `<@${member.user.id}>`)
                .replaceAll("{roleName}", role.name)
                .replaceAll("{roleID}", role.id)
                .replaceAll("{roleMention}", `<@&${role.id}>`)
                .replaceAll("{guild}", guild.name);

            let goodbyeChannel = false;
            if (setup.goodbyeChannelID) goodbyeChannel = await guild.channels.fetch(setup.goodbyeChannelID, { cache: true, force: false });

            if (goodbyeChannel && goodbyeChannel.viewable) goodbyeChannel.send({ content: goodbye });
            else u.send({ content: goodbye });

            return console.log(u.tag, "from", guild.name, "unreacted with", emojiName);
        }).catch((e) => console.error(e));
    }
}