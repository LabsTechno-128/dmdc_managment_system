import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { InventoryItem } from './InventoryItem';
import { InventoryBatch } from './InventoryBatch';
import { User } from './User';

@Entity({ name: 'inventory_stock_entries' })
export class InventoryStockEntry {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    itemId!: string;

    @ManyToOne(() => InventoryItem)
    @JoinColumn({ name: 'itemId' })
    item!: InventoryItem;

    @Column()
    batchId!: string;

    @ManyToOne(() => InventoryBatch)
    @JoinColumn({ name: 'batchId' })
    batch!: InventoryBatch;

    @Column('int')
    quantity!: number;

    @Column('decimal', { precision: 10, scale: 2 })
    unitPrice!: number;

    @Column('decimal', { precision: 12, scale: 2 })
    totalPrice!: number;

    @Column({ length: 200, nullable: true })
    supplier?: string;

    @Column({ type: 'date' })
    entryDate!: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column()
    createdById!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'createdById' })
    createdBy!: User;

    @CreateDateColumn()
    createdAt!: Date;
}
