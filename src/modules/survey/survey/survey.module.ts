import { Module } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { surveyProviders } from './survey.provider';
import { DatabaseModule } from '../../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SurveyController],
  providers: [SurveyService, ...surveyProviders],
  exports: [SurveyService],
})
export class SurveyModule {}
