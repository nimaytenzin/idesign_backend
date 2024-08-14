import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table
export class BuildingsGeom extends Model{
    @Column(DataType.INTEGER)
    buildingId: number;

    @Column(DataType.GEOMETRY('POLYGON'))
    geom: string;
}

