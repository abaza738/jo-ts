import { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import moment from "moment";
import { embedFactory } from "../common/utils.js";
// @ts-ignore
// import * as packageJson from "../../package.json";

@Discord()
export abstract class Info {
  @Slash('info', { description: 'General information about the bot' })
  async info(interaction: CommandInteraction) {

    // Temporary solution until I figure out what's wrong with importing package.json
    const pkg = {
      name: "Jo Bot",
      description: "DiscordTS Bot for Jordanian Aviators server.",
      repository: {
        url: "https://github.com/abaza738/jo-ts"
      },
      author: "Maher Abaza",
      version: "1.0.5"
    };

    const embed = embedFactory({
      title: `General information about ${pkg.name}`,
      interaction: interaction,
      description: `${pkg.description}`
    })
    .addField(`Servers`, `${interaction.client.guilds.cache.size}`, true)
    .addField(`Up Time`, `${moment.duration(interaction.client.uptime, "milliseconds").humanize()}`, true)
    .addField(`Members`, `${interaction.client.guilds.cache.reduce((acc: number, value) => acc + value.memberCount, 0)}`, true)
    .addField(`Invite`, `[Invite Jo Bot to your server!](https://ptb.discord.com/api/oauth2/authorize?client_id=781557275235188766&permissions=8&scope=bot%20applications.commands)`, true)
    .addField(`Contribute`, `Submit issues and contribute to the bot's developmen on [GitHub](${pkg.repository.url})!`)
    .addField(`Version`, `${pkg.version}`)
    .setFooter({ text: `Made by ${pkg.author}`, iconURL: `https://webstockreview.net/images/github-icon-png-8.png` });

    interaction.reply({ embeds: [embed] });
  }
}
