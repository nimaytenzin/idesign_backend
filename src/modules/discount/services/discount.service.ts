import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Discount, DiscountType, DiscountScope } from '../entities/discount.entity';
import { DiscountProduct } from '../entities/discount-product.entity';
import { DiscountCategory } from '../entities/discount-category.entity';
import { DiscountSubcategory } from '../entities/discount-subcategory.entity';
import { CreateDiscountDto } from '../dto/create-discount.dto';
import { UpdateDiscountDto } from '../dto/update-discount.dto';
import { DiscountQueryDto } from '../dto/discount-query.dto';
import { DiscountResponseDto } from '../dto/discount-response.dto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel(Discount)
    private discountModel: typeof Discount,
    @InjectModel(DiscountProduct)
    private discountProductModel: typeof DiscountProduct,
    @InjectModel(DiscountCategory)
    private discountCategoryModel: typeof DiscountCategory,
    @InjectModel(DiscountSubcategory)
    private discountSubcategoryModel: typeof DiscountSubcategory,
  ) {}

  async create(createDto: CreateDiscountDto): Promise<Discount> {
    // Validate dates
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate discount type specific requirements
    if (
      createDto.discountType === DiscountType.FLAT_SELECTED_PRODUCTS &&
      (!createDto.productIds || createDto.productIds.length === 0)
    ) {
      throw new BadRequestException(
        'Product IDs are required for FLAT_SELECTED_PRODUCTS discount type',
      );
    }

    if (
      createDto.discountType === DiscountType.FLAT_SELECTED_CATEGORIES &&
      (!createDto.categoryIds || createDto.categoryIds.length === 0) &&
      (!createDto.subCategoryIds || createDto.subCategoryIds.length === 0)
    ) {
      throw new BadRequestException(
        'Category or SubCategory IDs are required for FLAT_SELECTED_CATEGORIES discount type',
      );
    }

    // Validate discount value based on type
    if (createDto.valueType === 'PERCENTAGE' && createDto.discountValue > 100) {
      throw new BadRequestException(
        'Percentage discount cannot exceed 100%',
      );
    }

    // Create discount
    const discount = await this.discountModel.create({
      name: createDto.name,
      description: createDto.description,
      discountType: createDto.discountType,
      valueType: createDto.valueType,
      discountValue: createDto.discountValue,
      discountScope: createDto.discountScope || DiscountScope.PER_PRODUCT,
      startDate,
      endDate,
      isActive: createDto.isActive ?? true,
      maxUsageCount: createDto.maxUsageCount ?? null,
      minOrderValue: createDto.minOrderValue ?? null,
      voucherCode: createDto.voucherCode ?? null,
      usageCount: 0,
    });

    // Create associations based on discount type
    if (
      createDto.discountType === DiscountType.FLAT_SELECTED_PRODUCTS &&
      createDto.productIds
    ) {
      await Promise.all(
        createDto.productIds.map((productId) =>
          this.discountProductModel.create({
            discountId: discount.id,
            productId,
          }),
        ),
      );
    }

    if (
      createDto.discountType === DiscountType.FLAT_SELECTED_CATEGORIES
    ) {
      if (createDto.categoryIds && createDto.categoryIds.length > 0) {
        await Promise.all(
          createDto.categoryIds.map((categoryId) =>
            this.discountCategoryModel.create({
              discountId: discount.id,
              categoryId,
            }),
          ),
        );
      }

      if (createDto.subCategoryIds && createDto.subCategoryIds.length > 0) {
        await Promise.all(
          createDto.subCategoryIds.map((subCategoryId) =>
            this.discountSubcategoryModel.create({
              discountId: discount.id,
              subCategoryId,
            }),
          ),
        );
      }
    }

    return this.findOne(discount.id);
  }

  async findAll(queryDto?: DiscountQueryDto): Promise<Discount[]> {
    const where: any = {};

    if (queryDto?.discountType) {
      where.discountType = queryDto.discountType;
    }

    if (queryDto?.isActive !== undefined) {
      where.isActive = queryDto.isActive;
    }

    // Filter by date if provided (active discounts on that date)
    const filterDate = queryDto?.date ? new Date(queryDto.date) : new Date();
    where.startDate = { [Op.lte]: filterDate };
    where.endDate = { [Op.gte]: filterDate };

    return this.discountModel.findAll({
      where,
      include: [
        {
          model: DiscountProduct,
          as: 'discountProducts',
        },
        {
          model: DiscountCategory,
          as: 'discountCategories',
        },
        {
          model: DiscountSubcategory,
          as: 'discountSubcategories',
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  async findActive(date?: Date, options?: { autoApplyOnly?: boolean; sortBy?: 'value' | 'endDate' }): Promise<Discount[]> {
    const filterDate = date || new Date();
    const where: any = {
      isActive: true,
      startDate: { [Op.lte]: filterDate },
      endDate: { [Op.gte]: filterDate },
    };

    // Filter to show only auto-apply discounts (no voucher code required)
    if (options?.autoApplyOnly) {
      where.voucherCode = null;
    }

    // Determine sort order
    let order: any[] = [['createdAt', 'ASC']];
    if (options?.sortBy === 'value') {
      order = [['discountValue', 'DESC']];
    } else if (options?.sortBy === 'endDate') {
      order = [['endDate', 'ASC']]; // Ending soon first
    }

    return this.discountModel.findAll({
      where,
      include: [
        {
          model: DiscountProduct,
          as: 'discountProducts',
        },
        {
          model: DiscountCategory,
          as: 'discountCategories',
        },
        {
          model: DiscountSubcategory,
          as: 'discountSubcategories',
        },
      ],
      order,
    });
  }

  async findOne(id: number): Promise<Discount> {
    const discount = await this.discountModel.findByPk(id, {
      include: [
        {
          model: DiscountProduct,
          as: 'discountProducts',
        },
        {
          model: DiscountCategory,
          as: 'discountCategories',
        },
        {
          model: DiscountSubcategory,
          as: 'discountSubcategories',
        },
      ],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    return discount;
  }

  async update(id: number, updateDto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.findOne(id);

    // Validate dates if provided
    if (updateDto.startDate || updateDto.endDate) {
      const startDate = updateDto.startDate
        ? new Date(updateDto.startDate)
        : discount.startDate;
      const endDate = updateDto.endDate
        ? new Date(updateDto.endDate)
        : discount.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate discount value if percentage
    if (
      (updateDto.valueType || discount.valueType) === 'PERCENTAGE' &&
      (updateDto.discountValue ?? discount.discountValue) > 100
    ) {
      throw new BadRequestException(
        'Percentage discount cannot exceed 100%',
      );
    }

    // Update discount
    await discount.update({
      name: updateDto.name ?? discount.name,
      description: updateDto.description ?? discount.description,
      discountType: updateDto.discountType ?? discount.discountType,
      valueType: updateDto.valueType ?? discount.valueType,
      discountValue: updateDto.discountValue ?? discount.discountValue,
      discountScope: updateDto.discountScope ?? discount.discountScope,
      startDate: updateDto.startDate
        ? new Date(updateDto.startDate)
        : discount.startDate,
      endDate: updateDto.endDate
        ? new Date(updateDto.endDate)
        : discount.endDate,
      isActive:
        updateDto.isActive !== undefined
          ? updateDto.isActive
          : discount.isActive,
      maxUsageCount:
        updateDto.maxUsageCount !== undefined
          ? updateDto.maxUsageCount
          : discount.maxUsageCount,
      minOrderValue:
        updateDto.minOrderValue !== undefined
          ? updateDto.minOrderValue
          : discount.minOrderValue,
      voucherCode:
        updateDto.voucherCode !== undefined
          ? updateDto.voucherCode
          : discount.voucherCode,
    });

    // Update associations if discount type changed or IDs provided
    if (
      updateDto.discountType === DiscountType.FLAT_SELECTED_PRODUCTS &&
      updateDto.productIds
    ) {
      // Delete existing associations
      await this.discountProductModel.destroy({
        where: { discountId: id },
      });

      // Create new associations
      await Promise.all(
        updateDto.productIds.map((productId) =>
          this.discountProductModel.create({
            discountId: id,
            productId,
          }),
        ),
      );
    }

    if (
      updateDto.discountType === DiscountType.FLAT_SELECTED_CATEGORIES
    ) {
      if (updateDto.categoryIds) {
        await this.discountCategoryModel.destroy({
          where: { discountId: id },
        });
        await Promise.all(
          updateDto.categoryIds.map((categoryId) =>
            this.discountCategoryModel.create({
              discountId: id,
              categoryId,
            }),
          ),
        );
      }

      if (updateDto.subCategoryIds) {
        await this.discountSubcategoryModel.destroy({
          where: { discountId: id },
        });
        await Promise.all(
          updateDto.subCategoryIds.map((subCategoryId) =>
            this.discountSubcategoryModel.create({
              discountId: id,
              subCategoryId,
            }),
          ),
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const discount = await this.findOne(id);

    // Delete associations first
    await this.discountProductModel.destroy({
      where: { discountId: id },
    });
    await this.discountCategoryModel.destroy({
      where: { discountId: id },
    });
    await this.discountSubcategoryModel.destroy({
      where: { discountId: id },
    });

    await discount.destroy();
  }

  async toggleActive(id: number): Promise<Discount> {
    const discount = await this.findOne(id);
    await discount.update({ isActive: !discount.isActive });
    return discount.reload();
  }

  async incrementUsage(id: number): Promise<void> {
    const discount = await this.findOne(id);
    await discount.increment('usageCount');
  }

  mapToResponse(discount: Discount): DiscountResponseDto {
    const response: DiscountResponseDto = {
      id: discount.id,
      name: discount.name,
      description: discount.description,
      discountType: discount.discountType,
      valueType: discount.valueType,
      discountValue: parseFloat(discount.discountValue.toString()),
      discountScope: discount.discountScope,
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive,
      maxUsageCount: discount.maxUsageCount
        ? discount.maxUsageCount
        : null,
      minOrderValue: discount.minOrderValue
        ? parseFloat(discount.minOrderValue.toString())
        : null,
      voucherCode: discount.voucherCode,
      usageCount: discount.usageCount,
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
    };

    // Include association IDs
    if (discount.discountProducts) {
      response.productIds = discount.discountProducts.map((dp) => dp.productId);
    }

    if (discount.discountCategories) {
      response.categoryIds = discount.discountCategories.map(
        (dc) => dc.categoryId,
      );
    }

    if (discount.discountSubcategories) {
      response.subCategoryIds = discount.discountSubcategories.map(
        (ds) => ds.subCategoryId,
      );
    }

    return response;
  }
}

