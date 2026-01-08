import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductCategory } from './entities/product-category.entity';
import { ProductSubCategory } from '../product-sub-category/entities/product-sub-category.entity';
import { Product } from '../product/entities/product.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectModel(ProductCategory)
    private productCategoryModel: typeof ProductCategory,
    @InjectModel(ProductSubCategory)
    private productSubCategoryModel: typeof ProductSubCategory,
    @InjectModel(Product)
    private productModel: typeof Product,
  ) {}

  async create(
    createProductCategoryDto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    try {
      return await this.productCategoryModel.create({
        name: createProductCategoryDto.name,
        description: createProductCategoryDto.description,
        isActive: createProductCategoryDto.isActive ?? true,
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('A category with this name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<ProductCategory[]> {
    return this.productCategoryModel.findAll({
      include: [
        {
          model: ProductSubCategory,
          as: 'subCategories',
          required: false,
          where: { isActive: true },
        },
      ],
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
  }

  async findAllIncludingInactive(): Promise<ProductCategory[]> {
    return this.productCategoryModel.findAll({
      include: [
        {
          model: ProductSubCategory,
          as: 'subCategories',
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number): Promise<ProductCategory> {
    const category = await this.productCategoryModel.findByPk(id, {
      include: [
        {
          model: ProductSubCategory,
          as: 'subCategories',
          required: false,
          order: [['name', 'ASC']],
        },
      ],
    });

    if (!category) {
      throw new NotFoundException('Product category not found');
    }

    return category;
  }

  async update(
    id: number,
    updateProductCategoryDto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    const category = await this.findOne(id);

    try {
      await category.update(updateProductCategoryDto);
      return this.findOne(id);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('A category with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);

    // Check if category has subcategories
    const subCategories = await this.productSubCategoryModel.findAll({
      where: { productCategoryId: id },
    });

    if (subCategories && subCategories.length > 0) {
      // Check if any subcategory has products
      for (const subCategory of subCategories) {
        const products = await this.productModel.findAll({
          where: { productSubCategoryId: subCategory.id },
          limit: 1,
        });

        if (products && products.length > 0) {
          throw new ConflictException(
            `Cannot delete category that has subcategories with products. Please delete or reassign products in subcategory "${subCategory.name}" first.`,
          );
        }
      }

      throw new ConflictException(
        'Cannot delete category that has subcategories. Remove subcategories first.',
      );
    }

    await category.destroy();
  }

  async toggleStatus(id: number): Promise<ProductCategory> {
    const category = await this.findOne(id);
    await category.update({ isActive: !category.isActive });
    return this.findOne(id);
  }
}
