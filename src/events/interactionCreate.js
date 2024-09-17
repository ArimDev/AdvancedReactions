import { InteractionType } from "discord.js";

export default async function (bot, i) {
    if (i.type === InteractionType.ApplicationCommand) {
        const command = bot.commands.get(i.commandName);
        if (command)
            try {
                command.default(bot, i);
            } catch (e) {
                i.reply({ content: `🛑 Unexpected error! Sorry...`, ephemeral: true })
                console.error(e);
            }
    }
}