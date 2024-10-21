import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuildingsGeomModule } from './modules/buildings-geom/buildings-geom.module';
import { DatabaseModule } from './database/database.module';
import { PlotsGeomModule } from './modules/plots-geom/plots-geom.module';

@Module({
  imports: [BuildingsGeomModule,DatabaseModule, PlotsGeomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
