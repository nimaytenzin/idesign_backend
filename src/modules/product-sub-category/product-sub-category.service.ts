import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductSubCategory } from './entities/product-sub-category.entity';
import { ProductCategory } from '../product-category/entities/product-category.entity';
import { CreateProductSubCategoryDto } from './dto/create-product-sub-category.dto';
import { UpdateProductSubCategoryDto } from './dto/update-product-sub-category.dto';

@Injectable()
export class ProductSubCategoryService {
  constructor(
    @InjectModel(ProductSubCategory)
    private productSubCategoryModel: typeof ProductSubCategory,
    @InjectModel(ProductCategory)
    private productCategoryModel: typeof ProductCategory,
  ) {}

  async create(
    createProductSubCategoryDto: CreateProductSubCategoryDto,
  ): Promise<ProductSubCategory> {
    // Validate that the parent category exists
    const parentCategory = await this.productCategoryModel.findByPk(
      createProductSubCategoryDto.productCategoryId,
    );

    if (!parentCategory) {
      throw new NotFoundException('Parent product category not found');
    }

    if (!parentCategory.isActive) {
      throw new ConflictException(
        'Cannot create subcategory under inactive parent category',
      );
    }

    return this.productSubCategoryModel.create({
      name: createProductSubCategoryDto.name,
      description: createProductSubCategoryDto.description,
      productCategoryId: createProductSubCategoryDto.productCategoryId,
      isActive: createProductSubCategoryDto.isActive ?? true,
    });
  }

  async findAll(): Promise<ProductSubCategory[]> {
    return this.productSubCategoryModel.findAll({
      include: [
        {
          model: ProductCategory,
          as: 'productCategory',
          attributes: ['id', 'name'],
        },
      ],
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
  }

  async findAllIncludingInactive(): Promise<ProductSubCategory[]> {
    return this.productSubCategoryModel.findAll({
      include: [
        {
          model: ProductCategory,
          as: 'productCategory',
          attributes: ['id', 'name'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findByCategory(categoryId: number): Promise<ProductSubCategory[]> {
    return this.productSubCategoryModel.findAll({
      where: {
        productCategoryId: categoryId,
        isActive: true,
      },
      include: [
        {
          model: ProductCategory,
          as: 'productCategory',
          attributes: ['id', 'name'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<ProductSubCategory> {
    const subCategory = await this.productSubCategoryModel.findByPk(id, {
      include: [
        {
          model: ProductCategory,
          as: 'productCategory',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!subCategory) {
      throw new NotFoundException('Product subcategory not found');
    }

    return subCategory;
  }

  async update(
    id: number,
    updateProductSubCategoryDto: UpdateProductSubCategoryDto,
  ): Promise<ProductSubCategory> {
    const subCategory = await this.findOne(id);

    // If updating the parent category, validate it exists
    if (updateProductSubCategoryDto.productCategoryId) {
      const parentCategory = await this.productCategoryModel.findByPk(
        updateProductSubCategoryDto.productCategoryId,
      );

      if (!parentCategory) {
        throw new NotFoundException('Parent product category not found');
      }

      if (!parentCategory.isActive) {
        throw new ConflictException(
          'Cannot move subcategory to inactive parent category',
        );
      }
    }

    await subCategory.update(updateProductSubCategoryDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const subCategory = await this.findOne(id);

    // TODO: Check if subcategory has products before deletion
    // This will be implemented when we update the Product entity

    await subCategory.destroy();
  }

  async toggleStatus(id: number): Promise<ProductSubCategory> {
    const subCategory = await this.findOne(id);
    await subCategory.update({ isActive: !subCategory.isActive });
    return this.findOne(id);
  }
}
