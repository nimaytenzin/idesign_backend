import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document)
    private documentModel: typeof Document,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    return await this.documentModel.create(createDocumentDto as any);
  }

  async findAll(): Promise<Document[]> {
    return await this.documentModel.findAll({
      include: ['subCategory', 'user'],
    });
  }

  async findOne(id: number): Promise<Document> {
    const document = await this.documentModel.findByPk(id, {
      include: ['subCategory', 'user'],
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async findBySubCategory(subCategoryId: number): Promise<Document[]> {
    return await this.documentModel.findAll({
      where: { subCategoryId },
      include: ['subCategory', 'user'],
    });
  }

  async findByUser(userId: number): Promise<Document[]> {
    return await this.documentModel.findAll({
      where: { userId },
      include: ['subCategory', 'user'],
    });
  }

  async update(
    id: number,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    const document = await this.findOne(id);
    await document.update(updateDocumentDto as any);
    return document;
  }

  async remove(id: number): Promise<void> {
    const document = await this.findOne(id);
    await document.destroy();
  }

  async incrementVersion(id: number): Promise<Document> {
    const document = await this.findOne(id);
    await document.increment('versionNumber');
    return document;
  }
}
