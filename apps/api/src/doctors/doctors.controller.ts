import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Doctor } from '@hospital/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('doctors')
export class DoctorsController {
    constructor(private readonly doctorsService: DoctorsService) {}

    @Post()
    create(@Body() data: Partial<Doctor>) {
        return this.doctorsService.create(data);
    }

    @Get()
    findAll() {
        return this.doctorsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.doctorsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Partial<Doctor>) {
        return this.doctorsService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.doctorsService.remove(id);
    }
}
