import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { LabTestsService } from './lab-tests.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST)
@Controller('lab-tests')
export class LabTestsController {
  constructor(private readonly service: LabTestsService) { }

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search = '',
  ) {
    console.log("probelm form")
    return this.service.findAll(Number(page), Number(limit), search);
  }

  @Get('stats/summary')
  summary() {
    return this.service.summary();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLabTestDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabTestDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // --- Parameters ---

  @Get(':id/parameters')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN, UserRole.DOCTOR)
  getParameters(@Param('id', ParseIntPipe) testId: number) {
    return this.service.getParameters(testId);
  }

  @Post(':id/parameters')
  @Roles(UserRole.SUPER_ADMIN)
  createParameter(
    @Param('id', ParseIntPipe) testId: number,
    @Body() dto: any,
    @Req() req: any
  ) {
    return this.service.createParameter(testId, dto, req.user.id);
  }

  @Patch(':id/parameters/reorder')
  @Roles(UserRole.SUPER_ADMIN)
  reorderParameters(
    @Param('id', ParseIntPipe) testId: number,
    @Body() body: { parameterIds: string[] }
  ) {
    return this.service.reorderParameters(testId, body.parameterIds);
  }

  @Patch(':id/parameters/:paramId')
  @Roles(UserRole.SUPER_ADMIN)
  updateParameter(
    @Param('id', ParseIntPipe) testId: number,
    @Param('paramId') paramId: string,
    @Body() dto: any,
    @Req() req: any
  ) {
    return this.service.updateParameter(testId, paramId, dto, req.user.id);
  }

  @Delete(':id/parameters/:paramId')
  @Roles(UserRole.SUPER_ADMIN)
  deleteParameter(
    @Param('id', ParseIntPipe) testId: number,
    @Param('paramId') paramId: string
  ) {
    return this.service.deleteParameter(testId, paramId);
  }
}
