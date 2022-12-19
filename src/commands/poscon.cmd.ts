import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  CommandInteraction
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import moment from "moment";
import { constants } from "../common/constants.js";
import POSCON from "../common/POSCON.js";
import {
  embedFactory,
  flightStatus,
  handleError,
  KHzToMHz,
  toZuluTime
} from "../common/utils.js";
import { POSCONOnline } from "../models/poscon/online.js";

@Discord()
@SlashGroup({ name: "poscon", description: "POSCON commands!" })
export abstract class POSCONCommand {
  @Slash({
    name: "online",
    description: "Get online activity brief for POSCON",
  })
  @SlashGroup("poscon")
  async poscon(interaction: CommandInteraction) {
    await interaction.deferReply();

    let onlineData: POSCONOnline | undefined;
    try {
      onlineData = await POSCON.online();
    } catch (err) {
      handleError(err, interaction);
      return;
    }

    if (!onlineData) {
      handleError(`Could not fetch online POSCON data!`, interaction);
      return;
    }

    const upcomingAtc = onlineData.upcomingAtc.length ? onlineData.upcomingAtc
      .slice(0, 5)
      .map(
        (uATC) =>
          `${moment(uATC.start)
          .utc()
          .format("Do | HHmm")}z - ${toZuluTime(uATC.end)}: **${uATC.telephony ?? uATC.position}**`
      )
      .join("\n") : "No Upcoming ATC!";

    const embed = embedFactory({
      title: `POSCON Online Activity`,
      interaction: interaction,
      color: constants.POSCON.COLOR,
      footer: {
        text: "Fetched from POSCON API By Syam Haque",
        iconURL: constants.POSCON.LOGO,
      },
    })
      .setThumbnail(constants.POSCON.LOGO)
      .addFields([
        {
          name: "Pilots",
          value: `${onlineData.totalPilots ?? 0}`,
          inline: true,
        },
        { name: "ATC", value: `${onlineData.totalAtc ?? 0}`, inline: true },
        {
          name: "Upcoming ATC",
          value: upcomingAtc,
        },
        {
          name: "Last updated",
          value: `<t:${moment(onlineData.lastUpdated).unix()}:R>`,
        }
      ]);
    interaction.followUp({ embeds: [embed] });
  }

  @Slash({
    name: "flight",
    description: "Get details of an online flight on POSCON",
  })
  @SlashGroup("poscon")
  async flight(
    @SlashOption({
      name: "callsign",
      description: "The callsign of the flight (choose from the list)",
      autocomplete: async (autocomplete: AutocompleteInteraction) =>
        POSCON.getFlightAutocompleteOptions(autocomplete),
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    callsign: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    let online: POSCONOnline | undefined;

    try {
      online = await POSCON.online();
    } catch (err) {
      handleError(err, interaction);
      return;
    }

    if (!online) {
      handleError(`Could not fetch POSCON online activity!`, interaction);
      return;
    }

    const selectedFlight = online?.flights.find(
      (f) => f.callsign.toUpperCase() === callsign.toUpperCase()
    );

    if (!selectedFlight) {
      handleError(
        `Could not fetch flight ${callsign.toUpperCase()}!`,
        interaction
      );
      return;
    }

    const embed = embedFactory({
      title: `Flight ${selectedFlight.callsign.toUpperCase()}`,
      interaction: interaction,
      color: constants.POSCON.COLOR,
      footer: {
        text: `Fetched from POSCON API by Syam Haque`,
        iconURL: constants.POSCON.LOGO,
      },
    }).addFields(
      { name: "A/C Type", value: selectedFlight.ac_type, inline: true },
      {
        name: "ALT",
        value: `${Math.round(selectedFlight.position.pressure_alt)} ft. MSL`,
        inline: true,
      },
      {
        name: "HDG",
        value: `${Math.round(selectedFlight.position.true_hdg)}°`,
        inline: true,
      },
      {
        name: "GS",
        value: `${Math.round(selectedFlight.position.gs_kt)}kts.`,
        inline: true,
      }
    );

    if (selectedFlight.freq) {
      embed.addFields(
        {
          name: "VHF1",
          value: `${KHzToMHz(+selectedFlight.freq.vhf1) ?? "--"} MHz`,
          inline: true,
        },
        {
          name: "VHF2",
          value: `${KHzToMHz(+selectedFlight.freq.vhf2) ?? "--"} MHz`,
          inline: true,
        }
      );
    }

    embed.addFields({
      name: "Status",
      value: await flightStatus(selectedFlight),
    });

    if (selectedFlight.flightplan) {
      embed.addFields(
        {
          name: "Time",
          value: `Scheduled Time of Departure ${toZuluTime(
            selectedFlight.flightplan.std!
          )}
        ${
          selectedFlight.flightplan.atd
            ? `Actual Time of Departure ${toZuluTime(
                selectedFlight.flightplan.atd
              )}`
            : ""
        }
        Estimed time enroute ${selectedFlight.flightplan.eet}.
        Scheduled Time of Arrival ${toZuluTime(
          selectedFlight.flightplan.sta!
        )}`,
        },
        {
          name: "Route",
          value: `**${selectedFlight.flightplan.dep}** → **${selectedFlight.flightplan.dest}**\`\`\`\n${selectedFlight.flightplan.route}\`\`\``,
        },
        {
          name: "PAX",
          value: `${selectedFlight.flightplan.persons} passengers onboard.`,
        }
      );
    } else {
      embed.addFields({
        name: "Flight Plan",
        value: "No active flight plan correlated to this target.",
      });
    }
    embed.addFields({
      name: "PIC",
      value: `[${selectedFlight.userName}](${constants.POSCON.URLS.PROFILE}${selectedFlight.userId})`,
    });

    interaction.followUp({ embeds: [embed] });
  }
}
