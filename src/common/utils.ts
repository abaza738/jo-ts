import {
  ColorResolvable,
  CommandInteraction,
  EmbedAuthorData,
  EmbedFooterData,
  MessageEmbed,
} from "discord.js";

interface EmbedOptions {
  interaction: CommandInteraction;
  title: string;
  description?: string;
  color?: ColorResolvable;
  footer?: EmbedFooterData;
}

export const constants = {
  DISCORD_CDN_AVATAR_URL: "https://cdn.discordapp.com/avatars",
  AVWX: {
    URLS: {
      AIRPORT_INFO: "https://avwx.rest/api/station/",
      METAR: "https://avwx.rest/api/metar/",
      TAF: "https://avwx.rest/api/taf/",
      ICON: "https://avwx.rest/static/favicons/apple-touch-icon.png",
    },
    HEADERS: {
      params: {
        token: process.env.AVWX_TOKEN,
      },
    }
  },
  POSCON: {
    API: {
      ONLINE: "https://hqapi.poscon.net/online.json"
    },
    COLOR: "#1e1933" as ColorResolvable,
    LOGO: "https://i.imgur.com/oUxG3F8.png"
  }
};

export function generateEmbedAuthor(
  interaction: CommandInteraction
): EmbedAuthorData {
  return {
    name: interaction.user.username,
    iconURL: `${constants.DISCORD_CDN_AVATAR_URL}/${interaction.user.id}/${interaction.user.avatar}`,
  };
}

export function handleError(err: any, interaction: CommandInteraction): void {
  interaction.reply({
    embeds: [
      embedFactory({
        interaction: interaction,
        title: `Error`,
        color: "RED",
      }).addField(
        err.response?.data?.error ?? `Description`,
        err.response?.data?.help ?? err.message ?? err ?? `Unknown error occurred.`
      ),
    ],
  });
}

export function embedFactory(options: EmbedOptions): MessageEmbed {
  const embed = new MessageEmbed()
    .setTitle(options.title)
    .setAuthor(generateEmbedAuthor(options.interaction))
    .setTimestamp(new Date());
  if (options.description) embed.setDescription(options.description);
  if (options.footer) embed.setFooter(options.footer);
  if (options.color) embed.setColor(options.color);

  return embed;
}
