import { ValidationPipe, ConsoleLogger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import { AppModule } from './app.module';

/**
 * The main entry point of the NestJS application. This function bootstraps the application by creating an instance of the NestFactory, applying global middleware and configurations, and starting the server to listen for incoming requests.
 * It sets up security headers using Helmet, parses cookies, enables CORS for the frontend application, applies global validation pipes, and configures API versioning. It also sets up Swagger for API documentation and starts the server on the specified port.
 * @returns {Promise<void>} A promise that resolves when the application has successfully started.
 * @throws An error if there is an issue during the bootstrapping process.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'NestAuth',
    }),
  });

  app.use(helmet());
  app.use(cookieParser());
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.enableCors({ origin: process.env.CORS_ORIGIN });
  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('NestAuth')
    .setDescription('NestJS Authentication API')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000, process.env.HOST ?? '127.0.0.1');
}

void bootstrap();
