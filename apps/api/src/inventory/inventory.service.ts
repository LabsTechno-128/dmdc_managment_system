import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, ILike, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import {
    InventoryCategory,
    InventoryItem,
    InventoryBatch,
    InventoryStockEntry,
    InventoryUsageLog
} from '@hospital/database';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class InventoryService {
    constructor(private readonly databaseService: DatabaseService) {}

    private get dataSource() {
        return this.databaseService.getDataSource();
    }

    private get categoryRepo() { return this.dataSource.getRepository(InventoryCategory); }
    private get itemRepo() { return this.dataSource.getRepository(InventoryItem); }
    private get batchRepo() { return this.dataSource.getRepository(InventoryBatch); }
    private get entryRepo() { return this.dataSource.getRepository(InventoryStockEntry); }
    private get usageRepo() { return this.dataSource.getRepository(InventoryUsageLog); }

    // ================= CATEGORIES =================
    async findAllCategories() {
        return this.categoryRepo.find({ order: { name: 'ASC' } });
    }

    async createCategory(data: any) {
        const category = this.categoryRepo.create(data);
        return this.categoryRepo.save(category);
    }

    async updateCategory(id: string, data: any) {
        await this.categoryRepo.update(id, data);
        return this.categoryRepo.findOne({ where: { id } });
    }

    async deleteCategory(id: string) {
        const items = await this.itemRepo.count({ where: { categoryId: id } });
        if (items > 0) throw new BadRequestException('Cannot delete category with associated items.');
        return this.categoryRepo.softDelete(id);
    }

    // ================= ITEMS =================
    async findAllItems(params: { search?: string, categoryId?: string }) {
        const where: any = {};
        if (params.search) {
            where.name = ILike(`%${params.search}%`);
        }
        if (params.categoryId) {
            where.categoryId = params.categoryId;
        }
        return this.itemRepo.find({
            where,
            relations: { category: true },
            order: { name: 'ASC' }
        });
    }

    async createItem(data: any) {
        const item = this.itemRepo.create(data);
        return this.itemRepo.save(item);
    }

    async updateItem(id: string, data: any) {
        await this.itemRepo.update(id, data);
        return this.itemRepo.findOne({ where: { id } });
    }

    async deleteItem(id: string) {
        // Soft delete, keeping history intact
        return this.itemRepo.softDelete(id);
    }

    async getItemBatches(itemId: string) {
        return this.batchRepo.find({
            where: { itemId, quantity: MoreThan(0) },
            order: { expiryDate: 'ASC' }
        });
    }

    // ================= STOCK IN =================
    async createStockEntry(data: any) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const item = await queryRunner.manager.findOne(InventoryItem, { where: { id: data.itemId } });
            if (!item) throw new NotFoundException('Item not found');

            // 1. Create or update batch
            let batch = await queryRunner.manager.findOne(InventoryBatch, {
                where: { itemId: data.itemId, batchNumber: data.batchNumber }
            });

            if (batch) {
                batch.quantity += Number(data.quantity);
                batch.unitPrice = Number(data.unitPrice); // Update to latest price or average if preferred
                batch.expiryDate = data.expiryDate;
                await queryRunner.manager.save(batch);
            } else {
                batch = queryRunner.manager.create(InventoryBatch, {
                    itemId: data.itemId,
                    batchNumber: data.batchNumber,
                    expiryDate: data.expiryDate,
                    quantity: Number(data.quantity),
                    unitPrice: Number(data.unitPrice)
                });
                await queryRunner.manager.save(batch);
            }

            // 2. Create Stock Entry record
            const entry = queryRunner.manager.create(InventoryStockEntry, {
                itemId: data.itemId,
                batchId: batch.id,
                quantity: Number(data.quantity),
                unitPrice: Number(data.unitPrice),
                totalPrice: Number(data.quantity) * Number(data.unitPrice),
                supplier: data.supplier,
                entryDate: data.entryDate || new Date(),
                notes: data.notes,
                createdById: data.createdById
            });
            await queryRunner.manager.save(entry);

            // 3. Update Item currentStock
            item.currentStock += Number(data.quantity);
            await queryRunner.manager.save(item);

            await queryRunner.commitTransaction();
            return entry;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getStockEntries(params: { page?: string, limit?: string, search?: string }) {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const skip = (page - 1) * limit;

        const qb = this.entryRepo.createQueryBuilder('entry')
            .leftJoinAndSelect('entry.item', 'item')
            .leftJoinAndSelect('entry.batch', 'batch')
            .leftJoinAndSelect('entry.createdBy', 'createdBy')
            .orderBy('entry.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (params.search) {
            qb.where('item.name ILIKE :search', { search: `%${params.search}%` });
        }

        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // ================= STOCK OUT (USAGE & FEFO) =================
    async recordStockUsage(data: any) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const item = await queryRunner.manager.findOne(InventoryItem, { where: { id: data.itemId } });
            if (!item) throw new NotFoundException('Item not found');

            let remainingQuantityToDeduct = Number(data.quantity);
            if (item.currentStock < remainingQuantityToDeduct) {
                throw new BadRequestException(`Insufficient stock. Current stock: ${item.currentStock}`);
            }

            // FEFO Logic: Find batches with remaining quantity, ordered by expiry date ASC
            const batches = await queryRunner.manager.find(InventoryBatch, {
                where: { itemId: data.itemId, quantity: MoreThan(0) },
                order: { expiryDate: 'ASC' }
            });

            const usageLogs = [];

            for (const batch of batches) {
                if (remainingQuantityToDeduct <= 0) break;

                const deductQuantity = Math.min(batch.quantity, remainingQuantityToDeduct);
                
                // Deduct from batch
                batch.quantity -= deductQuantity;
                await queryRunner.manager.save(batch);

                // Create usage log for this specific batch deduction
                const usage = queryRunner.manager.create(InventoryUsageLog, {
                    itemId: data.itemId,
                    batchId: batch.id,
                    quantity: deductQuantity,
                    unitPrice: batch.unitPrice,
                    totalPrice: deductQuantity * batch.unitPrice,
                    department: data.department,
                    notes: data.notes,
                    usedById: data.usedById,
                    usageDate: data.usageDate || new Date()
                });
                const savedUsage = await queryRunner.manager.save(usage);
                usageLogs.push(savedUsage);

                remainingQuantityToDeduct -= deductQuantity;
            }

            if (remainingQuantityToDeduct > 0) {
                 throw new BadRequestException('Not enough stock in available batches to fulfill request, despite total current stock mismatch.');
            }

            // Update item total stock
            item.currentStock -= Number(data.quantity);
            await queryRunner.manager.save(item);

            await queryRunner.commitTransaction();
            return usageLogs;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getStockUsages(params: { page?: string, limit?: string, search?: string }) {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const skip = (page - 1) * limit;

        const qb = this.usageRepo.createQueryBuilder('usage')
            .leftJoinAndSelect('usage.item', 'item')
            .leftJoinAndSelect('usage.batch', 'batch')
            .leftJoinAndSelect('usage.usedBy', 'usedBy')
            .orderBy('usage.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (params.search) {
            qb.where('item.name ILIKE :search', { search: `%${params.search}%` });
        }

        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // ================= DASHBOARD & ALERTS =================
    async getAlerts() {
        // 1. Out of Stock / Low Stock
        const lowStockItems = await this.itemRepo.createQueryBuilder('item')
            .where('item.currentStock <= item.minStockLevel')
            .andWhere('item.isActive = :isActive', { isActive: true })
            .getMany();

        // 2. Expiry Alerts
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const expiringBatches = await this.batchRepo.createQueryBuilder('batch')
            .leftJoinAndSelect('batch.item', 'item')
            .where('batch.quantity > 0')
            .andWhere('batch.expiryDate <= :thirtyDays', { thirtyDays: thirtyDaysFromNow })
            .orderBy('batch.expiryDate', 'ASC')
            .getMany();

        return {
            lowStock: lowStockItems,
            expiringBatches
        };
    }

    async getDashboardStats() {
        const totalItems = await this.itemRepo.count();
        const totalCategories = await this.categoryRepo.count();
        
        // Sum total value of current stock
        const batches = await this.batchRepo.find({ where: { quantity: MoreThan(0) } });
        const totalInventoryValue = batches.reduce((sum, batch) => sum + (batch.quantity * Number(batch.unitPrice)), 0);

        return {
            totalItems,
            totalCategories,
            totalInventoryValue
        };
    }
}
