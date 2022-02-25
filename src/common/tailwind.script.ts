export default function calculateTailwind(metar: any, runway: { ident: string, heading: number } | undefined): number {
  if (!runway) return -1;
  let angle: number = Math.abs(metar.wind_direction.value - runway.heading);
  if (angle < 90) return -1;
  angle = (angle > 180 ? angle-180 : angle) * Math.PI / 180;

  return Math.round(metar.wind_speed.value * Math.abs(Math.cos(angle)));
}