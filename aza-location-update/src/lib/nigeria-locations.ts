/**
 * Nigeria state -> geopolitical zone mapping, plus a lightweight, offline
 * nearest-state resolver used to turn a raw GPS coordinate into a state
 * without calling any third-party geocoding API or storing the coordinate.
 *
 * Why offline nearest-centroid instead of a geocoding API:
 * - No API key / no new paid dependency
 * - Coordinates never leave the device — only the resolved state name is
 *   sent to the server, which is the actual privacy requirement (see D in
 *   the task: don't store precise coordinates if only state/region is needed)
 * - Accuracy is "good enough" for state-level bucketing across a country
 *   this size; state borders are large relative to typical GPS error
 */

export type GeopoliticalZone =
  | "North Central"
  | "North East"
  | "North West"
  | "South East"
  | "South South"
  | "South West";

export const GEOPOLITICAL_ZONES: GeopoliticalZone[] = [
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West",
];

/** All 36 states plus FCT, each with an approximate centroid (lat, lng) used only for nearest-state resolution. */
export const NIGERIA_STATES: { name: string; zone: GeopoliticalZone; lat: number; lng: number }[] = [
  // North Central
  { name: "Benue", zone: "North Central", lat: 7.3369, lng: 8.7404 },
  { name: "Kogi", zone: "North Central", lat: 7.7337, lng: 6.6906 },
  { name: "Kwara", zone: "North Central", lat: 8.9669, lng: 4.3874 },
  { name: "Nasarawa", zone: "North Central", lat: 8.4933, lng: 8.1998 },
  { name: "Niger", zone: "North Central", lat: 9.9309, lng: 5.5983 },
  { name: "Plateau", zone: "North Central", lat: 9.2182, lng: 9.5179 },
  { name: "FCT", zone: "North Central", lat: 9.0765, lng: 7.3986 },
  // North East
  { name: "Adamawa", zone: "North East", lat: 9.3265, lng: 12.3984 },
  { name: "Bauchi", zone: "North East", lat: 10.7769, lng: 9.9959 },
  { name: "Borno", zone: "North East", lat: 11.8333, lng: 13.15 },
  { name: "Gombe", zone: "North East", lat: 10.2897, lng: 11.1673 },
  { name: "Taraba", zone: "North East", lat: 8.0, lng: 11.0 },
  { name: "Yobe", zone: "North East", lat: 12.0, lng: 11.5 },
  // North West
  { name: "Jigawa", zone: "North West", lat: 12.228, lng: 9.5616 },
  { name: "Kaduna", zone: "North West", lat: 10.5222, lng: 7.4383 },
  { name: "Kano", zone: "North West", lat: 12.0, lng: 8.5167 },
  { name: "Katsina", zone: "North West", lat: 12.9908, lng: 7.6018 },
  { name: "Kebbi", zone: "North West", lat: 12.4534, lng: 4.1994 },
  { name: "Sokoto", zone: "North West", lat: 13.0059, lng: 5.2476 },
  { name: "Zamfara", zone: "North West", lat: 12.1704, lng: 6.2591 },
  // South East
  { name: "Abia", zone: "South East", lat: 5.4527, lng: 7.5248 },
  { name: "Anambra", zone: "South East", lat: 6.2209, lng: 6.9370 },
  { name: "Ebonyi", zone: "South East", lat: 6.2649, lng: 8.0137 },
  { name: "Enugu", zone: "South East", lat: 6.5244, lng: 7.5112 },
  { name: "Imo", zone: "South East", lat: 5.572, lng: 7.0588 },
  // South South
  { name: "Akwa Ibom", zone: "South South", lat: 5.0077, lng: 7.8536 },
  { name: "Bayelsa", zone: "South South", lat: 4.7719, lng: 6.0699 },
  { name: "Cross River", zone: "South South", lat: 5.8702, lng: 8.5988 },
  { name: "Delta", zone: "South South", lat: 5.5322, lng: 5.8987 },
  { name: "Edo", zone: "South South", lat: 6.6342, lng: 5.9304 },
  { name: "Rivers", zone: "South South", lat: 4.8396, lng: 6.9112 },
  // South West
  { name: "Ekiti", zone: "South West", lat: 7.7190, lng: 5.3110 },
  { name: "Lagos", zone: "South West", lat: 6.5244, lng: 3.3792 },
  { name: "Ogun", zone: "South West", lat: 7.1608, lng: 3.3486 },
  { name: "Ondo", zone: "South West", lat: 7.2508, lng: 5.2036 },
  { name: "Osun", zone: "South West", lat: 7.5629, lng: 4.5200 },
  { name: "Oyo", zone: "South West", lat: 8.1574, lng: 3.6147 },
];

export const NIGERIA_STATE_NAMES = NIGERIA_STATES.map((s) => s.name);

const STATE_TO_ZONE: Record<string, GeopoliticalZone> = Object.fromEntries(
  NIGERIA_STATES.map((s) => [s.name, s.zone])
);

/** Look up a state's geopolitical zone. Returns null for an unrecognized state string. */
export function zoneForState(state: string | null | undefined): GeopoliticalZone | null {
  if (!state) return null;
  return STATE_TO_ZONE[state] ?? null;
}

/**
 * Resolve a raw GPS coordinate to the nearest Nigerian state by straight-line
 * distance to each state's centroid. This is deliberately approximate — it is
 * only meant to pre-select a state for the user to confirm/change, never to
 * be persisted as the source of truth itself. The coordinate passed in should
 * be discarded by the caller immediately after this call.
 */
export function nearestStateToCoordinates(lat: number, lng: number): { name: string; zone: GeopoliticalZone } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let closest: { name: string; zone: GeopoliticalZone } | null = null;
  let closestDist = Infinity;

  for (const state of NIGERIA_STATES) {
    // Simple Euclidean distance on lat/lng is fine here since we only need
    // ordering (nearest), not an actual physical distance in km.
    const dLat = lat - state.lat;
    const dLng = lng - state.lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < closestDist) {
      closestDist = dist;
      closest = { name: state.name, zone: state.zone };
    }
  }

  return closest;
}
