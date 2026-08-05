import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly databaseService: DatabaseService) { }

  async create(createPatientDto: CreatePatientDto) {
    try {
      const repo = this.databaseService.repoPatients();
      const patient = repo.create(createPatientDto);

      return repo.save(patient);
    } catch (error: any) {

      throw error;
    }
  }

  async findAll() {
    return this.databaseService.repoPatients().find();
  }

  async findOne(id: string) {
    return this.databaseService.repoPatients().findOne({ where: { id } });
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    return this.databaseService.repoPatients().update(id, updatePatientDto);
  }

  async remove(id: string) {
    return this.databaseService.repoPatients().delete(id);
  }
}
