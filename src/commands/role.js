import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";

export const slash = new SlashCommandBuilder()
    .setName("role")
    .setDescription("Manage roles and also handle the setups if wanted")
    .setContexts([0])
    .setIntegrationTypes([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setNSFW(false)
    .addSubcommand(subcommand =>
        subcommand
            .setName('give')
            .setDescription("Manual givness of a role")
            .addUserOption(option =>
                option.setName("member")
                    .setDescription("Member which will get the role")
                    .setRequired(true))
            .addRoleOption(option =>
                option.setName("role")
                    .setDescription("The role which will be given")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("message")
                    .setDescription("Message ID of the AdvancedReactions setup")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("emoji")
                    .setDescription("Emoji of the AdvancedReactions setup")
                    .setRequired(false))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription("Manual removal of a role")
            .addUserOption(option =>
                option.setName("member")
                    .setDescription("Member which will loose the role")
                    .setRequired(true))
            .addRoleOption(option =>
                option.setName("role")
                    .setDescription("The role which will be taken")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("message")
                    .setDescription("Message ID of the AdvancedReactions setup")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("emoji")
                    .setDescription("Emoji of the AdvancedReactions setup")
                    .setRequired(false))
    );

export default async function run(bot, i) {
    const sub = i.options._subcommand;

    if (sub === "give") {
        const member = await i.guild.members.fetch({ user: i.options.getMember("member").id, cache: true, force: false, withPresences: false });
        const role = i.options.getRole("role");
        const message = i.options.getString("message");
        let emoji = i.options.getString("emoji");
        const numMap = new Map([
            ["0⃣", ":zero:"],
            ["1⃣", ":one:"],
            ["2⃣", ":two:"],
            ["3⃣", ":three:"],
            ["4⃣", ":four:"],
            ["5⃣", ":five:"],
            ["6⃣", ":six:"],
            ["7⃣", ":seven:"],
            ["8⃣", ":eight:"],
            ["9⃣", ":nine:"],
            ["🔟", ":ten:"]
        ]);
        if (numMap.has(emoji)) emoji = numMap.get(emoji);

        const dbPath = path.resolve("./db/");
        const guildPath = path.join(dbPath, i.guild.id + ".json");
        const exists = fs.existsSync(guildPath); //Is this guild in the database?

        if (exists) await i.reply({
            content: `> ✅ **Database found!**\n> ❓ *Searching for the record...*\n> ❓ *Giving the role...*\n> ❓ *Saving to the database...*`,
            ephemeral: true
        });
        else return i.reply({
            content: `**Error!** You did not set any AdvancedReactions setup yet.\n> 🛑 **Database not found!**\n> ⭕ *Searching for the record...*\n> ⭕ *Giving the role...*\n> ⭕ *Saving to the database...*`,
            ephemeral: true
        });

        let db = JSON.parse(fs.readFileSync(guildPath, "utf-8"));
        const setup = db.find(arr => arr.emoji === emoji && arr.msgID === message);
        if (setup) await i.editReply({
            content: `> ✅ **Database found!**\n> ✅ **Database record found!**\n> ❓ *Giving the role...*\n> ❓ *Saving to the database...*`,
            ephemeral: true
        });
        else return i.editReply({
            content: `**Error!** Your query was not found.\n> ✅ **Database found!**\n> 🛑 **Database record not found!**\n> ⭕ *Giving the role...*\n> ⭕ *Saving to the database...*`,
            ephemeral: true
        });

        //Can the bot add/manage this role?
        if (!role || !role.editable) return i.editReply({
            content: `**Error!** The role doesn't exist or the bot cannot give it.\n> ✅ **Database record found!**\n> ✅ **Record found!**\n> 🛑 **Role cannot be given!**\n> ⭕ *Saving to the database...*`,
            ephemeral: true
        });

        if (member.roles.cache.has(role.id)) return i.editReply({
            content: `**Error!** The member already has the role.\n> ✅ **Database found!**\n> ✅ **Database record found!**\n> 🛑 **Role cannot be given!**\n> ⭕ *Saving to the database...*`,
            ephemeral: true
        });

        member.roles.add(
            role,
            `${i.user.tag} used /role give.`
        ).then(async () => {
            await i.editReply({
                content: `> ✅ **Database found!**\n> ✅ **Database record found!**\n> ✅ **Role given!**\n> ❓ *Saving to the database...*`,
                ephemeral: true
            });

            if (!db[db.indexOf(setup)].reacted.includes(member.id))
                db[db.indexOf(setup)].reacted.push(member.id);
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
                .replaceAll("{guild}", i.guild.name);

            let welcomeChannel = false;
            if (setup.welcomeChannelID) welcomeChannel = await i.guild.channels.fetch(setup.welcomeChannelID, { cache: true, force: false });

            if (welcomeChannel && welcomeChannel.viewable) welcomeChannel.send({ content: welcome });
            else u.send({ content: welcome });

            console.log(i.user.tag, "from", i.guild.name, "used /role give");

            return i.editReply({
                content: `> ✅ **Database found!**\n> ✅ **Database record found!**\n> ✅ **Role given!**\n> ✅ **Saved to the database!**`,
                ephemeral: true
            });
        });
    } else if (sub === "remove") {
        const member = await i.guild.members.fetch({ user: i.options.getMember("member").id, cache: true, force: false, withPresences: false });
        const role = i.options.getRole("role");
        const message = i.options.getString("message");
        let emoji = i.options.getString("emoji");
        const numMap = new Map([
            ["0⃣", ":zero:"],
            ["1⃣", ":one:"],
            ["2⃣", ":two:"],
            ["3⃣", ":three:"],
            ["4⃣", ":four:"],
            ["5⃣", ":five:"],
            ["6⃣", ":six:"],
            ["7⃣", ":seven:"],
            ["8⃣", ":eight:"],
            ["9⃣", ":nine:"],
            ["🔟", ":ten:"]
        ]);
        if (numMap.has(emoji)) emoji = numMap.get(emoji);

        const dbPath = path.resolve("./db/");
        const guildPath = path.join(dbPath, i.guild.id + ".json");
        const exists = fs.existsSync(guildPath); //Is this guild in the database?

        if (exists) await i.reply({
            content: `> ✅ **Database found!**\n> ❓ *Searching for the record...*\n> ❓ *Removing the role...*\n> ❓ *Saving to the database...*`,
            ephemeral: true
        });
        else return i.reply({
            content: `**Error!** You did not set any AdvancedReactions setup yet.\n> 🛑 **Database not found!**\n> ⭕ *Searching for the record...*\n> ⭕ *Removing the role...*\n> ⭕ *Saving to the database...*`,
            ephemeral: true
        });

        let db = JSON.parse(fs.readFileSync(guildPath, "utf-8"));
        const setup = db.find(arr => arr.emoji === emoji && arr.msgID === message);
        if (setup) await i.editReply({
            content: `> ✅ **Database found!**\n> ✅ **Database record found!**\n> ❓ *Removing the role...*\n> ❓ *Saving to the database...*`,
            ephemeral: true
        });
        else return i.editReply({
            content: `**Error!** Your query was not found.\n> ✅ **Database found!**\n> 🛑 **Database record not found!**\n> ⭕ *Removing the role...*\n> ⭕ *Saving to the database...*`,
            ephemeral: true
        });

        //Can the bot add/manage this role?
        if (!role || !role.editable) return i.editReply({
            content: `**Error!** The role doesn't exist or the bot cannot give it.\n> ✅ **Database record found!**\n> ✅ **Record found!**\n> 🛑 **Role cannot be removed!**\n> ⭕ *Saving to the database...*`,
            ephemeral: true
        });

        if (!member.roles.cache.has(role.id)) return i.editReply({
            content: `**Error!** The member doesn't have the role.\n> ✅ **Database found!**\n> ✅ **Database record found!**\n> 🛑 **Role cannot be removed!**\n> ⭕ *Saving to the database...*`,
            ephemeral: true
        });

        member.roles.remove(
            role,
            `${i.user.tag} used /role remove.`
        ).then(async () => {
            await i.editReply({
                content: `> ✅ **Database found!**\n> ✅ **Database record found!**\n> ✅ **Role removed!**\n> ❓ *Saving to the database...*`,
                ephemeral: true
            });

            const { reacted } = setup;
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

            console.log(i.user.tag, "from", i.guild.name, "used /role remove");

            return i.editReply({
                content: `> ✅ **Database found!**\n> ✅ **Database record found!**\n> ✅ **Role removed!**\n> ✅ **Saved to the database!**`,
                ephemeral: true
            });
        });
    }
}