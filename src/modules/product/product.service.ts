import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSubCategory } from '../product-sub-category/entities/product-sub-category.entity';
import { ProductCategory } from '../product-category/entities/product-category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Op, Order } from 'sequelize';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product)
    private productModel: typeof Product,
    @InjectModel(ProductImage)
    private productImageModel: typeof ProductImage,
    @InjectModel(ProductSubCategory)
    private productSubCategoryModel: typeof ProductSubCategory,
    @InjectModel(ProductCategory)
    private productCategoryModel: typeof ProductCategory,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Validate subcategory exists
    const subcategory = await this.productSubCategoryModel.findByPk(
      createProductDto.productSubCategoryId,
    );
    if (!subcategory) {
      throw new NotFoundException('Product subcategory not found');
    }

    const productData = {
      ...createProductDto,
      isAvailable:
        createProductDto.isAvailable ?? createProductDto.stockQuantity > 0,
    };

    return this.productModel.create(productData);
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.findAll({
      include: [
        {
          model: ProductSubCategory,
          as: 'productSubCategory',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              model: ProductCategory,
              as: 'productCategory',
              attributes: ['id', 'name', 'description'],
            },
          ],
        },
        {
          model: ProductImage,
          as: 'images',
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findAllWithQuery(queryDto: ProductQueryDto): Promise<Product[]> {
    const where: any = {};
    const order: Order = [];

    // Build where conditions
    if (queryDto.category) {
      // Find category by name first, then find subcategories
      const category = await this.productCategoryModel.findOne({
        where: { name: { [Op.iLike]: `%${queryDto.category}%` } },
      });
      if (category) {
        const subcategories = await this.productSubCategoryModel.findAll({
          where: { productCategoryId: category.id },
        });
        if (subcategories.length > 0) {
          where.productSubCategoryId = {
            [Op.in]: subcategories.map((sub) => sub.id),
          };
        }
      }
    }

    if (queryDto.material) {
      where.material = { [Op.iLike]: `%${queryDto.material}%` };
    }

    if (queryDto.availability !== undefined) {
      where.isAvailable = queryDto.availability;
    }

    if (queryDto.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${queryDto.search}%` } },
        { shortDescription: { [Op.iLike]: `%${queryDto.search}%` } },
        { detailedDescription: { [Op.iLike]: `%${queryDto.search}%` } },
      ];
    }

    // Build order conditions
    switch (queryDto.sortBy) {
      case 'price_asc':
        order.push(['price', 'ASC']);
        break;
      case 'price_desc':
        order.push(['price', 'DESC']);
        break;
      case 'newest':
        order.push(['createdAt', 'DESC']);
        break;
      case 'rating':
        order.push(['rating', 'DESC']);
        break;
      case 'best_selling':
        order.push(['salesCount', 'DESC']);
        break;
      case 'size':
        order.push(['dimensions', 'ASC']);
        break;
      default:
        order.push(['createdAt', 'DESC']);
    }

    return this.productModel.findAll({
      where,
      order,
      include: [
        {
          model: ProductSubCategory,
          as: 'productSubCategory',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              model: ProductCategory,
              as: 'productCategory',
              attributes: ['id', 'name', 'description'],
            },
          ],
        },
        {
          model: ProductImage,
          as: 'images',
          required: false,
        },
      ],
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productModel.findByPk(id, {
      include: [
        {
          model: ProductSubCategory,
          as: 'productSubCategory',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              model: ProductCategory,
              as: 'productCategory',
              attributes: ['id', 'name', 'description'],
            },
          ],
        },
        {
          model: ProductImage,
          as: 'images',
          required: false,
        },
      ],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Validate subcategory if being updated
    if (updateProductDto.productSubCategoryId) {
      const subcategory = await this.productSubCategoryModel.findByPk(
        updateProductDto.productSubCategoryId,
      );
      if (!subcategory) {
        throw new NotFoundException('Product subcategory not found');
      }
    }

    const updateData = {
      ...updateProductDto,
    };

    // Update availability based on stock if not explicitly set
    if (
      updateProductDto.stockQuantity !== undefined &&
      updateProductDto.isAvailable === undefined
    ) {
      updateData.isAvailable = updateProductDto.stockQuantity > 0;
    }

    await product.update(updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await product.destroy();
  }

  async incrementSales(id: number): Promise<Product> {
    const product = await this.findOne(id);
    await product.update({ salesCount: product.salesCount + 1 });
    return this.findOne(id);
  }

  async updateRating(id: number, rating: number): Promise<Product> {
    const product = await this.findOne(id);
    await product.update({ rating });
    return this.findOne(id);
  }

  // ProductImage methods
  async addImage(
    createProductImageDto: CreateProductImageDto,
  ): Promise<ProductImage> {
    // Validate product exists
    const product = await this.findOne(createProductImageDto.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If this is set as primary, remove primary status from other images
    if (createProductImageDto.isPrimary) {
      await this.productImageModel.update(
        { isPrimary: false },
        { where: { productId: createProductImageDto.productId } },
      );
    }

    return this.productImageModel.create(createProductImageDto);
  }

  async updateImage(
    id: number,
    updateProductImageDto: UpdateProductImageDto,
  ): Promise<ProductImage> {
    const productImage = await this.productImageModel.findByPk(id);
    if (!productImage) {
      throw new NotFoundException('Product image not found');
    }

    // If this is set as primary, remove primary status from other images
    if (updateProductImageDto.isPrimary) {
      await this.productImageModel.update(
        { isPrimary: false },
        {
          where: {
            productId: productImage.productId,
            id: { [Op.ne]: id },
          },
        },
      );
    }

    await productImage.update(updateProductImageDto);
    return productImage;
  }

  async removeImage(id: number): Promise<void> {
    const productImage = await this.productImageModel.findByPk(id);
    if (!productImage) {
      throw new NotFoundException('Product image not found');
    }
    await productImage.destroy();
  }

  async getProductImages(productId: number): Promise<ProductImage[]> {
    return this.productImageModel.findAll({
      where: { productId },
      order: [['createdAt', 'ASC']],
    });
  }

  async setPrimaryImage(
    productId: number,
    imageId: number,
  ): Promise<ProductImage> {
    // Remove primary status from all images of this product
    await this.productImageModel.update(
      { isPrimary: false },
      { where: { productId } },
    );

    // Set the specified image as primary
    const productImage = await this.productImageModel.findOne({
      where: { id: imageId, productId },
    });

    if (!productImage) {
      throw new NotFoundException('Product image not found');
    }

    await productImage.update({ isPrimary: true });
    return productImage;
  }
}
