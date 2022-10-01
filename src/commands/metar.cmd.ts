import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import Avwx from "../common/Avwx.js";
import { constants } from "../common/constants.js";
import { decodeMetar } from "../common/decode-metar.js";
import { embedFactory, handleError } from "../common/utils.js";
import { Airport } from "../models/airport.model.js";
import { Metar } from "../models/metar.model.js";

@Discord()
export abstract class MetarCommand {
  @Slash({ description: 'Get a METAR report.' })
  async metar(
    @SlashOption({
      name: 'airport',
      description: 'ICAO or IATA code of an airport',
      type: ApplicationCommandOptionType.String,
      required: true
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
    }).addFields(
      { name: airport.name, value: `Location: ${airport.city}, ${airport.country}, Elevation: ${airport.elevation_ft} ft. MSL`},
      { name: "Decoded", value: decodeMetar(metar) }
    );

    if (metar.remarks_info?.codes?.length) {
      embed.addFields({ name: "Remarks", value: `${metar.remarks_info.codes.map((remark: any) => remark.value).join("\n")}`});
    }

    embed
      .addFields({ name: "Raw", value: `\`\`\`\n${metar.raw}\`\`\``})
      .setTimestamp(new Date());

    interaction.reply({ embeds: [embed] });
  }
}
