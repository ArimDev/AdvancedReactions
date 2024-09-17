import fs from "fs";
import path from "path";


export default async function handlers(bot) {
    const eventsFolder = fs.readdirSync(path.resolve("./src/events")).filter(file => file.endsWith(".js"));
    for (const file of eventsFolder) {
        const eventFile = await import(`../events/${file}`);
        const event = file.split(".")[0];
        bot.on(event, (...args) => {
            eventFile.default(bot, ...args);
        });
        bot.events++;
    }

    let commands = [];
    const commandsFolder = fs.readdirSync(path.resolve("./src/commands")).filter(file => file.endsWith(".js"));
    for (const file of commandsFolder) {
        const commandFile = await import(`../commands/${file}`);
        const command = file.split(".")[0];
        function registerCommand(cmd, cmdFile) {
            bot.commands.set(cmd, cmdFile);
            commands.push(cmdFile.slash.toJSON());
        }
        let cmdName = command;
        if (commandFile.context) cmdName = command.split("_")[1].toLowerCase();
        registerCommand(cmdName, commandFile);
    };;
}