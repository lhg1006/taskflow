import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { ActivityService, ActivityType } from '../activity/activity.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class AttachmentService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async create(
    dto: CreateAttachmentDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    const attachment = await this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        cardId: dto.cardId,
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Log activity
    await this.activityService.logActivity(
      dto.cardId,
      userId,
      ActivityType.ADD_ATTACHMENT,
      { filename: file.originalname },
    );

    return attachment;
  }

  async findByCardId(cardId: string) {
    return this.prisma.attachment.findMany({
      where: { cardId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.attachment.findUnique({
      where: { id },
    });
  }

  async remove(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Delete file from filesystem
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, attachment.storedName);

    try {
      await unlinkAsync(filePath);
    } catch (error) {
      // File might not exist, continue with database deletion
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await this.prisma.attachment.delete({ where: { id } });

    // Log activity
    await this.activityService.logActivity(
      attachment.cardId,
      userId,
      ActivityType.DELETE_ATTACHMENT,
      { filename: attachment.filename },
    );

    return { message: 'Attachment deleted successfully' };
  }
}
