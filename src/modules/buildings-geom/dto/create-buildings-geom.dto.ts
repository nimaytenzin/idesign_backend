import { geoJson } from "src/constants/constants";

export class CreateBuildingsGeomDto {
    buildingId:number;
    geom:geoJson;
}
