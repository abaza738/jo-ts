import { Api } from "./Api.js";
import { constants } from "./constants.js";

export default class Vatsim {
  static async online() {
    const response = await Api.get(constants.VATSIM.URLS.ONLINE);

    if (response.status !== 200) {
      throw new Error(`Could not get VATSIM online data!`);
    }

    if (response.data) {
      return response.data;
    }
  }
}