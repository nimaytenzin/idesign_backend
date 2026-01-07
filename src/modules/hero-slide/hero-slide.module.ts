import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HeroSlideService } from './hero-slide.service';
import { HeroSlideController } from './hero-slide.controller';
import { HeroSlide } from './entities/hero-slide.entity';

@Module({
  imports: [SequelizeModule.forFeature([HeroSlide])],
  controllers: [HeroSlideController],
  providers: [HeroSlideService],
  exports: [HeroSlideService],
})
export class HeroSlideModule {}

