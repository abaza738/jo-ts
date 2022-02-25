import moment from "moment";
import { Metar } from "../models/metar.model";

export function decodeMetar(metar: Metar) {
  let metarDecoded = `**Report time**: ${moment(metar.time.dt)
    .utc()
    .format("HH:mm")} UTC
          **Wind**: ${metar.wind_direction.repr}° at ${
    metar.wind_speed.value
  } ${metar.units.wind_speed}.${
    metar.wind_variable_direction?.length
      ? " Variable between " +
        metar.wind_variable_direction[0].repr +
        "° and " +
        metar.wind_variable_direction[1].repr +
        "°."
      : ""
  }${
    metar.wind_gust
      ? " Gusting " + metar.wind_gust.value + " " + metar.units.wind_speed
      : ""
  }\n`;

  if (metar.visibility) {
    metarDecoded += `**Visibility**: ${metar.visibility.value}${metar.units.visibility}\n`;
  }

  if (metar.wx_codes?.length) {
    metarDecoded += `**Weather Phenomena**: ${metar.wx_codes
      .map((code: any) => code.value)
      .join(", ")}\n`;
  }

  if (metar.clouds?.length) {
    metarDecoded += `**Clouds**: ${metar.clouds
      .map(
        (cloud: any) =>
          cloud.type +
          " at " +
          cloud.altitude * 100 +
          metar.units.altitude +
          (cloud.modifier ? " type " + cloud.modifier : "")
      )
      .join(", ")}\n`;
  }

  metarDecoded += `**Temparature**: ${
    metar.temperature.value
  }° ${metar.units.temperature.toUpperCase()}
          **Dew Point**: ${
            metar.dewpoint?.value
          }° ${metar.units.temperature.toUpperCase()}
          **Pressure**: ${metar.altimeter.value} ${metar.units.altimeter}\n`;

  if (metar.remarks) {
    metarDecoded += `**Remarks**: \`${metar.remarks}\``;
  }

  return metarDecoded;
}
