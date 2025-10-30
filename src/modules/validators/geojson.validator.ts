import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as turf from '@turf/turf';

/**
 * Custom validator to validate GeoJSON geometry in WGS84 projection
 */
export function IsValidWGS84GeoJSON(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidWGS84GeoJSON',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== 'object') {
            return false;
          }

          try {
            // Check if it's valid GeoJSON using Turf
            const isValid = turf.booleanValid(value);
            if (!isValid) {
              return false;
            }

            // Validate WGS84 coordinate bounds
            return validateWGS84Coordinates(value);
          } catch (error) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid GeoJSON geometry in WGS84 projection (EPSG:4326). Coordinates must be within longitude [-180, 180] and latitude [-90, 90].`;
        },
      },
    });
  };
}

/**
 * Recursively validate all coordinates are within WGS84 bounds
 */
function validateWGS84Coordinates(geometry: any): boolean {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return false;
  }

  const { type, coordinates } = geometry;

  switch (type) {
    case 'Point':
      return validatePointCoordinates(coordinates);

    case 'MultiPoint':
    case 'LineString':
      return validateLineCoordinates(coordinates);

    case 'MultiLineString':
    case 'Polygon':
      return validatePolygonCoordinates(coordinates);

    case 'MultiPolygon':
      return validateMultiPolygonCoordinates(coordinates);

    case 'GeometryCollection':
      return geometry.geometries.every((geom: any) =>
        validateWGS84Coordinates(geom),
      );

    default:
      return false;
  }
}

/**
 * Validate a single coordinate pair [longitude, latitude]
 */
function validatePointCoordinates(coord: number[]): boolean {
  if (!Array.isArray(coord) || coord.length < 2) {
    return false;
  }

  const [lng, lat] = coord;

  // Check if coordinates are numbers
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return false;
  }

  // Check WGS84 bounds
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

/**
 * Validate LineString or MultiPoint coordinates
 */
function validateLineCoordinates(coords: number[][]): boolean {
  if (!Array.isArray(coords) || coords.length === 0) {
    return false;
  }

  return coords.every((coord) => validatePointCoordinates(coord));
}

/**
 * Validate Polygon or MultiLineString coordinates
 */
function validatePolygonCoordinates(coords: number[][][]): boolean {
  if (!Array.isArray(coords) || coords.length === 0) {
    return false;
  }

  return coords.every((ring) => validateLineCoordinates(ring));
}

/**
 * Validate MultiPolygon coordinates
 */
function validateMultiPolygonCoordinates(coords: number[][][][]): boolean {
  if (!Array.isArray(coords) || coords.length === 0) {
    return false;
  }

  return coords.every((polygon) => validatePolygonCoordinates(polygon));
}

/**
 * Utility function to get geometry bounds (for debugging/logging)
 */
export function getGeometryBounds(geometry: any): {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
} | null {
  try {
    const bbox = turf.bbox(geometry);
    return {
      minLng: bbox[0],
      minLat: bbox[1],
      maxLng: bbox[2],
      maxLat: bbox[3],
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if coordinates appear to be in Web Mercator (EPSG:3857) instead of WGS84
 */
export function isLikelyWebMercator(geometry: any): boolean {
  try {
    const bounds = getGeometryBounds(geometry);
    if (!bounds) return false;

    // Web Mercator has much larger coordinate values
    // Typical range: -20037508.34 to 20037508.34
    return (
      Math.abs(bounds.minLng) > 180 ||
      Math.abs(bounds.maxLng) > 180 ||
      Math.abs(bounds.minLat) > 90 ||
      Math.abs(bounds.maxLat) > 90
    );
  } catch {
    return false;
  }
}

/**
 * Get detailed validation error message
 */
export function getGeoJSONValidationError(geometry: any): string | null {
  if (!geometry || typeof geometry !== 'object') {
    return 'Geometry must be a valid object';
  }

  if (!geometry.type) {
    return 'Geometry must have a type property';
  }

  if (!geometry.coordinates && geometry.type !== 'GeometryCollection') {
    return 'Geometry must have coordinates';
  }

  try {
    // Check with Turf
    const isValid = turf.booleanValid(geometry);
    if (!isValid) {
      return 'Invalid GeoJSON structure';
    }
  } catch (error) {
    return `Invalid GeoJSON: ${error.message}`;
  }

  // Check projection
  if (isLikelyWebMercator(geometry)) {
    return 'Geometry appears to be in Web Mercator (EPSG:3857) projection. Please reproject to WGS84 (EPSG:4326)';
  }

  // Check WGS84 bounds
  if (!validateWGS84Coordinates(geometry)) {
    const bounds = getGeometryBounds(geometry);
    if (bounds) {
      return `Coordinates out of WGS84 bounds. Longitude: [${bounds.minLng.toFixed(
        2,
      )}, ${bounds.maxLng.toFixed(2)}], Latitude: [${bounds.minLat.toFixed(
        2,
      )}, ${bounds.maxLat.toFixed(
        2,
      )}]. Valid ranges: Longitude [-180, 180], Latitude [-90, 90]`;
    }
    return 'Coordinates are not within WGS84 bounds (Longitude: -180 to 180, Latitude: -90 to 90)';
  }

  return null;
}
