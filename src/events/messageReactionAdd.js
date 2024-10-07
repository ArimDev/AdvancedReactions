import fs from "fs";
import path from "path";

export default async function (bot, r, u) {
    if (u.bot) return;

    let { message, emoji } = r;
    const { guild } = message;
    const guildPath = path.join(path.resolve("./db/"), guild.id + ".json");

    if (!fs.existsSync(guildPath)) //Is this guild in the DB?
        return;

    const emojiName = emoji.guild ? `<:${emoji.name}:${emoji.id}>` : emoji.name;

    let db = fs.readFileSync(guildPath, "utf-8"); //Get the DB
    db = JSON.parse(db); //Get the parsed JSON data of DB record

    const member = await guild.members.fetch({ user: u.id, cache: true, force: true, withPresences: false });

    const setupsSameMessage = db.filter(setup => setup.msgID === message.id); //Find the individual setup(s) in the DB record
    const setupsSameReaction = setupsSameMessage.filter(setup => setup.emoji === emojiName); //Find the individual setup(s) in the DB record
    if (!setupsSameReaction.length) return; //Did it find anything?

    for (let setup of setupsSameReaction) {
        let { reacted } = setup;

        if (member.roles.cache.has(setup.roleID)) {
            if (!db[db.indexOf(setup)].reacted.includes(member.id))
                db[db.indexOf(setup)].reacted.push(u.id);
            return fs.writeFileSync(
                guildPath,
                JSON.stringify(db, null, 4)
            );
        }

        if (db[db.indexOf(setup)].reacted.includes(member.id)) {
            const role = await guild.roles.fetch(setup.roleID, { cache: true, force: false });
            if (!role || !role.editable) return r.users.remove(u.id); //Can the bot add/manage this role?

            return member.roles.add(
                role,
                `${member.user.tag} reacted with ${emojiName} in ${message.channel.name}.`
            );
        }

        if (setup.limit && reacted.filter(u => ![setup.adminID, bot.user.id].includes(u)).length >= setup.limit) //Ignore an admin's and/or a bot's reaction
            return r.users.remove(u.id); //Has been the limit of reactions reached?

        if (setup.maxClaims) {
            let alreadyClaimed = 0;
            for (const oneSetupReaction of setupsSameMessage) { //Cycle every reaction
                const { reacted } = oneSetupReaction;
                if (reacted.includes(u.id)) alreadyClaimed++; //Did user react on this one?
                if (alreadyClaimed >= setup.maxClaims) return r.users.remove(u.id);
            }
        }

        const role = await guild.roles.fetch(setup.roleID, { cache: true, force: false });
        if (!role || !role.editable) return r.users.remove(u.id); //Can the bot add/manage this role?

        await member.roles.add(
            role,
            `${member.user.tag} reacted with ${emojiName} in ${message.channel.name}.`
        );

        if (!db[db.indexOf(setup)].reacted.includes(member.id))
            db[db.indexOf(setup)].reacted.push(u.id);
        fs.writeFileSync(
            guildPath,
            JSON.stringify(db, null, 4)
        );

        const welcome = setup.welcome
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
        if (setup.welcomeChannelID) welcomeChannel = await guild.channels.fetch(setup.welcomeChannelID, { cache: true, force: false });

        if (welcomeChannel && welcomeChannel.viewable) await welcomeChannel.send({ content: welcome });
        else {
            try {
                await u.send({ content: welcome });
            } catch { }
        }

        return console.log(u.tag, "from", guild.name, "reacted with", emojiName);
    }
}