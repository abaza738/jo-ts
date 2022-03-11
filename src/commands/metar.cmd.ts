import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import Avwx from "../common/Avwx.js";
import { constants } from "../common/constants.js";
import { decodeMetar } from "../common/decode-metar.js";
import { embedFactory, handleError } from "../common/utils.js";
import { Airport } from "../models/airport.model.js";
import { Metar } from "../models/metar.model.js";

@Discord()
export abstract class MetarCommand {
  @Slash("metar", { description: "Get a METAR report." })
  async metar(
    @SlashOption("airport", {
      description: "ICAO or IATA code of an airport",
      type: "STRING",
    })
    ident: string,
    interaction: CommandInteraction
  ): Promise<void> {

    let airport: Airport | undefined, metar: Metar | undefined;

    try {
      [airport, metar] = await Promise.all([Avwx.info(ident), Avwx.metar(ident)]);
    } catch (err) {
      handleError(err, interaction);
      return;
    }

    if (!airport || !metar) {
      handleError(`Could not retrieve data for ${ident.toUpperCase()}`, interaction);
      return;
    }
    
    const embed = embedFactory({
      interaction: interaction,
      title: `${ident.toUpperCase()} METAR`,
      footer: {
        text: `Fetched from AVWX`,
        iconURL: constants.AVWX.URLS.ICON,
      },
    }).addField(
      airport.name,
      `Location: ${airport.city}, ${airport.country}
      Elevation: ${airport.elevation_ft} ft. MSL`
    );

    embed.addField(
      "Decoded",
      decodeMetar(metar)
    );

    if (metar.remarks_info?.codes?.length) {
      embed.addField(
        "Remarks",
        `${metar.remarks_info.codes
          .map((remark: any) => remark.value)
          .join("\n")}`
      );
    }

    embed
      .addField("Raw", `\`\`\`\n${metar.raw}\`\`\``)
      .setTimestamp(new Date());

    interaction.reply({ embeds: [embed] });
  }
}
