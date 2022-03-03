export interface Units {
  accumulation?: string;
  altimeter?: string;
  altitude?: string;
  temperature?: string;
  visibility?: string;
  wind_speed?: string;
}

export interface Value {
  repr: string;
  value?: number | string;
  spoken?: string;
  dt?: string;
}

export interface Cloud {
  repr: string;
  type: string;
  altitude: number;
  modifier?: string;
  direction?: string;
}

export interface RunwayVisibility {
  repr: string;
  runway: string;
  visibility: Value;
  variable_visibility?: Value[];
  trend?: Value;
}