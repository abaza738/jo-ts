import { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import moment from "moment";
import { embedFactory } from "../common/utils.js";
import fs from 'fs';

@Discord()
export abstract class Info {
  private readonly packageLocation: string = process.env.npm_package_json!;
  private packageJson: Record<string, any> = {};

  constructor() {
    if (typeof this.packageLocation !== 'string') {
      return;
    }
    const fileByteArray = fs.readFileSync(this.packageLocation, 'utf8');
    this.packageJson = JSON.parse(fileByteArray);
  }

  @Slash({ description: 'General information about the bot' })
  async info(interaction: CommandInteraction) {

    if (!this.packageJson.name || !this.packageJson.description || !this.packageJson.version) {
      await interaction.reply('Oepsie! Something went wrong.');

      setTimeout(() => interaction.deleteReply(), 10e3);
      return;
    }

    const embed = embedFactory({
      title: `General information about ${this.packageJson.name}`,
      interaction: interaction,
      description: `${this.packageJson.description}`
    })
    .addFields(
      { name: `Servers`, value: `${interaction.client.guilds.cache.size}`, inline: true},
      { name: `Up Time`, value: `${moment.duration(interaction.client.uptime, "milliseconds").humanize()}`, inline: true},
      { name: `Members`, value: `${interaction.client.guilds.cache.reduce((acc: number, value) => acc + value.memberCount, 0)}`, inline: true},
      { name: `Invite`, value: `[Invite Jo Bot to your server!](https://ptb.discord.com/api/oauth2/authorize?client_id=781557275235188766&permissions=8&scope=bot%20applications.commands)`, inline: true},
      { name: `Contribute`, value: `Submit issues and contribute to the bot's developmen on [GitHub](${this.packageJson.repository.url})!`},
      { name: `Version`, value: `${this.packageJson.version}`},
    )
    .setFooter({ text: `Made by ${this.packageJson.author}`, iconURL: `https://webstockreview.net/images/github-icon-png-8.png` });

    await interaction.reply({ embeds: [embed] });
  }
}
