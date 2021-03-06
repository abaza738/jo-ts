import { dirname, importx } from "@discordx/importer";
import { Koa } from "@discordx/koa";
import { IntentsBitField, Interaction, Message } from "discord.js";
import { Client } from "discordx";
import dotenv from "dotenv";
import "reflect-metadata";

dotenv.config();

export const client = new Client({
  simpleCommand: {
    prefix: "?",
  },
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates
  ],
  // If you only want to use global commands only, comment this line
  // botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
});


client.once("ready", async () => {
  // make sure all guilds are in cache
  await client.guilds.fetch();
  client.user?.setActivity({ type: 2, name: '128.500 MHz' });

  // init all application commands
  await client.initApplicationCommands({
    guild: { log: true },
    global: { log: true },
  });

  // init permissions; enabled log to see changes
  // await client.initApplicationPermissions(true);

  // uncomment this line to clear all guild commands,
  // useful when moving to global commands from guild commands
  //  await client.clearApplicationCommands(
  //    ...client.guilds.cache.map((g) => g.id)
  //  );

  console.log("Bot started");
});

client.on("interactionCreate", (interaction: Interaction) => {
  client.executeInteraction(interaction, true);
});

client.on("messageCreate", (message: Message) => {
  client.executeCommand(message, { forcePrefixCheck: true, log: true });
});

async function run() {
  await importx(
    dirname(import.meta.url) + "/{events,commands,api}/**/*.{ts,js}"
  );

  // let's start the bot
  if (!process.env.BOT_TOKEN) {
    throw Error("Could not find BOT_TOKEN in your environment");
  }
  await client.login(process.env.BOT_TOKEN); // provide your bot token

  // ************* rest api section: start **********

  // api: preare server
  const server = new Koa();

  // api: need to build the api server first
  await server.build();

  // api: let's start the server now
  const port = process.env.PORT ?? 3000;
  server.listen(port, () => {
    console.log(`discord api server started on ${port}`);
    console.log(`visit localhost:${port}/guilds`);
  });

  // ************* rest api section: end **********
}

run();
