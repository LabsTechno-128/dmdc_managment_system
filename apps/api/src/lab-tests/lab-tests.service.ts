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
  
  get paramRepo() {
    return this.databaseService.repoTestParameter();
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

  // --- Parameter Management ---

  async getParameters(testId: number) {
    const test = await this.findOne(testId);
    return this.paramRepo.find({
      where: { testId: test.id },
      order: { displayOrder: 'ASC' }
    });
  }

  async createParameter(testId: number, dto: any, userId: string) {
    const test = await this.findOne(testId);
    
    // Check name uniqueness within the same test
    const duplicate = await this.paramRepo.findOne({
      where: { testId: test.id, name: dto.name.trim() }
    });
    if (duplicate) throw new ConflictException('A parameter with this name already exists for this test');

    // Get max displayOrder
    const maxOrderParam = await this.paramRepo.findOne({
      where: { testId: test.id },
      order: { displayOrder: 'DESC' }
    });
    const nextOrder = maxOrderParam ? maxOrderParam.displayOrder + 1 : 1;

    const param = this.paramRepo.create({
      ...dto,
      name: dto.name.trim(),
      testId: test.id,
      displayOrder: nextOrder,
      createdById: userId,
    });
    
    return this.paramRepo.save(param);
  }

  async updateParameter(testId: number, paramId: string, dto: any, userId: string) {
    await this.findOne(testId); // Ensure test exists

    const param = await this.paramRepo.findOne({ where: { id: paramId, testId } });
    if (!param) throw new NotFoundException('Parameter not found');

    if (dto.name && dto.name.trim() !== param.name) {
      const duplicate = await this.paramRepo.findOne({
        where: { testId, name: dto.name.trim() }
      });
      if (duplicate && duplicate.id !== paramId) {
        throw new ConflictException('A parameter with this name already exists for this test');
      }
    }

    Object.assign(param, {
      ...dto,
      name: dto.name ? dto.name.trim() : param.name,
      updatedById: userId
    });

    return this.paramRepo.save(param);
  }

  async deleteParameter(testId: number, paramId: string) {
    await this.findOne(testId);
    const param = await this.paramRepo.findOne({ where: { id: paramId, testId } });
    if (!param) throw new NotFoundException('Parameter not found');

    await this.paramRepo.remove(param);
    return { message: 'Parameter deleted successfully' };
  }

  async reorderParameters(testId: number, paramIds: string[]) {
    await this.findOne(testId);
    
    const params = await this.paramRepo.find({ where: { testId } });
    
    // Update order based on the provided array
    for (let i = 0; i < paramIds.length; i++) {
      const p = params.find(p => p.id === paramIds[i]);
      if (p) {
        p.displayOrder = i + 1;
        await this.paramRepo.save(p);
      }
    }
    
    return this.getParameters(testId);
  }
}
