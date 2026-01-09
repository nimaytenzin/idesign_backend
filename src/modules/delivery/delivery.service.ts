import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { DeliveryRate } from './entities/delivery-rate.entity';
import { CreateDeliveryRateDto } from './dto/create-delivery-rate.dto';
import { UpdateDeliveryRateDto } from './dto/update-delivery-rate.dto';
import { DeliveryRateQueryDto } from './dto/delivery-rate-query.dto';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(DeliveryRate)
    private deliveryRateModel: typeof DeliveryRate,
  ) {}

  async create(
    createDeliveryRateDto: CreateDeliveryRateDto,
  ): Promise<DeliveryRate> {
    // Check for duplicate (location + deliveryMethod) combination
    const existingRate = await this.deliveryRateModel.findOne({
      where: {
        location: createDeliveryRateDto.location,
        deliveryMethod: createDeliveryRateDto.deliveryMethod,
      },
    });

    if (existingRate) {
      throw new BadRequestException(
        `A delivery rate already exists for ${createDeliveryRateDto.location} with ${createDeliveryRateDto.deliveryMethod} method`,
      );
    }

    return this.deliveryRateModel.create({
      location: createDeliveryRateDto.location,
      deliveryMethod: createDeliveryRateDto.deliveryMethod,
      rate: createDeliveryRateDto.rate,
    });
  }

  async findAll(query?: DeliveryRateQueryDto): Promise<DeliveryRate[]> {
    const where: any = {};

    if (query?.location) {
      where.location = query.location;
    }

    if (query?.deliveryMethod) {
      where.deliveryMethod = query.deliveryMethod;
    }

    return this.deliveryRateModel.findAll({
      where,
      order: [['location', 'ASC'], ['deliveryMethod', 'ASC']],
    });
  }

  async findOne(id: number): Promise<DeliveryRate> {
    const rate = await this.deliveryRateModel.findByPk(id);

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

    // If location or deliveryMethod is being updated, check for duplicates
    if (
      updateDeliveryRateDto.location ||
      updateDeliveryRateDto.deliveryMethod
    ) {
      const newLocation =
        updateDeliveryRateDto.location ?? rate.location;
      const newMethod =
        updateDeliveryRateDto.deliveryMethod ?? rate.deliveryMethod;

      // Check if another rate exists with the same combination (excluding current rate)
      const existingRate = await this.deliveryRateModel.findOne({
        where: {
          location: newLocation,
          deliveryMethod: newMethod,
          id: { [Op.ne]: id },
        },
      });

      if (existingRate) {
        throw new BadRequestException(
          `A delivery rate already exists for ${newLocation} with ${newMethod} method`,
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

