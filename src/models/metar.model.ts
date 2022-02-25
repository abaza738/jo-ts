export interface Metar {
  meta: {
    timestamp: string;
  };
  altimeter: Value;
  clouds?: Cloud[];
  flight_rules: string;
  other?: any[];
  sanitized: string;
  visibility?: Value;
  wind_direction: Value;
  wind_gust?: Value;
  wind_speed: Value;
  wx_codes?: Value[];
  raw: string;
  station: string;
  time: {
    repr: string;
    dt: string;
  };
  remarks?: string;
  dewpoint?: Value;
  relative_humidity: number;
  remarks_info?: {
    maximum_temperature_6?: null,
    minimum_temperature_6?: null,
    pressure_tendency?: null,
    precip_36_hours?: null,
    precip_24_hours?: null,
    sunshine_minutes?: null,
    codes?: Value[];
    dewpoint_decimal?: Value;
    maximum_temperature_24?: null,
    minimum_temperature_24?: null,
    precip_hourly?: null,
    sea_level_pressure?: Value;
    snow_depth?: null,
    temperature_decimal?: Value;
  },
  runway_visibility: RunwayVisibility[];
  temperature: Value;
  wind_variable_direction?: Value[];
  density_altitude: number;
  pressure_altitude: number;
  units: {
    accumulation: string;
    altimeter: string;
    altitude: string;
    temperature: string;
    visibility: string;
    wind_speed: string;
  }
}

export interface Value {
  repr: string;
  value: number;
  spoken?: string;
}

export interface Cloud {
  repr: string;
  type: string;
  altitude: number;
  modifier?: any;
  direction?: any;
}

export interface RunwayVisibility {
  repr: string;
  runway: string;
  visibility: Value;
  variable_visibility?: Value[];
  trend?: Value;
}