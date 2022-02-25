import axios from "axios";
import { CommandInteraction } from "discord.js";
import { Airport } from "../models/airport.model";
import { Metar } from "../models/metar.model";
import { Api } from "./Api.js";
import { constants, handleError } from "./utils.js";

export default class Avwx {

    /**
   * Retrieve general information for a given airport.
   * @param {string} ident - Airport identifier (ICAO or IATA)
   * @param {CommandInteraction} interaction - Command Interaction for replying
   * @returns `Promise<Airport|undefined>` Airport object or undefined if not found.
   */
     static async info(ident: string, interaction: CommandInteraction): Promise<Airport | undefined> {
      const url = `${constants.AIRPORT_INFO_API_URL}${ident}`;
      const response = await Api.get(url, constants.AVWX_HEADERS);

      if (response.status !== 200) {
        throw new Error(`Could not retrieve ${ident.toUpperCase()} information.`);
      }

      if (response.data) {
        return response.data as Airport;
      }
    }

  /**
   * Retrieve a METAR report for a given airport.
   * @param {string} ident - Airport Identified (ICAO or IATA)
   * @param {CommandInteraction} interaction - Command Interaction for replying
   * @returns `Promise<Metar|undefined>` METAR object or undefied if not found.
   */
  static async metar(ident: string): Promise<Metar | undefined> {
    const url = `${constants.METAR_API_URL}${ident}`;
    const response = await Api.get(url, constants.AVWX_HEADERS);

    if (response.status !== 200) {
      throw new Error(`Could not retrieve ${ident.toUpperCase()} METAR.`);
    }

    if (response.data) {
      return response.data as Metar;
    }
  }

  static async taf(ident: string, interaction: CommandInteraction): Promise<any | undefined> {
    let data;
    try {
      data = await axios.get(constants.AIRPORT_INFO_API_URL, constants.AVWX_HEADERS)
    } catch (err) {
      handleError(err, interaction);
      return;
    }

    return data?.data;
  }
}