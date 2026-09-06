import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { InventoryItem } from './InventoryItem';

@Entity({ name: 'inventory_batches' })
export class InventoryBatch {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    itemId!: string;

    @ManyToOne(() => InventoryItem, (item) => item.batches)
    @JoinColumn({ name: 'itemId' })
    item!: InventoryItem;

    @Column({ length: 100 })
    batchNumber!: string;

    @Column({ type: 'date' })
    expiryDate!: Date;

    @Column('int')
    quantity!: number; // Current remaining quantity in this batch

    @Column('decimal', { precision: 10, scale: 2 })
    unitPrice!: number; // Price per unit for this specific batch

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
