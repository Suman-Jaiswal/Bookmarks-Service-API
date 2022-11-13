import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class AuthService {
   constructor(
      private prisma: PrismaService,
      private jwt: JwtService,
      private config: ConfigService,
   ) {}
   async signup(dto: AuthDto) {
      // generate the password hash
      const hash = await argon.hash(dto.password);
      // save to db
      try {
         const user = await this.prisma.user.create({
            data: {
               email: dto.email,
               hash,
            },
            select: {
               id: true,
               email: true,
               createdAt: true,
            },
         });

         return user;
      } catch (err) {
         if (err instanceof PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
               throw new ForbiddenException('Email already exists');
            }
         }
         throw err;
      }
   }
   async signin(dto: AuthDto) {
      // find the user
      const user = await this.prisma.user.findUnique({
         where: {
            email: dto.email,
         },
      });

      // if the user does not exist throw an error
      if (!user) {
         throw new ForbiddenException('Email does not exist');
      }
      // if the user
      // generate the password hash
      const match = await argon.verify(user.hash, dto.password);

      // if the password is not valid throw an error
      if (!match) {
         throw new ForbiddenException('Invalid password');
      }
      delete user.hash;
      return this.signToken(user.id, user.email);
   }
   async signToken(userId: number, email: string): Promise<{ access_token: string }> {
      const payload = {
         sub: userId,
         email,
      };

      const secret = this.config.get('JWT_SECRET');

      const token = await this.jwt.signAsync(payload, {
         expiresIn: '60m',
         secret,
      });

      console.log(token);

      return {
         access_token: token,
      };
   }
}
