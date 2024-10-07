import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const slash = new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete of messages")
    .addIntegerOption(option =>
        option.setName("number")
            .setDescription("Count of messages to delete")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100))
    .setContexts([0])
    .setIntegrationTypes([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setNSFW(false);

export default async function run(bot, i) {
    if (!i.member.permissions.has(PermissionFlagsBits.ManageMessages))
        return i.reply({ content: `🛑 You don't have **Manage Messages permission**!`, ephemeral: true });

    if (!i.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages))
        return i.reply({ content: `🛑 I don't have **Manage Messages permission**!`, ephemeral: true });

    if (!i.channel.viewable)
        return i.reply({ content: `🛑 I don't have **access to this channel**!`, ephemeral: true });

    await i.deferReply({ ephemeral: true });

    const deletedMessages = await i.channel.bulkDelete(i.options.getInteger("number"), true);

    i.editReply({ content: `✅ **Deleted \`${deletedMessages.size}\` messages!**`, ephemeral: true });
}