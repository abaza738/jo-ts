import moment from "moment";
import { SpotifyImage } from "./playlist.model";

export type SpotifyTrack = {
  album?: SpotifyAlbum;
  type: "track";
  name: string;
  uri: string;
  href?: string;
  id: string;
  title: string;
  artists?: SpotifyArtist[];
  coverArt: CoverArt;
  releaseDate: {
    isoString: string;
  };
  duration: number;
  maxDuration: number;
  isPlayable: boolean;
  isExplicit: boolean;
  audioPreview: SpotifyAudioPreview;
  hasVideo: boolean;
  relatedEntityUri?: string;
  external_urls: {
    spotify?: string;
  };
  disc_number?: number;
  duration_ms?: number;
  episode?: boolean;
  explicit?: boolean;
  external_ids?: { [key: string]: any };
  is_local?: boolean;
  is_playable?: boolean;
  popularity?: number;
  preview_url?: string;
  track?: boolean;
  track_number?: number;
}

export type CoverArt = {
  extractedColors: {
    colorDark?: {
      hex: string;
    };
    colorLight?: {
      hex: string;
    };
  };
  sources: Sources[];
};

export type Sources = {
  height?: any;
  width?: any;
  url: string;
};

export type SpotifyArtist = {
  name: string;
  uri: string;
  external_urls?: {
    spotify?: string;
  };
  href?: string;
  id?: string;
  type?: "artist";
};

export type SpotifyAudioPreview = {
  url: string;
  fileId: string;
  externallyHosted: boolean;
  format: string;
};

export type SpotifyAlbum = {
  album_type?: string;
  artists: SpotifyArtist[];
  external_urls?: {
    spotify?: string;
  };
  href?: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  release_date_precision: moment.unitOfTime.Base;
  total_tracks: number;
  type: "album";
  uri?: string;
};
