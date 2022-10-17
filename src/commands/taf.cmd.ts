import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
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

  @Slash({ description: "Get a TAF report." })
  async taf(
    @SlashOption({
      name: "airport",
      description: "ICAO or IATA code of an airport",
      type: ApplicationCommandOptionType.String,
      required: true
    })
    ident: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply();

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
    }).addFields({
      name: airport.name,
      value: `Location: ${airport.city}, ${airport.country}
      Elevation: ${airport.elevation_ft} ft. MSL`
    }, {
      name: "Time",
      value: `Report time: ${moment(taf.time.dt).utc().format("MMM Do, HHmm")}Z
      Valid from ${moment(taf.start_time?.dt).format("MMM Do, HHmm")}Z
      To ${moment(taf.end_time?.dt).format("MMM Do, HHmm")}Z`
    },
    ...decodeTaf(taf),
    { name: "Raw", value: `\`\`\`\n${taf.raw}\`\`\`` })
    .setTimestamp(new Date());

    interaction.followUp({ embeds: [embed] });
  }
}