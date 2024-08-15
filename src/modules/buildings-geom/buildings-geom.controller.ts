import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BuildingsGeomService } from './buildings-geom.service';
import { CreateBuildingsGeomDto } from './dto/create-buildings-geom.dto';
import { UpdateBuildingsGeomDto } from './dto/update-buildings-geom.dto';

@Controller('buildings-geom')
export class BuildingsGeomController {
  constructor(private readonly buildingsGeomService: BuildingsGeomService) { }

  @Post()
  create(@Body() createBuildingsGeomDto: CreateBuildingsGeomDto) {
    return this.buildingsGeomService.create(createBuildingsGeomDto);
  }

  @Get('bid/:id')
  findOne(@Param('id') id: string) {
    return this.buildingsGeomService.findOneByBuildingId(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBuildingsGeomDto: UpdateBuildingsGeomDto) {
    return this.buildingsGeomService.updateByBuildingId(+id, updateBuildingsGeomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.buildingsGeomService.remove(+id);
  }
}
