import { Inject, Injectable } from '@nestjs/common';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { Survey } from './entities/survey.entity';
import { SurveyEnumerationArea } from './entities/survey-enumeration-area.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class SurveyService {
  constructor(
    @Inject('SURVEY_REPOSITORY')
    private readonly surveyRepository: typeof Survey,
    @Inject('SURVEY_ENUMERATION_AREA_REPOSITORY')
    private readonly surveyEnumerationAreaRepository: typeof SurveyEnumerationArea,
  ) {}

  async create(createSurveyDto: CreateSurveyDto): Promise<Survey> {
    const { enumerationAreaIds, ...surveyData } = createSurveyDto;

    // Create the survey
    const survey = await this.surveyRepository.create(
      instanceToPlain(surveyData),
    );

    // Associate enumeration areas if provided
    if (enumerationAreaIds && enumerationAreaIds.length > 0) {
      const surveyEAs = enumerationAreaIds.map((eaId) => ({
        surveyId: survey.id,
        enumerationAreaId: eaId,
      }));
      await this.surveyEnumerationAreaRepository.bulkCreate(surveyEAs);
    }

    return this.findOne(survey.id);
  }

  async findAll(): Promise<Survey[]> {
    return await this.surveyRepository.findAll<Survey>({
      include: ['enumerationAreas'],
    });
  }

  async findOne(id: number): Promise<Survey> {
    return await this.surveyRepository.findOne<Survey>({
      where: { id },
      include: ['enumerationAreas'],
    });
  }

  async update(id: number, updateSurveyDto: UpdateSurveyDto): Promise<Survey> {
    const { enumerationAreaIds, ...surveyData } = updateSurveyDto;

    // Update survey data
    const [numRows] = await this.surveyRepository.update(
      instanceToPlain(surveyData),
      {
        where: { id },
      },
    );

    if (numRows === 0) {
      throw new Error(`Survey with ID ${id} not found`);
    }

    // Update enumeration areas if provided
    if (enumerationAreaIds !== undefined) {
      // Remove existing associations
      await this.surveyEnumerationAreaRepository.destroy({
        where: { surveyId: id },
      });

      // Add new associations
      if (enumerationAreaIds.length > 0) {
        const surveyEAs = enumerationAreaIds.map((eaId) => ({
          surveyId: id,
          enumerationAreaId: eaId,
        }));
        await this.surveyEnumerationAreaRepository.bulkCreate(surveyEAs);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<number> {
    // Delete associated enumeration areas first
    await this.surveyEnumerationAreaRepository.destroy({
      where: { surveyId: id },
    });

    // Delete the survey
    return await this.surveyRepository.destroy({
      where: { id },
    });
  }

  async addEnumerationAreas(
    surveyId: number,
    enumerationAreaIds: number[],
  ): Promise<Survey> {
    const surveyEAs = enumerationAreaIds.map((eaId) => ({
      surveyId,
      enumerationAreaId: eaId,
    }));

    await this.surveyEnumerationAreaRepository.bulkCreate(surveyEAs, {
      ignoreDuplicates: true,
    });

    return this.findOne(surveyId);
  }

  async removeEnumerationAreas(
    surveyId: number,
    enumerationAreaIds: number[],
  ): Promise<Survey> {
    await this.surveyEnumerationAreaRepository.destroy({
      where: {
        surveyId,
        enumerationAreaId: enumerationAreaIds,
      },
    });

    return this.findOne(surveyId);
  }
}
