import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { TestsService } from './tests.service';
import { DiagnosticTest, UserRole } from '@hospital/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('tests')
export class TestsController {
    constructor(private readonly testsService: TestsService) {}

    @Post()
    create(@Body() data: Partial<DiagnosticTest>) {
        return this.testsService.create(data);
    }

    @Get()
    findAll() {
        return this.testsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.testsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Partial<DiagnosticTest>) {
        return this.testsService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.testsService.remove(id);
    }
}
