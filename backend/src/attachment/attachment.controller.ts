import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AttachmentService } from './attachment.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentController {
  constructor(private attachmentService: AttachmentService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          // Decode filename from latin1 to UTF-8
          const originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf8',
          );
          const ext = extname(originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Decode filename from latin1 to UTF-8 for storage
    file.originalname = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );

    return this.attachmentService.create(dto, file, user.id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.attachmentService.findById(id);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const filePath = require('path').join(
      process.cwd(),
      'uploads',
      attachment.storedName,
    );

    // Set Content-Disposition header to force download with UTF-8 encoding
    const encodedFilename = encodeURIComponent(attachment.filename);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    );
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(filePath);
  }

  @Get()
  async findByCardId(@Query('cardId') cardId: string) {
    if (!cardId) {
      throw new BadRequestException('cardId is required');
    }
    return this.attachmentService.findByCardId(cardId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.attachmentService.remove(id, user.id);
  }
}
