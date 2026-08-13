import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { DatabaseService } from '../database/database.service';


@Injectable()
export class LabTestsService {
  constructor(
    private readonly databaseService: DatabaseService
  ) { }

  get repo() {
    return this.databaseService.repoLabTest();
  }
  async seed() {
    const count = await this.repo.count();
    if (count > 0) return;

    const names = [
      ['CBC (Complete Blood Count)', 350],
      ['HBS Ag (ICT)', 500],
      ['HBS Ag Confirmation (by ELISA)', 1000],
      ['Anti HCV (ICT)', 600],
      ['HIV Screening', 800],
      ['ICT for Filarisis', 800],
      ['Urine R/E', 250],
      ['Creatinine', 300],
      ['Blood Sugar Fasting', 200],
      ['Lipid Profile', 900],
      ['LFT (Liver Function Test)', 1200],
      ['HbA1c', 700],
      ['TSH', 650],
      ['Free T4', 650],
      ['Vitamin D', 1400],
    ];

    await this.repo.save(
      names.map(([name, billRate]) => ({
        name: String(name),
        billRate: Number(billRate),
      })),
    );
  }

  async findAll(page = 1, limit = 10, search = '') {
    // await this.seed();
    try {
      const safePage = Math.max(1, page);
      const safeLimit = Math.min(Math.max(1, limit), 100);

      const qb = this.repo
        .createQueryBuilder('test')
        .orderBy('test.id', 'DESC');

      if (search.trim()) {
        qb.where('LOWER(test.name) LIKE LOWER(:search)', {
          search: `%${search.trim()}%`,
        });
      }

      const [items, total] = await qb
        .skip((safePage - 1) * safeLimit)
        .take(safeLimit)
        .getManyAndCount();

      return {
        data: items,
        meta: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
      };
    } catch (error) {
      console.log(error);
      return error;
    }


  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Lab test not found');
    return item;
  }

  async create(dto: CreateLabTestDto) {
    const duplicate = await this.repo
      .createQueryBuilder('test')
      .where('LOWER(test.name) = LOWER(:name)', { name: dto.name.trim() })
      .getOne();

    if (duplicate) throw new ConflictException('A test with this name already exists');

    return this.repo.save(
      this.repo.create({
        name: dto.name.trim(),
        billRate: dto.billRate,
      }),
    );
  }

  async update(id: number, dto: UpdateLabTestDto) {
    const item = await this.findOne(id);

    if (dto.name && dto.name.trim().toLowerCase() !== item.name.toLowerCase()) {
      const duplicate = await this.repo
        .createQueryBuilder('test')
        .where('LOWER(test.name) = LOWER(:name)', { name: dto.name.trim() })
        .andWhere('test.id != :id', { id })
        .getOne();

      if (duplicate) throw new ConflictException('A test with this name already exists');
      item.name = dto.name.trim();
    }

    if (dto.billRate !== undefined) item.billRate = dto.billRate;

    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
    return { message: 'Lab test deleted successfully' };
  }

  async summary() {
    await this.seed();
    const total = await this.repo.count();
    return {
      total,
      currentView: total,
      status: 'Ready',
    };
  }
}
