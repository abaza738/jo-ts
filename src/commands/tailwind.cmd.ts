import axios from "axios";
import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import calculateTailwind from "../common/tailwind.script.js";
import { constants, embedFactory, handleError } from "../common/utils.js";

@Discord()
export abstract class Tailwind {
  @Slash("tailwind", {
    description:
      "Calculate the tailwind component for a specific runway at a specific airport",
  })
  async tailwind(
    @SlashOption("airport", { description: "Which airport?" })
    ident: string,

    @SlashOption("runway", { description: "Which runway?" })
    runway: string,

    interaction: CommandInteraction
  ): Promise<void> {
    const airportInfoURL = constants.AIRPORT_INFO_API_URL;
    const metarURL = constants.METAR_API_URL;

    axios
      .get(airportInfoURL + ident, constants.AVWX_HEADERS)
      .then((airportData: any) => {
        if (!airportData.data && airportData.status !== 200)
          throw Error(`Could not retrieve ${ident} airport information.`);
        const airport = airportData.data;

        let RWY: { ident: string; heading: number } | undefined; // This will be the runway object we use in calculations etc.

        // Determine if the runway exists at this airport.
        for (const rwy of airport.runways) {
          if (rwy.ident1 === runway.toUpperCase()) {
            RWY = {
              ident: rwy.ident1,
              heading: rwy.bearing1,
            };
          } else if (rwy.ident2 === runway.toUpperCase()) {
            RWY = {
              ident: rwy.ident2,
              heading: rwy.bearing2,
            };
          }
        }

        if (!RWY)
          throw new Error(
            `RWY ${runway.toUpperCase()} does not exist in ${ident.toUpperCase()} airport.`
          );

        axios
          .get(metarURL + ident, constants.AVWX_HEADERS)
          .then((metarData: any) => {
            if (!metarData.data || airportData.status !== 200)
              throw Error(`Could not retrieve METAR for ${ident}.`);
            const metar = metarData.data;
            let message = "";

            const windSpeed = metar.wind_speed.value;

            if (
              (metar.units.wind_speed === "kt" && windSpeed < 5) ||
              (metar.units.wind_speed === "m/s" && windSpeed < 3)
            ) {
              message = `Wind is ${metar.wind_direction.repr} at ${windSpeed} ${metar.units.wind_speed}.`;
              interaction.reply({
                embeds: [
                  embedFactory({
                    interaction: interaction,
                    title: `Wind looks calm at ${ident.toUpperCase()}`,
                    description: message,
                    footer: {
                      text: "Fetched from AVWX",
                      iconURL: constants.AVWX_ICON_URL,
                    },
                  }),
                ],
              });
              return;
            }

            const tailwindComponent: number = calculateTailwind(metar, RWY);

            if (tailwindComponent == -1) {
              interaction.reply({
                embeds: [
                  embedFactory({
                    interaction: interaction,
                    title: `No tailwind detected for RWY ${runway.toUpperCase()} at ${ident.toUpperCase()}`,
                    description: `Wind is ${metar.wind_direction.repr} at ${windSpeed} ${metar.units.wind_speed}.`,
                    footer: {
                      text: `Fetched from AVWX`,
                      iconURL: constants.AVWX_ICON_URL,
                    },
                  }),
                ],
              });
            } else {
              interaction.reply({
                embeds: [
                  embedFactory({
                    interaction: interaction,
                    title: `Tailwind component for RWY ${runway.toUpperCase()} at ${ident.toUpperCase()}`,
                    description: `Wind is ${metar.wind_direction.repr} at ${windSpeed} ${metar.units.wind_speed}.`,
                    footer: {
                      text: `Fetched from AVWX`,
                      iconURL: constants.AVWX_ICON_URL,
                    },
                  }).addField(`Tailwind`, `${tailwindComponent}${metar.units.wind_speed}`),
                ],
              });
            }
          })
          .catch((err) => handleError(err, interaction));
      })
      .catch((err) => handleError(err, interaction));
  }
}
