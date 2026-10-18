/**
 * RoutingService — wraps the OSRM public HTTP API.
 *
 * API docs: http://project-osrm.org/docs/v5.5.1/api/
 * Public endpoint used: router.project-osrm.org (no API key required)
 *
 * Supports two profiles:
 *  - 'driving' : for car routes
 *  - 'foot'    : for walking/pedestrian routes (better for tourism PoC)
 */

export type OsrmProfile = 'driving' | 'foot' | 'bike';

export interface RoutingOptions {
  profile?: OsrmProfile;
  /** Custom OSRM base URL. Defaults to the public OSRM demo server. */
  baseUrl?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

export interface RoutingResult {
  /** Full GeoJSON LineString coordinates [[lng, lat], ...] following real roads */
  coordinates: [number, number][];
  /** Total route distance in kilometres */
  distanceKm: number;
  /** Estimated travel duration in minutes */
  durationMin: number;
}

const DEFAULT_BASE_URL = 'https://router.project-osrm.org';

/**
 * Fetch a road-snapped route between an ordered list of waypoints.
 *
 * @param waypoints  Array of [lng, lat] pairs — must have at least 2 points.
 * @param options    Profile, base URL, abort signal.
 * @returns          RoutingResult with full polyline, distance and duration.
 * @throws           Error if the OSRM request fails or returns no routes.
 */
export async function fetchOsrmRoute(
  waypoints: [number, number][],
  options: RoutingOptions = {}
): Promise<RoutingResult> {
  if (waypoints.length < 2) {
    throw new Error('[RoutingService] At least 2 waypoints are required.');
  }

  const { profile = 'foot', baseUrl = DEFAULT_BASE_URL, signal } = options;

  // Build coordinate string: "lng1,lat1;lng2,lat2;..."
  const coordStr = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');

  const url =
    `${baseUrl}/route/v1/${profile}/${coordStr}` +
    `?overview=full&geometries=geojson&steps=false&annotations=false`;

  console.info(`[RoutingService] Fetching OSRM ${profile} route for ${waypoints.length} waypoints…`);

  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`[RoutingService] OSRM returned HTTP ${res.status}`);
  }

  const json = await res.json();

  if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
    throw new Error(`[RoutingService] OSRM error: ${json.code ?? 'unknown'} — ${json.message ?? ''}`);
  }

  const route = json.routes[0];
  const coordinates: [number, number][] = route.geometry.coordinates;
  const distanceKm = route.distance / 1000;
  const durationMin = route.duration / 60;

  console.info(
    `[RoutingService] Route fetched: ${coordinates.length} points, ` +
    `${distanceKm.toFixed(2)} km, ~${durationMin.toFixed(0)} min`
  );

  return { coordinates, distanceKm, durationMin };
}
