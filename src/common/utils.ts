import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  ColorResolvable,
  CommandInteraction,
  EmbedAuthorData,
  EmbedFooterData,
  EmbedBuilder,
} from "discord.js";
import moment from "moment";
import { Airport } from "../models/airport.model.js";
import { AircraftPosition, Flight } from "../models/poscon/online.js";
import Avwx from "./Avwx.js";
import { constants } from "./constants.js";
import POSCON from "./POSCON.js";

interface EmbedOptions {
  title: string;
  interaction?: CommandInteraction;
  description?: string;
  color?: ColorResolvable;
  footer?: EmbedFooterData;
}

export function generateEmbedAuthor(
  interaction: CommandInteraction
): EmbedAuthorData {
  return {
    name: interaction.user.username,
    iconURL: `${constants.DISCORD_CDN_AVATAR_URL}/${interaction.user.id}/${interaction.user.avatar}`,
  };
}

export function handleError(err: any, interaction: CommandInteraction): void {
  interaction[interaction.deferred ? 'followUp' : 'reply']({
    embeds: [
      embedFactory({
        interaction: interaction,
        title: `Error`,
        color: "Red",
      }).addFields({
        name: err.response?.data?.error ?? `Description`,
        value: err.response?.data?.help ?? err.message ?? err ?? `Unknown error occurred.`
      }),
    ],
  });
}

export function embedFactory(options: EmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(options.title)
    .setTimestamp(new Date());
  if (options.interaction) embed.setAuthor(generateEmbedAuthor(options.interaction));
  if (options.description) embed.setDescription(options.description);
  if (options.footer) embed.setFooter(options.footer);
  if (options.color) embed.setColor(options.color);

  return embed;
}

export function toZuluTime(time: string): string {
  return `${moment(time).utc().format('HHmm')}Z`;
}

export function KHzToMHz(khz: number) {
  return khz ? khz / 1000 : undefined;
}

export async function flightStatus(flight: Flight): Promise<string> {

  let depAirport: Airport | undefined, destAirport: Airport | undefined;

  if (flight.flightplan) {
    [depAirport, destAirport] = await Promise.all([Avwx.info(flight.flightplan.dep), Avwx.info(flight.flightplan.dest)]);
  }

  if (!flight.position) {
    return `Unknown state.`;
  }

  if (Math.round(flight.position.gs_kt) < 2 && !flight.wows) {
    return `Pre-flight checklist in progress`
  }

  if (flight.position.gs_kt > 0 && flight.position.gs_kt < 35 && !flight.wows) {
    return `Taxiing to the active`
  } else if (flight.position.gs_kt > 0 && flight.position.gs_kt < 35 && flight.wows?.some(wow => wow.wow)) {
    return `Taxiing to the gate${ flight.wows.find(w => w.wow)?.airport ? ` at ${flight.wows.find(w => w.wow)?.airport?.toUpperCase()}` : ''}`;
  }

  if (flight.flightplan) {
    const distanceFromDep = distanceFromAirport(flight.position, depAirport!);
    const distanceFromDest = distanceFromAirport(flight.position, destAirport!);
    
    if (distanceFromDep < 50 && flight.position.vertFtPerSec *60 > 250 && flight.wows?.some(w => !w.wow)) {
      return `Climbing out of ${depAirport?.name ?? depAirport?.icao ?? flight.flightplan.dep}`;
    }
    
    if (distanceFromDest < 50  && distanceFromDest > 15 && flight.position.vertFtPerSec *60 < -250) {
      return `Descending into ${destAirport?.name ?? destAirport?.icao ?? flight.flightplan.dest}`;
    } else if (distanceFromDest <= 12) {
      return `On final approach into ${destAirport?.name ?? destAirport?.icao ?? flight.flightplan.dest}`;
    }

    if (Math.abs(getFPLCruise(flight.flightplan.cruise) - flight.position.pressure_alt) < 250 && flight.position.vertFtPerSec * 60 < 250) {
      return `Cruising at ${Math.round(flight.position.pressure_alt)}ft.`;
    }
  }

  return `Unknown status!`;
}

export function getFPLCruise(cruiseString: string): number {
  return cruiseString.startsWith("F") ? +(cruiseString.split("F")[1]) * 100 : +(cruiseString.split("A")[1]) * 100;
}

/**
 * Calculate distance between an aircraft and an airport.
 * @param position - Position of the aircraft of type `AircraftPosition`.
 * @param airport - Airport object of type `Airport`.
 * @returns Distance between aircraft and airport in Nautical Miles
 */
export function distanceFromAirport(position: AircraftPosition, airport: Airport) {
  if ((position.lat == airport.latitude) && (position.long == airport.longitude)) return 0;

  const radLat1 = toRad(position.lat);
  const radLat2 = toRad(airport.latitude);

  const theta = position.long - airport.longitude;
  const radTheta = toRad(theta);

  let distance = Math.sin(radLat1) * Math.sin(radLat2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
  if (distance > 1) distance = 1;
  distance = toDeg(Math.acos(distance)) * 60 * 1.1515;

  return distance * 0.8684;
}

export function toRad(value: number): number {
  return value * Math.PI / 180;
}

export function toDeg(value: number): number {
  return value * 180 / Math.PI;
}

/**
 * Async function to sleep for `ms` amound of milliseconds.
 * @param ms - time to sleep in milliseconds
 * @returns `Promise<void>` after the sleep time has passed.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
