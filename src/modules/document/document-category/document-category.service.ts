import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DocumentCategory } from './entities/document-category.entity';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';
import { DeleteDocumentCategoryResponseDto } from './dto/delete-document-category-response.dto';
import { ForceDeleteDocumentCategoryResponseDto } from './dto/force-delete-document-category-response.dto';
import { DocumentSubCategory } from '../document-sub-category/entities/document-sub-category.entity';
import { Document } from '../document/entities/document.entity';

@Injectable()
export class DocumentCategoryService {
  constructor(
    @InjectModel(DocumentCategory)
    private documentCategoryModel: typeof DocumentCategory,
  ) {}

  async create(
    createDocumentCategoryDto: CreateDocumentCategoryDto,
  ): Promise<DocumentCategory> {

     try {
        return await this.documentCategoryModel.create({
        categoryName: createDocumentCategoryDto.categoryName,
        description: createDocumentCategoryDto.description,
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('Document category with this name already exists');
        }
        throw error;
    }      
  }

  async findAll(): Promise<DocumentCategory[]> {
    return this.documentCategoryModel.findAll({
         include: [
           {
             model: DocumentSubCategory,
             as: 'documentSubCategories',
             required: false,
           },
         ],
         order: [['categoryName', 'ASC']],
       });
  }

  async findOne(id: number): Promise<DocumentCategory> {
    const category = await this.documentCategoryModel.findByPk(id,
         {
              include: [
                {
                  model: DocumentSubCategory,
                  as: 'documentSubCategories',
                  required: false,
                  order: [['categoryName', 'ASC']],
                },
              ],
            });

    if (!category) {
      throw new NotFoundException(`Document category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: number,
    updateDocumentCategoryDto: UpdateDocumentCategoryDto,
  ): Promise<DocumentCategory> {
    const category = await this.findOne(id);
    await category.update(updateDocumentCategoryDto as any);
    return category;
  }

  async remove(id: number): Promise<DeleteDocumentCategoryResponseDto> {
    const category = await this.findOne(id);

    // Check if there are any sub-categories with documents
    const subCategoriesWithDocs = await DocumentSubCategory.findAll({
      where: { categoryId: id },
      include: [
        {
          model: Document,
          required: true,
        },
      ],
    });

    if (subCategoriesWithDocs.length > 0) {
      throw new ConflictException(
        `Cannot delete document category "${category.categoryName}" because it contains documents. Please delete all documents first.`,
      );
    }

    const categoryName = category.categoryName;
    const categoryId = category.categoryId;
    await category.destroy();

    return {
      success: true,
      message: `Document category "${categoryName}" has been successfully deleted.`,
      categoryId,
      categoryName,
    };
  }

  async forceDelete(
    id: number,
  ): Promise<ForceDeleteDocumentCategoryResponseDto> {
    const category = await this.findOne(id);

    // Get all sub-categories for this category
    const subCategories = await DocumentSubCategory.findAll({
      where: { categoryId: id },
    });

    let deletedDocumentsCount = 0;

    // Delete all documents in each sub-category
    for (const subCategory of subCategories) {
      const documentsCount = await Document.count({
        where: { subCategoryId: subCategory.subCategoryId },
      });

      if (documentsCount > 0) {
        await Document.destroy({
          where: { subCategoryId: subCategory.subCategoryId },
        });
        deletedDocumentsCount += documentsCount;
      }
    }

    // Delete all sub-categories
    const deletedSubCategoriesCount = subCategories.length;
    await DocumentSubCategory.destroy({
      where: { categoryId: id },
    });

    // Delete the category itself
    const categoryName = category.categoryName;
    const categoryId = category.categoryId;
    await category.destroy();

    return {
      success: true,
      message: `Document category "${categoryName}" and all its sub-categories and documents have been successfully deleted.`,
      categoryId,
      categoryName,
      deletedSubCategoriesCount,
      deletedDocumentsCount,
    };
  }
}
