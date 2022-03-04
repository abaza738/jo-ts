import axios from "axios";
import { CommandInteraction } from "discord.js";
import { Airport } from "../models/airport.model";
import { Metar } from "../models/metar.model";
import { Taf } from "../models/taf.model";
import { Api } from "./Api.js";
import { constants, handleError } from "./utils.js";

export default class Avwx {

    /**
   * Retrieve general information for a given airport.
   * @param {string} ident - Airport identifier (ICAO or IATA)
   * @param {CommandInteraction} interaction - Command Interaction for replying
   * @returns `Promise<Airport|undefined>` Airport object or undefined if not found.
   */
     static async info(ident: string): Promise<Airport | undefined> {
      const url = `${constants.AVWX.URLS.AIRPORT_INFO}${ident}`;
      const response = await Api.get(url, constants.AVWX.HEADERS);

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
    const url = `${constants.AVWX.URLS.METAR}${ident}`;
    const response = await Api.get(url, constants.AVWX.HEADERS);

    if (response.status !== 200) {
      throw new Error(`Could not retrieve ${ident.toUpperCase()} METAR.`);
    }

    if (response.data) {
      return response.data as Metar;
    }
  }

  static async taf(ident: string): Promise<any | undefined> {
    const url = `${constants.AVWX.URLS.TAF}${ident}`;
    const response = await Api.get(url, constants.AVWX.HEADERS);

    if (response.status !== 200) {
      throw new Error(`Could not retrieve ${ident.toUpperCase()} TAF.`);
    }

    if (response.data) {
      return response.data as Taf;
    }
  }
}