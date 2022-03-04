import { AutocompleteInteraction, CommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import moment from "moment";
import POSCON from "../common/POSCON.js";
import { constants, embedFactory, flightStatus, getAutocompleteOptions, handleError, KHzToMHz, toZuluTime } from "../common/utils.js";
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
      }z - ${toZuluTime(uATC.end)}: **${
        uATC.telephony ?? uATC.position
      }**`
    }).join('\n') ?? 'No Upcoming ATC!')
    .addField("Last updated", `<t:${moment(onlineData?.lastUpdated).unix()}:R>`)

    interaction.reply({ embeds: [embed] });
  }

  @Slash('flight', { description: 'Get details of an online flight on POSCON'})
  @SlashGroup('poscon')
  async flight(
    @SlashOption('callsign', {
      autocomplete: async (autocomplete: AutocompleteInteraction) => getAutocompleteOptions(autocomplete),
      type: "STRING"
    })
    callsign: string,
    interaction: CommandInteraction
  ) {

    let online: POSCONOnline | undefined;

    try {
      online = await POSCON.online();
    } catch (err) {
      handleError(err, interaction);
      return;
    }

    if (!online) {
      handleError(`Could not fetch POSCON online activity!`, interaction);
    }

    const selectedFlight = online?.flights.find(f => f.callsign.toUpperCase() === callsign.toUpperCase());

    if (!selectedFlight) {
      handleError(`Could not fetch flight ${callsign.toUpperCase()}!`, interaction);
      return;
    }

    const embed = embedFactory({
      title: `Flight ${selectedFlight.callsign.toUpperCase()}`,
      interaction: interaction,
      color: constants.POSCON.COLOR,
      footer: {
        text: `Fetched from POSCON API by Syam Haque`,
        iconURL: constants.POSCON.LOGO
      }
    })
    .addField("A/C Type", selectedFlight.ac_type, true)
    .addField("ALT", `${Math.round(selectedFlight.position.pressure_alt)} ft. MSL`, true)
    .addField("HDG", `${Math.round(selectedFlight.position.true_hdg)}°`, true)
    .addField("GS", `${Math.round(selectedFlight.position.gs_kt)}kts.`, true);

    if (selectedFlight.freq) {
      embed
      .addField("VHF1", `${KHzToMHz(+selectedFlight.freq.vhf1) ?? '--'} MHz`, true)
      .addField("VHF2", `${KHzToMHz(+selectedFlight.freq.vhf2) ?? '--'} MHz`, true)
    }

    embed.addField("Status", await flightStatus(selectedFlight));

    if (selectedFlight.flightplan) {
      embed
      .addField(
        "Time",
        `Scheduled Time of Departure ${toZuluTime(selectedFlight.flightplan.std!)}
        ${ selectedFlight.flightplan.atd ? `Actual Time of Departure ${toZuluTime(selectedFlight.flightplan.atd)}` : ''}
        Estimed time enroute ${selectedFlight.flightplan.eet}.
        Scheduled Time of Arrival ${toZuluTime(selectedFlight.flightplan.sta!)}`
      )
      .addField("Route", `**${selectedFlight.flightplan.dep}** → **${selectedFlight.flightplan.dest}**\`\`\`\n${selectedFlight.flightplan.route}\`\`\``)
      .addField("PAX", `${selectedFlight.flightplan.persons} passengers onboard.`);
    } else {
      embed
      .addField("Flight Plan", "No active flight plan correlated to this target.");
    }
    embed.addField("PIC", `[${selectedFlight.userName}](${constants.POSCON.URLS.PROFILE}${selectedFlight.userId})`);

    interaction.reply({ embeds: [embed] });
    
  }
}

