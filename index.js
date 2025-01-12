console.log("AdvancedReactions started!");

import fs from "fs/promises"
const packageJson = JSON.parse(await fs.readFile("./package.json"))

import dotenv from "dotenv";
dotenv.config();

import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";

let bot = new Client({
    partials: [
        Partials.User,
        Partials.Reaction,
        Partials.Message
    ],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ]
});

bot.commands = new Collection();
bot.events = 0;
bot.AR = new Object();
bot.version = packageJson.version;

bot.AR.color = "#89c853";

import setupHandlers from "./src/functions/handlers.js";
setupHandlers(bot);

bot.login(process.env.token);

export { bot };