import { Inject, Injectable } from '@nestjs/common';
import { CreateCurrentHouseholdListingDto } from './dto/create-current-household-listing.dto';
import { UpdateCurrentHouseholdListingDto } from './dto/update-current-household-listing.dto';
import { CurrentHouseholdListing } from './entities/current-household-listing.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class CurrentHouseholdListingService {
  constructor(
    @Inject('CURRENT_HOUSEHOLD_LISTING_REPOSITORY')
    private readonly currentHouseholdListingRepository: typeof CurrentHouseholdListing,
  ) {}

  async create(
    createCurrentHouseholdListingDto: CreateCurrentHouseholdListingDto,
  ): Promise<CurrentHouseholdListing> {
    return await this.currentHouseholdListingRepository.create(
      instanceToPlain(createCurrentHouseholdListingDto),
    );
  }

  async findAll(): Promise<CurrentHouseholdListing[]> {
    return await this.currentHouseholdListingRepository.findAll<CurrentHouseholdListing>(
      {
        include: ['enumerationArea'],
      },
    );
  }

  async findByEnumerationArea(
    eaId: number,
  ): Promise<CurrentHouseholdListing[]> {
    return await this.currentHouseholdListingRepository.findAll<CurrentHouseholdListing>(
      {
        where: { eaId },
        include: ['enumerationArea'],
      },
    );
  }

  async findOne(id: number): Promise<CurrentHouseholdListing> {
    return await this.currentHouseholdListingRepository.findOne<CurrentHouseholdListing>(
      {
        where: { id },
        include: ['enumerationArea'],
      },
    );
  }

  async update(
    id: number,
    updateCurrentHouseholdListingDto: UpdateCurrentHouseholdListingDto,
  ): Promise<CurrentHouseholdListing> {
    const [numRows, updatedRows] =
      await this.currentHouseholdListingRepository.update(
        instanceToPlain(updateCurrentHouseholdListingDto),
        {
          where: { id },
          returning: true,
        },
      );

    if (numRows === 0) {
      throw new Error(`Current household listing with ID ${id} not found`);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<number> {
    return await this.currentHouseholdListingRepository.destroy({
      where: { id },
    });
  }
}
