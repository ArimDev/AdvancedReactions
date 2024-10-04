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

    const setups = db.filter(setup => setup.emoji === emojiName && setup.msgID === message.id); //Find the individual setup(s) in the DB record
    if (!setups.length) return; //Did it find anything?

    const member = await guild.members.fetch({ user: u.id, cache: true, force: false, withPresences: false });
    const usersReacted = Array.from((await r.users.fetch()).keys());

    for (const setup of setups) { //Do something for each setup
        if (setup.limit && usersReacted.filter(u => ![setup.adminID, bot.user.id].includes(u.id)).length >= setup.limit) //Ignore an admin's and/or a bot's reaction
            return; //Has been the limit of reactions reached?

        if (setup.maxClaims) {
            let alreadyClaimed = 1;
            const allR = message.reactions.cache;

            for (let oneR of allR.values()) { //Cycle every reaction
                oneR = await oneR.users.fetch();
                if (oneR.has(u.id)) alreadyClaimed++; //Did user react on this one?
                if (setup.maxClaims < alreadyClaimed) return;
            }
        }

        const role = await guild.roles.fetch(setup.roleID, { cache: true, force: false });
        if (!role || !role.editable) return;

        member.roles.remove(
            role,
            `${member.user.tag} unreacted with ${emojiName} in ${message.channel.name}.`
        ).then(async () => {
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