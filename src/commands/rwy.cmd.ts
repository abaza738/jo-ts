import axios from "axios";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { constants } from "../common/constants.js";
import { embedFactory, handleError } from "../common/utils.js";

function getActiveRunways(runways: any[], windDirection: number) {
  const result = [];
  for (const runway of runways) {
    const RWY_HDG = [runway.bearing1, runway.bearing2];
    for (let i = 0; i < 2; i++) {
      const left =
        (RWY_HDG[i] - 80) % 360 < 0
          ? ((RWY_HDG[i] - 80) % 360) + 360
          : (RWY_HDG[i] - 80) % 360;
      const right = (RWY_HDG[i] + 80) % 360;
      if (
        (windDirection >= left && windDirection <= right && left <= right) ||
        ((windDirection >= left || windDirection <= right) && left > right)
      )
        result.push(runway[`ident${i + 1}`]);
    }
  }
  return result;
}

@Discord()
export abstract class ActiveRWY {
  @Slash({ description: "Find the active runway of an airport." })
  async rwy(
    @SlashOption({
      name: "airport",
      description: "ICAO or IATA code of an airport",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    icao: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply();

    const url = `${constants.AVWX.URLS.AIRPORT_INFO}${icao}`;
    axios
      .get(url, constants.AVWX.HEADERS)
      .then((airportData: any) => {
        const runways = airportData.data?.runways;
        if (!runways) {
          interaction.followUp(
            `Couldn't get runway information for ${icao.toUpperCase()}.`
          );
          return;
        }
        axios
          .get(`${constants.AVWX.URLS.METAR}${icao}`, constants.AVWX.HEADERS)
          .then((metar: any) => {
            metar = metar.data;
            if (!metar)
              throw new Error(`Coudn't fetch METAR for ${icao.toUpperCase()}.`);

            let wind_direction = metar.wind_direction.value;
            if (metar.wind_speed.value < 3) {
              interaction.followUp({
                embeds: [
                  embedFactory({
                    title: `Wind calm at ${icao.toUpperCase()}!`,
                    interaction: interaction,
                    description: `Wind is relatively calm, nothing much to say about active runways.`,
                    footer: {
                      text: "Fetched from AVWX",
                      iconURL: constants.AVWX.URLS.ICON,
                    },
                  }).addFields({
                    name: "Reported Wind",
                    value: `${metar.wind_direction.repr}° at ${metar.wind_speed.value}${metar.units.wind_speed}`,
                  }),
                ],
              });
              return;
            }
            // Here goes the actual logic..
            const pref = getActiveRunways(runways, wind_direction);

            if (pref.length) {
              pref.sort();
              const embed = embedFactory({
                interaction: interaction,
                title: `Active Runways - ${icao.toUpperCase()}`,
                description: `**${pref.join(", ")}**`,
                footer: {
                  text: "Fetched from AVWX. Calculation does not take into account local SOP",
                  iconURL: constants.AVWX.URLS.ICON,
                },
              }).addFields({
                name: "Current Wind",
                value: `${metar.wind_direction.repr}° at ${metar.wind_speed.value}${metar.units.wind_speed}`,
              });
              interaction.followUp({ embeds: [embed] });
            } else {
              interaction.followUp(
                `Either there's a straight crosswind, or I can't get it done.`
              );
            }
          })
          .catch((err) => handleError(err, interaction));
      })
      .catch((err) => handleError(err, interaction));
  }
}
