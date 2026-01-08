import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DocumentCategory } from './entities/document-category.entity';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';
import { DocumentSubCategory } from '../document-sub-category/entities/document-sub-category.entity';

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

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await category.destroy();
  }
}
