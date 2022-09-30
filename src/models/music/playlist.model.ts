import { SpotifyTrack } from "./track.model";

export type SpotifyPlaylist = {
  collaborative: boolean;
  description?: string | null;
  external_urls: {
    spotify?: string;
  };
  href: string;
  id: string;
  images?: SpotifyImage[];
  name: string;
  owner?: SpotifyPlaylistOwner;
  primary_color?: string | null;
  public: boolean;
  snapshot_id?: string;
  tracks: {
    href?: string | null;
    items: [
      {
        is_local?: boolean;
        primary_color?: string | null;
        track: SpotifyTrack;
        video_thumbnail?: {
          url?: string | null;
        };
      }
    ];
    limit: number;
    next?: any | null;
    offset: number;
    previous: any | null;
    total: number;
  };
  type: "playlist";
  uri: string;
  dominantColor?: string;
}

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
