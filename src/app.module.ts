import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuildingsGeomModule } from './modules/buildings-geom/buildings-geom.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [BuildingsGeomModule,DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
