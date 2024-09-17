import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";

export const slash = new SlashCommandBuilder()
    .setName("ar")
    .setDescription("Edit Advanced Reactions system")
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription("Setup a new reaction role system")
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
            .addStringOption(option =>
                option.setName("welcome")
                    .setDescription("Message sent to the member after adding the reaction")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("goodbye")
                    .setDescription("Message sent to the member after removing the reaction")
                    .setRequired(false))
            .addIntegerOption(option =>
                option.setName("limit")
                    .setDescription("Limit of users to claim the role")
                    .setRequired(false))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription("Setup a new reaction role automation")
            .addStringOption(option =>
                option.setName("message")
                    .setDescription("Message ID")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("emoji")
                    .setDescription("Emoji of the reaction")
                    .setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setNSFW(false);

export default async function run(bot, i) {
    const sub = i.options._subcommand;

    if (sub === "setup") {
        await i.deferReply({ ephemeral: true });

        const channel = i.options.getChannel("channel");
        let message = i.options.getString("message");
        const emoji = i.options.getString("emoji");
        const role = i.options.getRole("role");
        const welcome = i.options.getString("welcome");
        const goodbye = i.options.getString("goodbye");
        const limit = i.options.getInteger("limit");

        if (![0, 5, 11, 12].includes(channel.type))
            return i.editReply({ content: `🛑 Channel <#${channel.id}> is **not a text type**! There are no messages.`, ephemeral: true });

        if (!channel.viewable)
            return i.editReply({ content: `🛑 I don't have **access to <#${channel.id}>**!`, ephemeral: true });

        message = await channel.messages.fetch(message);

        if (!message)
            return i.editReply({ content: `🛑 Message was **not found** in <#${channel.id}>! Did you enter the correct ID?`, ephemeral: true });
        else
            i.editReply({
                content: `> ✅ **Message found!**\n> ❓ *Searching for the reaction...*\n> ❓ *Checking the role...*\n> ❓ *Booting the database...*`,
                ephemeral: true
            });

        if (message.reactions.cache.has(emoji)) {
            i.editReply({
                content: `> ✅ **Message found!**\n> ✅ **Reaction found!**\n> ❓ *Checking the role...*\n> ❓ *Booting the database...*`,
                ephemeral: true
            });
        } else {
            message.react(emoji)
                .then(() =>
                    i.editReply({
                        content: `> ✅ **Message found!**\n> ✅ **Reaction added!**\n> ❓ *Checking the role...*\n> ❓ *Booting the database...*`,
                        ephemeral: true
                    })
                ).catch((e) => {
                    console.error(e);
                    return i.editReply({
                        content: `**Error!** I don't have permission to add reaction.\n> ✅ **Message found!**\n> 🛑 **Reaction could not be added!**\n> ⭕ *Checking the role...*\n> ⭕ *Booting the database...*`,
                        ephemeral: true
                    });
                });
        }

        if (!role.editable)
            return i.editReply({
                content: `**Error!** Unable to assign the role.\nCheck my permission and my role position to be above this role.\n> ✅ **Message found!**\n> ✅ **Reaction found!**\n> 🛑 **Cannot assign this role!**\n> ⭕ *Booting the database...*`,
                ephemeral: true
            });
        else
            i.editReply({
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
            "welcome": welcome || `🟢 You have received **{role}** role on the **{guild}**!`,
            "goodbye": goodbye || `🔴 You don't have **{role}** role on the **{guild}** any more.`,
            "uses": 0,
            "limit": parseInt(limit)
        };

        dbPath = path.resolve("./db/");
        guildPath = path.join(dbPath, i.guild.id + ".json");
        exists = fs.existsSync(guildPath);
        db = exists ? JSON.parse(fs.readFileSync(guildPath, "utf-8")) : [];

        if (exists) {
            const ar = db.filter(arr => arr.emoji === r.emoji.name && arr.msgID === message.id);
            for (const arr of ar) {
                if (arr.roleID === role.id) return i.editReply({
                    content: `**Error!** There is already same setup. > ✅ **Message found!**\n> ✅ **Reaction found!**\n> ✅ **Role is OK!**\n> 🛑 **Database checked!**`,
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
        return await i.editReply({
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

        if (exists) i.editReply({
            content: `> ✅ **Database found!**\n> ❓ *Searching for the record...*\n> ❓ *Deleting the record...*`,
            ephemeral: true
        });
        else return i.editReply({
            content: `**Error!** You did not set any AdvancedReaction yet.\n> 🛑 **Database not found!**\n> ⭕ *Searching for the record...*\n> ⭕ *Deleting the record...*`,
            ephemeral: true
        });

        const db = JSON.parse(fs.readFileSync(guildPath, "utf-8"));
        const ar = db.find(arr => arr.emoji === emoji && arr.msgID === message);
        if (!ar) return i.editReply({
            content: `**Error!** Your query was not found.\n> ✅ **Database found!**\n> 🛑 **Record not found!**\n> ⭕ *Deleting the record...*`,
            ephemeral: true
        });

        db.pop(ar);
        fs.writeFileSync(
            guildPath,
            JSON.stringify(db, null, 4)
        );

        console.log(i.user.tag, "from", i.guild.name, "removed reaction", emoji);
        return await i.editReply({
            content: `**Removal done!**\n> ✅ **Database found!**\n> ✅ **Record found!**\n> ✅ **Record deleted!**`,
            ephemeral: true
        });
    }
}