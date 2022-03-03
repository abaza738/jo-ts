import { EmbedFieldData } from "discord.js";
import moment from "moment";
import { Cloud } from "../models/shared.model";
import { Forecast, Taf } from "../models/taf.model";

export function decodeTaf(taf: Taf): EmbedFieldData[] {
  let forecasts: EmbedFieldData[] = [];

  if (taf.forecast?.length) {
    forecasts.push(
      ...taf.forecast.map((forecast: Forecast) => {
        
        return {
          name: `${forecast.type}`,
          value: extractForecastValue(taf, forecast)
        }
      })
    );
  }

  return forecasts;
}

function formatTime(dt: string): string {
  return moment(dt).format("MMM Do, HHmm");
}

function extractForecastValue(taf: Taf, forecast: Forecast): string {
  let decoded = `${formatTime(forecast.start_time?.dt!)}Z → ${formatTime(forecast.end_time?.dt!)}Z\n`;

  if (forecast.probability) {
    decoded += `Probability of percipitation: ${forecast.probability.repr}%\n`;
  }

  if (forecast.wind_direction && forecast.wind_speed) {
    decoded += `Wind ${forecast.wind_direction.repr} at ${forecast.wind_speed.value}${taf.units.wind_speed}\n`;
  }

  if (forecast.visibility) {
    decoded += `Visibility: ${forecast.visibility.value}${taf.units.visibility}\n`;
  }

  if (forecast.wx_codes?.length) {
    decoded += `Weather Phenomena: ${forecast.wx_codes
      .map((code: any) => code.value)
      .join(", ")}\n`;
  }

  if (forecast.clouds?.length) {
    decoded += `Clouds: ${forecast.clouds.map((cloud: Cloud) => cloud.repr).join(', ')}\n`;
  }

  return decoded;
}