import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";

export const slash = new SlashCommandBuilder()
    .setName("ar")
    .setDescription("Edit Advanced Reactions system")
    .setContexts([0])
    .setIntegrationTypes([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setNSFW(false)
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription("Setup a new single reaction role automation")
            .addChannelOption(option =>
                option.setName("channel")
                    .setDescription("Channel with the message")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("message")
                    .setDescription("Message ID")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("emoji")
                    .setDescription("Emoji of the reaction")
                    .setRequired(true))
            .addRoleOption(option =>
                option.setName("role")
                    .setDescription("Role given after reacting")
                    .setRequired(true))
            .addChannelOption(option =>
                option.setName("welcomechannel")
                    .setDescription("Channel where will be the welcome message sent")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("welcome")
                    .setDescription("Message sent to the member after adding the reaction")
                    .setRequired(false))
            .addChannelOption(option =>
                option.setName("goodbyechannel")
                    .setDescription("Channel where will be the goodbye message sent")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("goodbye")
                    .setDescription("Message sent to the member after removing the reaction")
                    .setRequired(false))
            .addIntegerOption(option =>
                option.setName("limit")
                    .setDescription("Maximum of users to claim the role")
                    .setMinValue(1)
                    .setRequired(false))
            .addIntegerOption(option =>
                option.setName("maxclaims")
                    .setDescription("Count of roles can user claim from this message")
                    .setRequired(false)
                    .setMinValue(1))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription("Remove a single reaction role automation")
            .addStringOption(option =>
                option.setName("message")
                    .setDescription("Message ID")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("emoji")
                    .setDescription("Emoji of the reaction")
                    .setRequired(true))
    );

export default async function run(bot, i) {
    const sub = i.options._subcommand;

    if (sub === "setup") {
        await i.deferReply({ ephemeral: true });

        const channel = i.options.getChannel("channel");
        let message = i.options.getString("message");
        let emoji = i.options.getString("emoji");
        const role = i.options.getRole("role");
        const welcomeChannel = i.options.getChannel("welcomechannel");
        const welcome = i.options.getString("welcome");
        const goodbyeChannel = i.options.getChannel("goodbyechannel");
        const goodbye = i.options.getString("goodbye");
        const limit = i.options.getInteger("limit");
        const maxClaims = i.options.getInteger("maxclaims");

        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return i.reply({ content: `🛑 You don't have **the Administrator permission**!`, ephemeral: true });
        }

        if (![0, 5, 11, 12].includes(channel.type))
            return i.editReply({ content: `🛑 Channel <#${channel.id}> is **not a text type**! There are no messages.`, ephemeral: true });

        if (welcomeChannel && ![0, 5, 11, 12].includes(welcomeChannel.type))
            return i.editReply({ content: `🛑 Channel <#${welcomeChannel.id}> is **not a text type**! There are no messages.`, ephemeral: true });

        if (goodbyeChannel && ![0, 5, 11, 12].includes(goodbyeChannel.type))
            return i.editReply({ content: `🛑 Channel <#${goodbyeChannel.id}> is **not a text type**! There are no messages.`, ephemeral: true });

        if (!channel.viewable)
            return i.editReply({ content: `🛑 I don't have **the access to <#${channel.id}>**!`, ephemeral: true });

        if (welcomeChannel && !welcomeChannel.viewable)
            return i.editReply({ content: `🛑 I don't have **the access to <#${welcomeChannel.id}>**!`, ephemeral: true });

        if (goodbyeChannel && !goodbyeChannel.viewable)
            return i.editReply({ content: `🛑 I don't have **the access to <#${goodbyeChannel.id}>**!`, ephemeral: true });

        message = await channel.messages.fetch(message).catch(() => null);

        if (!message)
            return i.editReply({ content: `🛑 Message was **not found** in <#${channel.id}>! Did you enter the correct ID?`, ephemeral: true });
        else
            await i.editReply({
                content: `> ✅ **Message found!**\n> ❓ *Searching for the reaction...*\n> ❓ *Checking the role...*\n> ❓ *Booting the database...*`,
                ephemeral: true
            });

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

        if (message.reactions.cache.has(emoji)) {
            i.editReply({
                content: `> ✅ **Message found!**\n> ✅ **Reaction found!**\n> ❓ *Checking the role...*\n> ❓ *Booting the database...*`,
                ephemeral: true
            });
        } else {
            const reacted = await message.react(emoji)
                .then(async () =>
                    await i.editReply({
                        content: `> ✅ **Message found!**\n> ✅ **Reaction added!**\n> ❓ *Checking the role...*\n> ❓ *Booting the database...*`,
                        ephemeral: true
                    })
                ).catch(() => false);
            if (!reacted) return i.editReply({
                content: `**Error!** I don't have **the permission** to add reaction or I don't know **the emoji**.\n> ✅ **Message found!**\n> 🛑 **Reaction could not be added!**\n> ⭕ *Checking the role...*\n> ⭕ *Booting the database...*`,
                ephemeral: true
            });
        }

        if (!role.editable)
            return i.editReply({
                content: `**Error!** Unable to assign the role.\nCheck **my permission** and **my role position** to be above this role.\n> ✅ **Message found!**\n> ✅ **Reaction found!**\n> 🛑 **Cannot assign this role!**\n> ⭕ *Booting the database...*`,
                ephemeral: true
            });
        else
            await i.editReply({
                content: `> ✅ **Message found!**\n> ✅ **Reaction found!**\n> ✅ **Role is OK!**\n> ❓ *Booting the database...*`,
                ephemeral: true
            });

        let dbPath, guildPath, exists, db, record;

        record = {
            "msgID": message.id,
            "emoji": emoji,
            "adminID": i.user.id,
            "adminTag": i.user.tag,
            "channelID": channel.id,
            "roleID": role.id,
            "welcomeChannelID": goodbyeChannel?.id,
            "welcome": welcome || `🟢 You have received **{role}** role on the **{guild}**!`,
            "goodbyeChannelID": goodbyeChannel?.id,
            "goodbye": goodbye || `🔴 You don't have **{role}** role on the **{guild}** anymore.`,
            "limit": parseInt(limit),
            "maxClaims": parseInt(maxClaims),
            "reacted": []
        };

        dbPath = path.resolve("./db/");
        guildPath = path.join(dbPath, i.guild.id + ".json");
        exists = fs.existsSync(guildPath);
        db = exists ? JSON.parse(fs.readFileSync(guildPath, "utf-8")) : [];

        if (exists) {
            const ar = db.filter(arr => arr.emoji === emoji && arr.msgID === message.id);
            for (const arr of ar) {
                if (arr.roleID === role.id) return i.editReply({
                    content: `**Error!** There is already **the same setup**.\n> ✅ **Message found!**\n> ✅ **Reaction found!**\n> ✅ **Role is OK!**\n> 🛑 **Database checked!**`,
                    ephemeral: true
                });
            }
        }

        db.push(record);

        fs.writeFileSync(
            guildPath,
            JSON.stringify(db, null, 4)
        );

        console.log(i.user.tag, "from", i.guild.name, "added new reaction", emoji);
        return i.editReply({
            content: `**Setup done!**\n> ✅ **Message found!**\n> ✅ **Reaction found!**\n> ✅ **Role is OK!**\n> ✅ **Saved to the database!**`,
            ephemeral: true
        });
    } else if (sub === "remove") {
        await i.deferReply({ ephemeral: true });

        const message = i.options.getString("message");
        const emoji = i.options.getString("emoji");

        const dbPath = path.resolve("./db/");
        const guildPath = path.join(dbPath, i.guild.id + ".json");
        const exists = fs.existsSync(guildPath);

        if (exists) await i.editReply({
            content: `> ✅ **Database found!**\n> ❓ *Searching for the record...*\n> ❓ *Deleting the record...*`,
            ephemeral: true
        });
        else return i.editReply({
            content: `**Error!** You did not set any AdvancedReaction yet.\n> 🛑 **Database not found!**\n> ⭕ *Searching for the record...*\n> ⭕ *Deleting the record...*`,
            ephemeral: true
        });

        let db = JSON.parse(fs.readFileSync(guildPath, "utf-8"));
        const ar = db.find(arr => arr.emoji === emoji && arr.msgID === message);
        if (!ar) return i.editReply({
            content: `**Error!** Your query was not found.\n> ✅ **Database found!**\n> 🛑 **Record not found!**\n> ⭕ *Deleting the record...*`,
            ephemeral: true
        });

        db = db.filter(arr => !(arr.emoji === emoji && arr.msgID === message));
        fs.writeFileSync(
            guildPath,
            JSON.stringify(db, null, 4)
        );

        console.log(i.user.tag, "from", i.guild.name, "removed reaction", emoji);
        return i.editReply({
            content: `**Removal done!**\n> ✅ **Database found!**\n> ✅ **Record found!**\n> ✅ **Record deleted!**\n-# * The reactions themselves (on Discord) weren't deleted.`,
            ephemeral: true
        });
    }
}