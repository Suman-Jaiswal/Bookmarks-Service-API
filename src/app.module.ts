import { Controller, Get, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Controller('/')
class AppController {
   @Get()
   api() {
      return 'Api is Running';
   }
}

@Module({
   imports: [
      AuthModule,
      UserModule,
      BookmarkModule,
      PrismaModule,
      ConfigModule.forRoot({ isGlobal: true }),
   ],
   controllers: [AppController],
})
export class AppModule {}
