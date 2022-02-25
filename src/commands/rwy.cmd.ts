import axios from "axios";
import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { constants, embedFactory, handleError } from "../common/utils.js";

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
  @Slash("rwy", { description: "Find the active runway of an airport." })
  async rwy(
    @SlashOption("airport", {
      description: "ICAO or IATA code of an airport",
      type: "STRING",
    })
    icao: string,
    interaction: CommandInteraction
  ): Promise<void> {
    const url = `${constants.AIRPORT_INFO_API_URL}${icao}`;
    axios
      .get(url, constants.AVWX_HEADERS)
      .then((airportData: any) => {
        const runways = airportData.data?.runways;
        if (!runways) {
          interaction.reply(
            `Couldn't get runway information for ${icao.toUpperCase()}.`
          );
          return;
        }
        axios
          .get(`${constants.METAR_API_URL}${icao}`, constants.AVWX_HEADERS)
          .then((metar: any) => {
            metar = metar.data;
            if (!metar)
              throw new Error(`Coudn't fetch METAR for ${icao.toUpperCase()}.`);

            let wind_direction = metar.wind_direction.value;
            if (metar.wind_speed.value < 3) {
              interaction.reply({
                embeds: [
                  embedFactory({
                    title: `Wind calm at ${icao.toUpperCase()}!`,
                    interaction: interaction,
                    description: `Wind is relatively calm, nothing much to say about active runways.`,
                    footer: {
                      text: "Fetched from AVWX",
                      iconURL: constants.AVWX_ICON_URL,
                    },
                  }).addField(
                    "Reported Wind",
                    `${metar.wind_direction.repr}° at ${metar.wind_speed.value}${metar.units.wind_speed}`
                  ),
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
                  iconURL: constants.AVWX_ICON_URL,
                },
              }).addField(
                "Current Wind",
                `${metar.wind_direction.repr}° at ${metar.wind_speed.value}${metar.units.wind_speed}`
              );
              interaction.reply({ embeds: [embed] });
            } else {
              interaction.reply(
                `Either there's a straight crosswind, or I can't get it done.`
              );
            }
          })
          .catch((err) => handleError(err, interaction));
      })
      .catch((err) => handleError(err, interaction));
  }
}
