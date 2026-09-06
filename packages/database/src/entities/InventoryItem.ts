import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { InventoryCategory } from './InventoryCategory';
import { InventoryBatch } from './InventoryBatch';

@Entity({ name: 'inventory_items' })
export class InventoryItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 150 })
    name!: string;

    @Column()
    categoryId!: string;

    @ManyToOne(() => InventoryCategory, (category) => category.items)
    @JoinColumn({ name: 'categoryId' })
    category!: InventoryCategory;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ length: 50 })
    unit!: string; // e.g., Piece, Box, Bottle

    @Column('int', { default: 0 })
    minStockLevel!: number;

    @Column('int', { default: 0 })
    currentStock!: number;

    @Column({ length: 200, nullable: true })
    supplier?: string;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => InventoryBatch, (batch) => batch.item)
    batches!: InventoryBatch[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
