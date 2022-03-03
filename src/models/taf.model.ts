import { Cloud, Units, Value } from "./shared.model";

export interface Taf {
  meta: {
    timestamp?: string;
    stations_updated?: string;
  };
  raw: string;
  sanitized: string;
  station: string;
  time: {
    repr: string;
    dt: string;
  };
  remarks?: string;
  forecast?: Forecast[];
  start_time?: Value;
  end_time?: Value;
  max_temp?: any;
  min_temp?: any;
  alts?: any;
  temps?: any;
  remarks_info?: any;
  units: Units;
}

export interface Forecast {
  altimeter?: string;
  clouds?: Cloud[];
  flight_rules?: string;
  visibility?: Value;
  wind_direction?: Value;
  wind_gust?: any;
  wind_speed?: Value;
  wx_codes?: Value[];
  end_time?: Value;
  icing?: any[];
  probability?: Value;
  raw: string;
  sanitized: string;
  start_time?: Value;
  transition_start?: any;
  turbulence?: any;
  type?: string;
  wind_shear?: any;
}