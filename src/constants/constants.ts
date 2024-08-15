export const SEQUELIZE = 'SEQUELIZE';
export const DEVELOPMENT = 'development';
export const TEST = 'test';
export const PRODUCTION = 'production';
export interface geoJsonFeature {
    "type": string,
    "properties": any,
    "geometry": {
      "type": string,
      "coordinates": [ [ [ number[] ] ]]
    }
  }
  export interface geoJson {
    "type": string,
    "features": geoJsonFeature[]
  }
