export interface POSCONOnline {
  totalPilots: number;
  totalAtc: number;
  lastUpdated: string;
  flights: Flight[];
  atc: ATC[];
  upcomingAtc: UpcomingATC[];
  upcomingFlights: UpcomingFlight[];
}

export interface Flight {
  _id: string;
  userId: string;
  squawk: string;
  callsign: string;
  wows?: WOW[];
  userName: string;
  ac_type: string;
  airline?: string;
  position: AircraftPosition;
  freq?: AircraftFrequency;
  login: string;
  flightplan?: FlightPlan;
}

export interface ATC {
  userId: string;
  position: string;
  userName: string;
  login?: string;
  telephony?: string;
  fir?: string;
  type?: PositionType;
  vhfFreq?: string;
  centerPoint?: number[];
}

export interface UpcomingATC extends ATC {
  start: string;
  end: string;
  forumEventUrl: string;
}

export interface UpcomingFlight {
  created: string;
  std: string;
  sta: string;
  ac_type: string;
  altnt: string;
  altnt2?: string;
  callsign: string;
  cruise_spd: string;
  dof: string;
  dep: string;
  dep_time: string;
  dest: string;
  eet: string;
  endurance: string;
  equip_code: string;
  rules: string;
  type: string;
  cruise: string;
  other?: string;
  pbn?: string;
  perf_cat?: string;
  persons?: number;
  remarks?: string;
  route?: string;
  ssr?: string;
  wake_turb: string;
  operator?: string;
  user_id: string;
  squawk?: string;
  userName: string;
}

export interface AircraftPosition {
  lat: number;
  long: number;
  true_hdg: number;
  gs_kt: number;
  pressure_alt: number;
  alt_amsl: number;
  pitch: number;
  roll: number;
  ghosted: number;
  vertFtPerSec: number;
}

export interface AircraftFrequency {
  vhf1: number;
  vhf2: number;
}

export interface WOW {
  wow: boolean;
  time: string;
  airport?: string;
  location: Location;
}

export interface Location {
  type: string;
  coordinates: number[];
}

export interface FlightPlan {
  created?: string;
  updated?: string;
  std?: string;
  sta?: string;
  ac_type?: string;
  altnt?: string;
  altnt2?: string;
  callsign?: string;
  cruise_spd?: string;
  dof?: string;
  dep?: string;
  dep_time?: string;
  dest?: string;
  eet?: string;
  endurance?: string;
  equip_code?: string;
  rules?: string;
  type?: string;
  cruise?: string;
  other?: string;
  pbn?: string;
  perf_cat?: string;
  persons?: number;
  remarks?: string;
  route?: string;
  ssr?: string;
  wake_turb?: string;
  operator?: string;
  user_id?: string;
}

export enum PositionType {
  ATCT = "ATCT",
  APP_MIN = "APP_MIN",
  APP_MAJ = "APP_MAJ",
  CTR = "CTR",
  MIL = "MIL"
}