import { POSCONOnline } from "../models/poscon/online";
import { Api } from "./Api.js"
import { constants } from "./constants.js";

const CACHE_TIMEOUT = 5 * 60;

export default class POSCON {

  static cachedOnline: POSCONOnline | null;
  static cacheTimer: ReturnType<typeof setTimeout>;

  static async online() {

    if(POSCON.cachedOnline) {
      this.cacheTimer.refresh();
      return POSCON.cachedOnline;
    } else {
      POSCON.setTimer(CACHE_TIMEOUT);
    }

    const response = await Api.get(constants.POSCON.URLS.ONLINE, {});

    if (response.status !== 200) {
      throw new Error(`Could not fetch online POSCON data!`);
    }

    if (response.data) {
      POSCON.cachedOnline = response.data as POSCONOnline;
      return response.data as POSCONOnline;
    }
  }

  /**
   * Not my proudest moment here. I will return to this. Sometime.
   * @param seconds - Amount of seconds to wait
   */
  static setTimer(seconds: number) {
    POSCON.cacheTimer = setTimeout(() => {
      POSCON.cachedOnline = null;
    }, seconds * 1000);
  }
}