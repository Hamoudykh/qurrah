// Qibla direction (pure). Great-circle initial bearing from the user's position to the Kaaba.
// θ = atan2( sin Δλ , cos φ₁·tan φ₂ − sin φ₁·cos Δλ )   (φ = latitude, λ = longitude)
// Kaaba coordinates: the same values used by the Adhan library (21.4225241 N, 39.8261818 E).

export const KAABA = { lat: 21.4225241, lon: 39.8261818 };
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
export const norm360 = (a) => ((a % 360) + 360) % 360;

/** Bearing in degrees clockwise from TRUE north (0–360). */
export function qiblaBearing(lat, lon) {
  const φ1 = rad(lat), φ2 = rad(KAABA.lat), Δλ = rad(KAABA.lon - lon);
  const y = Math.sin(Δλ);
  const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
  return norm360(deg(Math.atan2(y, x)));
}

/** Great-circle distance in km (haversine). */
export function distanceToKaabaKm(lat, lon) {
  const R = 6371.0088;
  const dφ = rad(KAABA.lat - lat), dλ = rad(KAABA.lon - lon);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(KAABA.lat)) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Signed smallest difference b − a in degrees, in (−180, 180]. */
export function angleDiff(a, b) {
  let d = norm360(b - a);
  if (d > 180) d -= 360;
  return d;
}

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compassPoint = (bearing) => POINTS[Math.round(norm360(bearing) / 45) % 8];

/**
 * Compass heading (degrees from north, clockwise) from a DeviceOrientationEvent.
 * iOS Safari: webkitCompassHeading (already clockwise from north).
 * Others: needs an absolute event (deviceorientationabsolute or e.absolute === true);
 * alpha is counter-clockwise, so heading = 360 − alpha, then corrected for screen rotation.
 * Returns null if the event cannot give a north-referenced heading.
 */
export function headingFromOrientation(e, screenAngle = 0) {
  if (e == null) return null;
  if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
    return { heading: norm360(e.webkitCompassHeading + screenAngle), accuracy: e.webkitCompassAccuracy ?? null, source: 'webkit' };
  }
  if ((e.absolute === true || e.type === 'deviceorientationabsolute') && typeof e.alpha === 'number') {
    return { heading: norm360(360 - e.alpha + screenAngle), accuracy: null, source: 'absolute' };
  }
  return null;
}
