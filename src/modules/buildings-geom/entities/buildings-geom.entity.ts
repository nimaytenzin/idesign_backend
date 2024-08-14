import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
    timestamps:false
})
export class BuildingsGeom extends Model{
    @Column(DataType.INTEGER)
    buildingId: number;

    @Column(DataType.GEOMETRY('MULTIPOLYGON'))
    geom: string;
}

