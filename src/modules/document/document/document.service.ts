import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as path from 'path';
import type { Multer } from 'multer';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  private readonly ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    // PDF
    'application/pdf',
    // Word documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Excel
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  constructor(
    @InjectModel(Document)
    private documentModel: typeof Document,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    file?: Multer.File,
  ): Promise<Document> {
    try {
      let fileName: string;
      let fileUrl: string;
      let fileSize: number;
      let fileType: string;

      if (file) {
        // Validate file type
        if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          throw new BadRequestException(
            `File type not allowed. Allowed types: images (JPEG, PNG, GIF, WebP), PDF, Word documents, and Excel files`,
          );
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        fileName = `document-${uniqueSuffix}${ext}`;
        fileUrl = `/uploads/documents/${fileName}`;
        fileSize = file.size;
        fileType = file.mimetype;
      }

      return await this.documentModel.create({
        subCategoryId: createDocumentDto.subCategoryId,
        userId: createDocumentDto.userId,
        documentTitle: createDocumentDto.documentTitle,
        fileName: fileName,
        fileUrl: fileUrl,
        fileSize: fileSize,
        fileType: fileType,
        versionNumber: createDocumentDto.versionNumber ?? 1,
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new InternalServerErrorException(
          'Document with this name already exists',
        );
      }
      throw error;
    }
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
