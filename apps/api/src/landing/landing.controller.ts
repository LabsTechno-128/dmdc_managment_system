import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Body,
    Param,
    Query,
    Res,
    UseGuards,
    Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LandingService } from './landing.service';
import { PublicBookAppointmentDto } from './dto/public-book-appointment.dto';
import { UpdateLandingContentDto } from './dto/update-landing-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Landing Page')
@Controller('landing')
export class LandingController {
    constructor(private readonly landingService: LandingService) {}

    @ApiOperation({ summary: 'Get published landing page content' })
    @ApiResponse({ status: 200, description: 'Returns published content for landing page' })
    @Get('content')
    async getPublicContent() {
        return this.landingService.getPublicContent();
    }

    @ApiOperation({ summary: 'Get dynamic SEO metadata and structured data' })
    @ApiResponse({ status: 200, description: 'Returns SEO metadata and JSON-LD schema' })
    @Get('seo')
    async getSeo() {
        return this.landingService.getSeoMetadata();
    }

    @ApiOperation({ summary: 'Get dynamically generated sitemap.xml' })
    @Get('sitemap.xml')
    async getSitemap(@Req() req: Request, @Res() res: Response) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.get('host') || 'localhost:5173';
        const baseUrl = `${protocol}://${host}`;
        const sitemap = await this.landingService.getSitemapXml(baseUrl);
        res.setHeader('Content-Type', 'application/xml');
        return res.send(sitemap);
    }

    @ApiOperation({ summary: 'Get dynamic robots.txt' })
    @Get('robots.txt')
    getRobots(@Req() req: Request, @Res() res: Response) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.get('host') || 'localhost:8000';
        const baseUrl = `${protocol}://${host}`;
        const robots = this.landingService.getRobotsTxt(baseUrl);
        res.setHeader('Content-Type', 'text/plain');
        return res.send(robots);
    }

    @ApiOperation({ summary: 'Get published doctors for landing page' })
    @ApiResponse({ status: 200, description: 'Returns array of published doctors' })
    @Get('doctors')
    async getPublicDoctors(
        @Query('search') search?: string,
        @Query('specialty') specialty?: string,
    ) {
        return this.landingService.getPublicDoctors(search, specialty);
    }

    @ApiOperation({ summary: 'Check doctor availability slots for appointment booking' })
    @ApiResponse({ status: 200, description: 'Returns time slots and availability status' })
    @Get('doctors/:id/availability')
    async getDoctorAvailability(
        @Param('id') doctorId: string,
        @Query('date') date?: string,
    ) {
        return this.landingService.getDoctorAvailability(doctorId, date);
    }

    @ApiOperation({ summary: 'Book public appointment from landing page' })
    @ApiResponse({ status: 201, description: 'Appointment created successfully' })
    @Post('appointments/book')
    async bookAppointment(@Body() dto: PublicBookAppointmentDto) {
        return this.landingService.bookPublicAppointment(dto);
    }

    // Protected Management Endpoints
    @ApiOperation({ summary: 'Get landing page content for admin management' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    @Get('admin/content')
    async getAdminContent() {
        return this.landingService.getAdminContent();
    }

    @ApiOperation({ summary: 'Update landing page content' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    @Put('admin/content')
    async updateAdminContent(@Body() dto: UpdateLandingContentDto, @Req() req: any) {
        return this.landingService.updateAdminContent(dto, req.user);
    }

    @ApiOperation({ summary: 'Reset landing page content to defaults' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post('admin/reset')
    async resetAdminContent() {
        return this.landingService.resetAdminContent();
    }

    @ApiOperation({ summary: 'Get all doctors for landing page management' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    @Get('admin/doctors')
    async getAdminDoctors() {
        return this.landingService.getAdminDoctors();
    }

    @ApiOperation({ summary: 'Toggle doctor visibility on landing page' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    @Patch('admin/doctors/:id/visibility')
    async toggleDoctorVisibility(
        @Param('id') id: string,
        @Body('isPublished') isPublished: boolean,
    ) {
        return this.landingService.setDoctorVisibility(id, isPublished);
    }

    @ApiOperation({ summary: 'Update doctor public profile for landing page' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    @Patch('admin/doctors/:id/profile')
    async updateDoctorLandingProfile(
        @Param('id') id: string,
        @Body() dto: any,
    ) {
        return this.landingService.updateDoctorLandingProfile(id, dto);
    }

    @ApiOperation({ summary: 'Update doctor display order on landing page' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    @Put('admin/doctors/order')
    async updateDoctorOrder(@Body('doctorIds') doctorIds: string[]) {
        return this.landingService.updateDoctorOrder(doctorIds);
    }
}
