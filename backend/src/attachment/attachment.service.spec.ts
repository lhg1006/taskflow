import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService, ActivityType } from '../activity/activity.service';

// Mock the fs/promises unlink function
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: (fn: any) => jest.fn().mockResolvedValue(undefined),
}));

describe('AttachmentService', () => {
  let service: AttachmentService;
  let prismaService: PrismaService;
  let activityService: ActivityService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    filename: 'upload-123456.pdf',
    path: '/uploads/upload-123456.pdf',
    destination: '/uploads',
    buffer: Buffer.from(''),
    stream: null,
  };

  const mockAttachment = {
    id: 'attachment-1',
    filename: 'test-document.pdf',
    storedName: 'upload-123456.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    url: '/uploads/upload-123456.pdf',
    cardId: 'card-1',
    uploadedById: 'user-1',
    createdAt: new Date(),
    uploadedBy: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentService,
        {
          provide: PrismaService,
          useValue: {
            attachment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: ActivityService,
          useValue: {
            logActivity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AttachmentService>(AttachmentService);
    prismaService = module.get<PrismaService>(PrismaService);
    activityService = module.get<ActivityService>(ActivityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAttachmentDto = {
      cardId: 'card-1',
    };

    it('should create an attachment successfully', async () => {
      jest.spyOn(prismaService.attachment, 'create').mockResolvedValue(mockAttachment as any);

      const result = await service.create(createAttachmentDto, mockFile, 'user-1');

      expect(prismaService.attachment.create).toHaveBeenCalledWith({
        data: {
          filename: 'test-document.pdf',
          storedName: 'upload-123456.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          url: '/uploads/upload-123456.pdf',
          cardId: 'card-1',
          uploadedById: 'user-1',
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
      expect(activityService.logActivity).toHaveBeenCalledWith(
        'card-1',
        'user-1',
        ActivityType.ADD_ATTACHMENT,
        { filename: 'test-document.pdf' },
      );
      expect(result).toEqual(mockAttachment);
    });

    it('should handle file metadata correctly', async () => {
      const largeFile = { ...mockFile, size: 5242880, originalname: 'large-file.zip' };
      const largeAttachment = { ...mockAttachment, size: 5242880, filename: 'large-file.zip' };
      
      jest.spyOn(prismaService.attachment, 'create').mockResolvedValue(largeAttachment as any);

      const result = await service.create(createAttachmentDto, largeFile, 'user-1');

      expect(result.size).toBe(5242880);
      expect(result.filename).toBe('large-file.zip');
    });
  });

  describe('findByCardId', () => {
    it('should return all attachments for a card', async () => {
      const mockAttachments = [mockAttachment];
      jest.spyOn(prismaService.attachment, 'findMany').mockResolvedValue(mockAttachments as any);

      const result = await service.findByCardId('card-1');

      expect(prismaService.attachment.findMany).toHaveBeenCalledWith({
        where: { cardId: 'card-1' },
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
      expect(result).toEqual(mockAttachments);
    });

    it('should return empty array when no attachments exist', async () => {
      jest.spyOn(prismaService.attachment, 'findMany').mockResolvedValue([]);

      const result = await service.findByCardId('card-1');

      expect(result).toEqual([]);
    });

    it('should order attachments by creation date descending', async () => {
      const mockAttachments = [
        { ...mockAttachment, id: 'attachment-1', createdAt: new Date('2024-01-02') },
        { ...mockAttachment, id: 'attachment-2', createdAt: new Date('2024-01-01') },
      ];
      jest.spyOn(prismaService.attachment, 'findMany').mockResolvedValue(mockAttachments as any);

      await service.findByCardId('card-1');

      expect(prismaService.attachment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return an attachment by id', async () => {
      jest.spyOn(prismaService.attachment, 'findUnique').mockResolvedValue(mockAttachment as any);

      const result = await service.findById('attachment-1');

      expect(prismaService.attachment.findUnique).toHaveBeenCalledWith({
        where: { id: 'attachment-1' },
      });
      expect(result).toEqual(mockAttachment);
    });

    it('should return null if attachment does not exist', async () => {
      jest.spyOn(prismaService.attachment, 'findUnique').mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete an attachment successfully', async () => {
      jest.spyOn(prismaService.attachment, 'findUnique').mockResolvedValue(mockAttachment as any);
      jest.spyOn(prismaService.attachment, 'delete').mockResolvedValue(mockAttachment as any);

      const result = await service.remove('attachment-1', 'user-1');

      expect(prismaService.attachment.findUnique).toHaveBeenCalledWith({
        where: { id: 'attachment-1' },
      });
      expect(prismaService.attachment.delete).toHaveBeenCalledWith({
        where: { id: 'attachment-1' },
      });
      expect(activityService.logActivity).toHaveBeenCalledWith(
        'card-1',
        'user-1',
        ActivityType.DELETE_ATTACHMENT,
        { filename: 'test-document.pdf' },
      );
      expect(result.message).toBe('Attachment deleted successfully');
    });

    it('should throw NotFoundException if attachment does not exist', async () => {
      jest.spyOn(prismaService.attachment, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id', 'user-1')).rejects.toThrow(
        'Attachment not found',
      );
    });

    it('should delete from database even if file deletion fails', async () => {
      jest.spyOn(prismaService.attachment, 'findUnique').mockResolvedValue(mockAttachment as any);
      jest.spyOn(prismaService.attachment, 'delete').mockResolvedValue(mockAttachment as any);

      const result = await service.remove('attachment-1', 'user-1');

      expect(prismaService.attachment.delete).toHaveBeenCalled();
      expect(result.message).toBe('Attachment deleted successfully');
    });

    it('should log activity after successful deletion', async () => {
      jest.spyOn(prismaService.attachment, 'findUnique').mockResolvedValue(mockAttachment as any);
      jest.spyOn(prismaService.attachment, 'delete').mockResolvedValue(mockAttachment as any);

      await service.remove('attachment-1', 'user-1');

      expect(activityService.logActivity).toHaveBeenCalledTimes(1);
      expect(activityService.logActivity).toHaveBeenCalledWith(
        mockAttachment.cardId,
        'user-1',
        ActivityType.DELETE_ATTACHMENT,
        { filename: mockAttachment.filename },
      );
    });
  });
});
