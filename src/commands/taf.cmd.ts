import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import moment from "moment";
import Avwx from "../common/Avwx.js";
import { constants } from "../common/constants.js";
import { decodeTaf } from "../common/decode-taf.js";
import { embedFactory, handleError } from "../common/utils.js";
import { Airport } from "../models/airport.model.js";
import { Taf } from "../models/taf.model.js";

@Discord()
export abstract class TafCommand {

  @Slash("taf", { description: "Get a TAF report." })
  async taf(
    @SlashOption("airport", {
      description: "ICAO or IATA code of an airport",
      type: "STRING",
    })
    ident: string,
    interaction: CommandInteraction
  ): Promise<void> {
    let airport: Airport | undefined, taf: Taf | undefined;

    try {
      [airport, taf] = await Promise.all([Avwx.info(ident), Avwx.taf(ident)]);
    } catch (err) {
      handleError(err, interaction);
      return;
    }

    if (!airport || !taf) {
      handleError(`Could not retrueve data for ${ident.toUpperCase()}`, interaction);
      return;
    }

    const embed = embedFactory({
      interaction: interaction,
      title: `${ident.toUpperCase()} TAF`,
      footer: {
        text: `Fetched from AVWX`,
        iconURL: constants.AVWX.URLS.ICON
      }
    }).addField(
      airport.name,
      `Location: ${airport.city}, ${airport.country}
      Elevation: ${airport.elevation_ft} ft. MSL`
    ).addField(
      "Time",
      `Report time: ${moment(taf.time.dt).utc().format("MMM Do, HHmm")}Z
      Valid from ${moment(taf.start_time?.dt).format("MMM Do, HHmm")}Z
      To ${moment(taf.end_time?.dt).format("MMM Do, HHmm")}Z`
    );

    embed.addFields(
      decodeTaf(taf)
    );

    embed.addField("Raw", `\`\`\`\n${taf.raw}\`\`\``).setTimestamp(new Date());

    interaction.reply({ embeds: [embed] });
  }
}