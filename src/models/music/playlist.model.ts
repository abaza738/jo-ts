import { CoverArt, SpotifyAudioPreview } from "./track.model";

export type TrackListItem = {
  uri: string;
  uid: string;
  title: string;
  subtitle: string;
  isExplicit: boolean;
  duration: number;
  isPlayable: boolean;
  audioPreview: SpotifyAudioPreview;
};

export type SpotifyPlaylist = {
  coverArt: CoverArt;
  duration: number;
  hasVideo: boolean;
  id: string;
  isExplicit: boolean;
  isPlayable: boolean;
  maxDuration: number;
  name: string;
  releaseDate?: {
    isoString: string;
  };
  subtitle: string;
  title: string;
  trackList: TrackListItem[];
  type: "playlist";
  uri: string;
};

export type SpotifyImage = {
  height: number;
  width: number;
  url: string;
};

export type SpotifyPlaylistOwner = {
  display_name: string;
  external_urls?: {
    spotify?: string;
  };
  href?: string;
  id?: string;
  type: "user";
  uri?: string;
};
