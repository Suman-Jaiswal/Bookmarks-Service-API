import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
   let app: INestApplication;
   let prisma: PrismaService;

   beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
         imports: [AppModule],
      }).compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
      await app.init();
      await app.listen(5000);

      prisma = app.get(PrismaService);
      await prisma.cleanDB();
      pactum.request.setBaseUrl('http://localhost:5000');
   });

   afterAll(() => {
      app.close();
   });

   describe('Auth', () => {
      const dto: AuthDto = {
         email: 'test@test.com',
         password: 'test',
      };

      describe('Signup', () => {
         it('should throw if email empty', () => {
            return pactum
               .spec()
               .post('/auth/signup')
               .withBody({
                  password: dto.password,
               })
               .expectStatus(400);
         });

         it('should throw if password empty', () => {
            return pactum
               .spec()
               .post('/auth/signup')
               .withBody({
                  email: dto.email,
               })
               .expectStatus(400);
         });

         it('should throw if no body provided', () => {
            return pactum.spec().post('/auth/signup').expectStatus(400);
         });

         it('should signup', () => {
            return pactum.spec().post('/auth/signup').withBody(dto).expectStatus(201);
         });
      });

      describe('Signin', () => {
         it('should throw if email empty', () => {
            return pactum
               .spec()
               .post('/auth/signin')
               .withBody({
                  password: dto.password,
               })
               .expectStatus(400);
         });

         it('should throw if password empty', () => {
            return pactum
               .spec()
               .post('/auth/signin')
               .withBody({
                  email: dto.email,
               })
               .expectStatus(400);
         });

         it('should throw if no body provided', () => {
            return pactum.spec().post('/auth/signin').expectStatus(400);
         });

         it('should signin', () => {
            return pactum
               .spec()
               .post('/auth/signin')
               .withBody(dto)
               .expectStatus(200)
               .stores('userAt', 'access_token');
         });
      });
   });

   describe('User', () => {
      describe('Get me', () => {
         it('should throw if no access token', () => {
            return pactum.spec().get('/users/me').expectStatus(401);
         });

         it('should get current user', () => {
            return pactum
               .spec()
               .get('/users/me')
               .withHeaders({
                  Authorization: 'Bearer $S{userAt}',
               })
               .expectStatus(200);
         });
      });

      describe('Edit user', () => {
         it('should edit user', () => {
            const dto: EditUserDto = {
               firstName: 'Suman',
               lastName: 'Kumar',
            };
            return pactum
               .spec()
               .patch('/users')
               .withHeaders({
                  Authorization: 'Bearer $S{userAt}',
               })
               .withBody(dto)
               .expectStatus(200)
               .expectBodyContains(dto.firstName)
               .expectBodyContains(dto.lastName);
         });
      });
   });

   describe('Bookmarks', () => {
      describe('Get empty bookmarks', () => {
         it('should get Empty', () => {
            return pactum
               .spec()
               .get('/bookmarks')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200)
               .expectBody([]);
         });
      });

      describe('Create bookmark', () => {
         const dto: CreateBookmarkDto = {
            title: 'test',
            description: 'test',
            link: 'https://soaron.netlify.app',
         };
         it('should throw if no access token', () => {
            return pactum.spec().post('/bookmarks').withBody(dto).expectStatus(401);
         });

         it('should create bookmark', () => {
            return pactum
               .spec()
               .post('/bookmarks')
               .withHeaders({
                  Authorization: 'Bearer $S{userAt}',
               })
               .withBody(dto)
               .expectStatus(201)
               .stores('bookmarkId', 'id');
         });
      });

      describe('Get bookmarks', () => {
         it('should get bookmarks', () => {
            return pactum
               .spec()
               .get('/bookmarks')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200)
               .expectJsonLength(1);
         });
      });

      describe('Get bookmark by id', () => {
         it('should get bookmark by id', () => {
            return pactum
               .spec()
               .get('/bookmarks/{id}')
               .withPathParams('id', '$S{bookmarkId}')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200)
               .expectBodyContains('$S{bookmarkId}');
         });
      });
      describe('Edit bookmark', () => {
         const dto: EditBookmarkDto = {
            title: 'test edited',
            description: 'desc edited',
         };

         it('should edit bookmark', () => {
            return pactum
               .spec()
               .patch('/bookmarks/{id}')
               .withPathParams('id', '$S{bookmarkId}')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .withBody(dto)
               .expectStatus(200)
               .expectBodyContains(dto.title)
               .expectBodyContains(dto.description);
         });
      });

      describe('Delete bookmark', () => {
         it('should delete bookmark', () => {
            return pactum
               .spec()
               .delete('/bookmarks/{id}')
               .withPathParams('id', '$S{bookmarkId}')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(204);
         });

         it('should get empty bookmarks', () => {
            return pactum
               .spec()
               .get('/bookmarks')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200)
               .expectJsonLength(0);
         });
      });
   });
});
