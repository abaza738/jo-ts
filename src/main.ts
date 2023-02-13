import { dirname, importx } from "@discordx/importer";
import { Koa } from "@discordx/koa";
import { YTDLPlayerPlugin } from "@discordx/plugin-ytdl-player";
import { IntentsBitField, Interaction, Message } from "discord.js";
import { Client, MetadataStorage } from "discordx";
import dotenv from "dotenv";
import moment from "moment";
import "reflect-metadata";

dotenv.config();

const ytdlPlugin = new YTDLPlayerPlugin({ metadata: MetadataStorage.instance });

export const client = new Client({
  simpleCommand: {
    prefix: "?",
  },
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
  ],
  // If you only want to use global commands only, comment this line
  // botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
  plugins: [ytdlPlugin],
});


client.once("ready", async () => {
  // make sure all guilds are in cache
  await client.guilds.fetch();
  client.user?.setActivity({ type: 2, name: '128.500 MHz' });

  // init all application commands
  await client.initApplicationCommands();

  client.guilds.cache.each(guild => {
    console.log(`- ${guild.name}`);
    console.log(`\tJoined ${moment(guild.joinedAt).format('MMM Do, YYYY')}`);
    console.log(`\t${guild.memberCount} members.`);
  });

  console.log("Bot started");
});

client.on("interactionCreate", (interaction: Interaction) => {
  client.executeInteraction(interaction);
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
