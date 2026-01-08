import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DocumentSubCategory } from './entities/document-sub-category.entity';
import { UpdateDocumentSubCategoryDto } from './dto/update-document-sub-category.dto';
import { CreateDocumentSubCategoryDto } from './dto/create-document-sub-category.dto';
import { DocumentCategory } from '../document-category/entities/document-category.entity';

@Injectable()
export class DocumentSubCategoryService {
  constructor(
    @InjectModel(DocumentSubCategory)
    private documentSubCategoryModel: typeof DocumentSubCategory,
  ) {}

  async create(
    createDocumentSubCategoryDto: CreateDocumentSubCategoryDto,
  ): Promise<DocumentSubCategory> {
    try {
          return await this.documentSubCategoryModel.create({
            categoryId: createDocumentSubCategoryDto.categoryId,
            subCategoryName: createDocumentSubCategoryDto.subCategoryName,
          });
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            throw new ConflictException('A sub category of document with this name already exists');
          }
          throw error;
        }
  }

  async findAll(): Promise<DocumentSubCategory[]> {
     return this.documentSubCategoryModel.findAll({
             include: [
               {
                 model: DocumentCategory,
                 as: 'category',
                 required: true,
               },
             ],
             order: [['subCategoryName', 'ASC']],
           });
  }

  async findOne(id: number): Promise<DocumentSubCategory> {

    const subCategory = await this.documentSubCategoryModel.findByPk(id,{
              include: [
                {
                  model: DocumentCategory,
                  as: 'category',
                  required: true,
                  order: [['subCategoryName', 'ASC']],
                },
              ],
            });
    if (!subCategory) {
      throw new NotFoundException(
        `Document sub-category with ID ${id} not found`,
      );
    }
    return subCategory;
  }

  async update(
    id: number,
    updateDocumentSubCategoryDto: UpdateDocumentSubCategoryDto,
  ): Promise<DocumentSubCategory> {
    const subCategory = await this.findOne(id);
    await subCategory.update(updateDocumentSubCategoryDto as any);
    return subCategory;
  }

  async remove(id: number): Promise<void> {
    const subCategory = await this.findOne(id);
    await subCategory.destroy();
  }
}
