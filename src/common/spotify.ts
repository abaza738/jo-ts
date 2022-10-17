import fetch from "isomorphic-unfetch";
import * as spotify from "spotify-url-info";
import ytsr from "ytsr";
import { SpotifyPlaylist } from "../models/music/playlist.model";
import { SpotifyTrack } from "../models/music/track.model";

const { getData } = spotify.default(fetch);

export class SpotifyManager {
  /**
   *
   * @param url - Spotify link for a single track or a playlist.
   * @param cb - Callback function called when retrieving the YouTube video for the single track or each of the tracks in a playlist.
   * Object sent to the callback function consists of: `track` with the YouTube video or `undefined`, and `last` as an indication if this is the last video in the playlist.
   */
  public static async getTracks(
    url: string,
    cb: (data: {
      playlist?: SpotifyPlaylist,
      track?: ytsr.Video | undefined;
      last?: boolean;
      error?: any;
    }) => void
  ) {
    let data: SpotifyTrack | SpotifyPlaylist;
    try {
      data = await getData(url);
    } catch (e) {
      console.log(`Oepsie doepsie! De Spotify link (${url}) is verbroken!`);
      cb({ error: e });
      return;
    }

    if (!data) {
      return;
    }

    if (data.type === "track") {
      const searchQuery = `${(data as SpotifyTrack).artists?.[0]?.name ?? ""} ${
        (data as SpotifyTrack).name ?? ""
      }`;
      const result = await getSong(searchQuery);
      cb({ track: result, last: true });
      return;
    }

    for (let i = 0; i < data.tracks?.items?.length; i++) {
      const item = data.tracks?.items[i];
      const searchQuery = `${item.track.artists?.[0]?.name ?? ""} ${
        item.track.name ?? ""
      }`;
      const song = await getSong(searchQuery);
      cb({ playlist: data, track: song, last: i === data.tracks?.items.length - 1 });
    }
  }
}

/**
 * Search for a YouTube video given a search text input or a link.
 * @param input - Search string
 * @returns first match of a YouTube video if found, else `undefined`.
 */
const getSong = async (input: string) => {
  const filters = await ytsr.getFilters(input ?? "");
  const search = filters.get("Type")?.get("Video");

  if (!search?.url) {
    return;
  }

  const song = await ytsr(search.url, { limit: 1 });

  if (!song) {
    return;
  }

  if (song.items?.length < 1 || song.items[0]?.type !== "video") {
    return;
  }

  return song.items[0];
};
