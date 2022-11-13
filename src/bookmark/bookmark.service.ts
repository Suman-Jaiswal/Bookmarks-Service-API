import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
   constructor(private prisma: PrismaService) {}

   async getBookmarks(userId: number) {
      return await this.prisma.bookmark.findMany({
         where: {
            userId,
         },
      });
   }

   async getBookmarkById(userId: number, id: number) {
      return await this.prisma.bookmark.findFirst({
         where: { id, userId },
      });
   }

   async createBookmark(userId: number, dto: CreateBookmarkDto) {
      return await this.prisma.bookmark.create({
         data: {
            ...dto,
            userId,
         },
      });
   }

   async editBookmarkById(userId: number, id: number, dto: EditBookmarkDto) {
      const bookmark = await this.prisma.bookmark.findUnique({
         where: { id },
      });

      if (!bookmark || bookmark.userId !== userId) {
         throw new ForbiddenException('Access denied');
      }

      return this.prisma.bookmark.update({
         where: {
            id: id,
         },
         data: {
            ...dto,
         },
      });
   }

   async deleteBookmarkById(userId: number, id: number) {
      const bookmark = await this.prisma.bookmark.findUnique({
         where: { id },
      });

      if (!bookmark || bookmark.userId !== userId) {
         throw new ForbiddenException('Access denied');
      }

      await this.prisma.bookmark.delete({
         where: {
            id: id,
         },
      });
   }
}
