import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { DeliveryLocation } from './entities/delivery-location.entity';
import { CreateDeliveryLocationDto } from './dto/create-delivery-location.dto';
import { UpdateDeliveryLocationDto } from './dto/update-delivery-location.dto';
import { DeliveryRate } from '../delivery-rate/entities/delivery-rate.entity';

@Injectable()
export class DeliveryLocationService {
  constructor(
    @Inject('DELIVERY_LOCATION_REPOSITORY')
    private readonly deliveryLocationRepository: typeof DeliveryLocation,
  ) {}

  async create(
    createDeliveryLocationDto: CreateDeliveryLocationDto,
  ): Promise<DeliveryLocation> {
    // Check for duplicate name
    const existingLocation = await this.deliveryLocationRepository.findOne({
      where: { name: createDeliveryLocationDto.name,type: createDeliveryLocationDto.type },
    });

    if (existingLocation) {
      throw new BadRequestException(
        `A delivery location with name "${createDeliveryLocationDto.name}" and type "${createDeliveryLocationDto.type}" already exists`,
      );
    }

    return this.deliveryLocationRepository.create(createDeliveryLocationDto);
  }

  async findAll(): Promise<DeliveryLocation[]> {
    return this.deliveryLocationRepository.findAll({
      order: [['name', 'ASC']],
    });
  }
  async findAllWithRates(): Promise<DeliveryLocation[]> {
    return this.deliveryLocationRepository.findAll({
      include: [DeliveryRate  ],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<DeliveryLocation> {
    const location = await this.deliveryLocationRepository.findByPk(id);

    if (!location) {
      throw new NotFoundException(
        `Delivery location with ID ${id} not found`,
      );
    }

    return location;
  }

  async update(
    id: number,
    updateDeliveryLocationDto: UpdateDeliveryLocationDto,
  ): Promise<DeliveryLocation> {
    const location = await this.findOne(id);

    // If name is being updated, check for duplicates
    if (updateDeliveryLocationDto.name) {
      const existingLocation = await this.deliveryLocationRepository.findOne({
        where: {
          name: updateDeliveryLocationDto.name,
          id: { [Op.ne]: id },
        },
      });

      if (existingLocation) {
        throw new BadRequestException(
          `A delivery location with name "${updateDeliveryLocationDto.name}" already exists`,
        );
      }
    }

    await location.update(updateDeliveryLocationDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    await location.destroy();
  }
}
