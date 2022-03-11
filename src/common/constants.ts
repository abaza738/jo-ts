import { ColorResolvable } from "discord.js";

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
    URLS: {
      PROFILE: "https://hq.poscon.net/profile/",
      ONLINE: "https://hqapi.poscon.net/online.json"
    },
    COLOR: "#1e1933" as ColorResolvable,
    LOGO: "https://i.imgur.com/oUxG3F8.png"
  },
  VATSIM: {
    URLS: {
      ONLINE: "https://data.vatsim.net/v3/vatsim-data.json"
    }
  }
};