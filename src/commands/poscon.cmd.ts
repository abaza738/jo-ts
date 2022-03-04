import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import moment from "moment";
import POSCON from "../common/POSCON.js";
import { constants, embedFactory, handleError } from "../common/utils.js";
import { POSCONOnline } from "../models/poscon/online.js";

@Discord()
@SlashGroup({ name: 'poscon' })
export abstract class POSCONCommand {

  @Slash('online', { description: 'Get online activity brief for POSCON' })
  @SlashGroup('poscon')
  async poscon(interaction: CommandInteraction) {
    let onlineData: POSCONOnline | undefined;
    try {
      onlineData = await POSCON.online();
    } catch (err) {
      handleError(err, interaction)
    }

    if (!onlineData) {
      handleError(`Could not fetch online POSCON data!`, interaction);
    }

    const embed = embedFactory({
      title: `POSCON Online Activity`,
      interaction: interaction,
      color: constants.POSCON.COLOR,
      footer: {
        text: "Fetched from POSCON API By Syam Haque",
        iconURL: constants.POSCON.LOGO
      }
    })
    .setThumbnail(constants.POSCON.LOGO)
    .addField("Pilots", `${onlineData?.totalPilots ?? 0}`, true)
    .addField("ATC", `${onlineData?.totalAtc ?? 0}`, true)
    .addField("Upcoming ATC", onlineData?.upcomingAtc.slice(0,5).map(uATC => {
      return `${
        moment(uATC.start).utc().format("Do | HHmm")
      }z - ${
        moment(uATC.end).utc().format("HHmm")
      }z: **${
        uATC.telephony ?? uATC.position
      }**`
    }).join('\n') ?? 'No Upcoming ATC!')
    .addField("Last updated", `<t:${moment(onlineData?.lastUpdated).unix()}:R>`)

    interaction.reply({ embeds: [embed] });
  }
}