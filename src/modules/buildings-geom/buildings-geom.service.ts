import { Injectable } from '@nestjs/common';
import { CreateBuildingsGeomDto } from './dto/create-buildings-geom.dto';
import { UpdateBuildingsGeomDto } from './dto/update-buildings-geom.dto';

@Injectable()
export class BuildingsGeomService {
  create(createBuildingsGeomDto: CreateBuildingsGeomDto) {
    return 'This action adds a new buildingsGeom';
  }

  findAll() {
    return `This action returns all buildingsGeom`;
  }

  findOne(id: number) {
    return `This action returns a #${id} buildingsGeom`;
  }

  update(id: number, updateBuildingsGeomDto: UpdateBuildingsGeomDto) {
    return `This action updates a #${id} buildingsGeom`;
  }

  remove(id: number) {
    return `This action removes a #${id} buildingsGeom`;
  }
}
