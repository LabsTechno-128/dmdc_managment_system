import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseService } from './database/database.service';
import { UserRole } from '@hospital/database';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);

  const email = 'superadmin@example.com';
  
  const existingAdmin = await databaseService.repoUser().findOne({ where: { email } });
  
  if (existingAdmin) {
    console.log('Superadmin already exists!');
    await app.close();
    return;
  }

  const hashedPassword = await bcrypt.hash('superadmin123', 10);

  const superadmin = databaseService.repoUser().create({
    firstName: 'Super',
    lastName: 'Admin',
    email,
    phone: Date.now().toString().slice(-10),
    password: hashedPassword,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
  });

  await databaseService.repoUser().save(superadmin);
  
  console.log('Superadmin created successfully!');
  console.log('Email:', email);
  console.log('Password: superadmin123');

  await app.close();
}

bootstrap();
