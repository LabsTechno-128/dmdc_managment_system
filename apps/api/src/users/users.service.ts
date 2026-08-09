import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    return this.databaseService.repoUser().find();
  }

  async findOne(id: string) {
    const user = await this.databaseService.repoUser().findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateData: any) {
    const user = await this.findOne(id);
    
    // Do not allow updating password directly through this general endpoint
    delete updateData.password;
    
    Object.assign(user, updateData);
    return this.databaseService.repoUser().save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.databaseService.repoUser().softRemove(user);
  }
}
