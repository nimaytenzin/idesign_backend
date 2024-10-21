import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  timestamps: false,
})
export class PlotGeom extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column(DataType.GEOMETRY('MULTIPOLYGON'))
  geom: string;

  @Column(DataType.STRING)
  plotId: string;
}
