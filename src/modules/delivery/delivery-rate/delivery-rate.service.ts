import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { DeliveryRate } from './entities/delivery-rate.entity';
import { DeliveryLocation } from '../delivery-location/entities/delivery-location.entity';
import { CreateDeliveryRateDto } from './dto/create-delivery-rate.dto';
import { UpdateDeliveryRateDto } from './dto/update-delivery-rate.dto';

@Injectable()
export class DeliveryRateService {
  constructor(
    @Inject('DELIVERY_RATE_REPOSITORY')
    private readonly deliveryRateRepository: typeof DeliveryRate,
    @Inject('DELIVERY_LOCATION_REPOSITORY')
    private readonly deliveryLocationRepository: typeof DeliveryLocation,
  ) {}

  async create(
    createDeliveryRateDto: CreateDeliveryRateDto,
  ): Promise<DeliveryRate> {
    // Verify delivery location exists
    const deliveryLocation = await this.deliveryLocationRepository.findByPk(
      createDeliveryRateDto.deliveryLocationId,
    );

    if (!deliveryLocation) {
      throw new NotFoundException(
        `Delivery location with ID ${createDeliveryRateDto.deliveryLocationId} not found`,
      );
    }

    // Check for duplicate (deliveryLocationId + deliveryMethod) combination
    const existingRate = await this.deliveryRateRepository.findOne({
      where: {
        deliveryLocationId: createDeliveryRateDto.deliveryLocationId,
        transportMode: createDeliveryRateDto.transportMode,
      },
    });

    if (existingRate) {
      throw new BadRequestException(
        `A delivery rate already exists for ${deliveryLocation.name} with ${createDeliveryRateDto.transportMode} method`,
      );
    }

    return this.deliveryRateRepository.create({
      deliveryLocationId: createDeliveryRateDto.deliveryLocationId,
      transportMode: createDeliveryRateDto.transportMode,
      rate: createDeliveryRateDto.rate,
    });
  }

  async findAll(): Promise<DeliveryRate[]> {

    return this.deliveryRateRepository.findAll({
      include: [DeliveryLocation],
      order: [['transportMode', 'ASC']],
    });
  }

  async findOne(id: number): Promise<DeliveryRate> {
    const rate = await this.deliveryRateRepository.findByPk(id, {
      include: [DeliveryLocation],
    });

    if (!rate) {
      throw new NotFoundException(`Delivery rate with ID ${id} not found`);
    }

    return rate;
  }

  async update(
    id: number,
    updateDeliveryRateDto: UpdateDeliveryRateDto,
  ): Promise<DeliveryRate> {
    const rate = await this.findOne(id);

    // If deliveryLocationId is being updated, verify it exists
    if (updateDeliveryRateDto.deliveryLocationId) {
      const deliveryLocation = await this.deliveryLocationRepository.findByPk(
        updateDeliveryRateDto.deliveryLocationId,
      );

      if (!deliveryLocation) {
        throw new NotFoundException(
          `Delivery location with ID ${updateDeliveryRateDto.deliveryLocationId} not found`,
        );
      }
    }

    // If deliveryLocationId or deliveryMethod is being updated, check for duplicates
    if (
      updateDeliveryRateDto.deliveryLocationId ||
      updateDeliveryRateDto.transportMode
    ) {
      const newLocationId =
        updateDeliveryRateDto.deliveryLocationId ?? rate.deliveryLocationId;
      const newMethod =
        updateDeliveryRateDto.transportMode ?? rate.transportMode;

      // Check if another rate exists with the same combination (excluding current rate)
      const existingRate = await this.deliveryRateRepository.findOne({
        where: {
          deliveryLocationId: newLocationId,
          transportMode: newMethod,
          id: { [Op.ne]: id },
        },
      });

      if (existingRate) {
        const location = await this.deliveryLocationRepository.findByPk(
          newLocationId,
        );
        throw new BadRequestException(
          `A delivery rate already exists for ${location?.name || newLocationId} with ${newMethod} method`,
        );
      }
    }

    await rate.update(updateDeliveryRateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const rate = await this.findOne(id);
    await rate.destroy();
  }
}
