import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {}

    // CATEGORIES
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('categories')
    getAllCategories() {
        return this.inventoryService.findAllCategories();
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post('categories')
    createCategory(@Body() data: any) {
        return this.inventoryService.createCategory(data);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Put('categories/:id')
    updateCategory(@Param('id') id: string, @Body() data: any) {
        return this.inventoryService.updateCategory(id, data);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Delete('categories/:id')
    deleteCategory(@Param('id') id: string) {
        return this.inventoryService.deleteCategory(id);
    }

    // ITEMS
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('items')
    getAllItems(
        @Query('search') search?: string,
        @Query('categoryId') categoryId?: string
    ) {
        return this.inventoryService.findAllItems({ search, categoryId });
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post('items')
    createItem(@Body() data: any) {
        return this.inventoryService.createItem(data);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Put('items/:id')
    updateItem(@Param('id') id: string, @Body() data: any) {
        return this.inventoryService.updateItem(id, data);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Delete('items/:id')
    deleteItem(@Param('id') id: string) {
        return this.inventoryService.deleteItem(id);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('items/:id/batches')
    getItemBatches(@Param('id') id: string) {
        return this.inventoryService.getItemBatches(id);
    }

    // STOCK ENTRY (IN)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post('stock-in')
    createStockEntry(@Body() data: any, @Req() req: any) {
        data.createdById = req.user.id;
        return this.inventoryService.createStockEntry(data);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Get('stock-in')
    getStockEntries(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string
    ) {
        return this.inventoryService.getStockEntries({ page, limit, search });
    }

    // STOCK USAGE (OUT)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Post('stock-out')
    recordStockUsage(@Body() data: any, @Req() req: any) {
        data.usedById = req.user.id;
        return this.inventoryService.recordStockUsage(data);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('stock-out')
    getStockUsages(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string
    ) {
        return this.inventoryService.getStockUsages({ page, limit, search });
    }

    // DASHBOARD & ALERTS
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('alerts')
    getAlerts() {
        return this.inventoryService.getAlerts();
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('dashboard-stats')
    getDashboardStats() {
        return this.inventoryService.getDashboardStats();
    }
}
