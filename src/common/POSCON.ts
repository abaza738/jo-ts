import { POSCONOnline } from "../models/poscon/online";
import { Api } from "./Api.js"
import { constants } from "./utils.js"

export default class POSCON {
  static async online() {
    const response = await Api.get(constants.POSCON.API.ONLINE, {});

    if (response.status !== 200) {
      throw new Error(`Could not fetch online POSCON data!`);
    }

    if (response.data) {
      return response.data as POSCONOnline;
    }
  }
}