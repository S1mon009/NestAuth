import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: 'http://localhost:4200' });
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

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
