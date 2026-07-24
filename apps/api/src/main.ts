import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from '@hospital/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = loadConfig();
  app.setGlobalPrefix('api');
  app.enableCors();
  const port = Number(config.port || 8000);
  console.log("port: ", port);



  await app.listen(port);
}
bootstrap();
