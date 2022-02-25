export interface Airport {
  city?: string;
  country?: string;
  elevation_ft: number;
  elevation_m: number;
  iata?: string;
  icao?: string;
  latitude: number;
  longitude: number;
  name: string;
  note?: string;
  reporting?: boolean;
  runways?: Runway[];
  state?: string;
  type: string;
  website?: string;
  wiki?: string;
}

export interface Runway {
  length_ft: number;
  width_ft: number;
  surface?: string;
  lights?: boolean;
  ident1?: string;
  ident2?: string;
  bearing1?: number;
  bearing2?: number;
}