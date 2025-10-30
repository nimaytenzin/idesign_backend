import { Survey } from './entities/survey.entity';
import { SurveyEnumerationArea } from './entities/survey-enumeration-area.entity';

export const surveyProviders = [
  {
    provide: 'SURVEY_REPOSITORY',
    useValue: Survey,
  },
  {
    provide: 'SURVEY_ENUMERATION_AREA_REPOSITORY',
    useValue: SurveyEnumerationArea,
  },
];
