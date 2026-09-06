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

@Entity({ name: 'inventory_usage_logs' })
export class InventoryUsageLog {
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

    @Column({ length: 150, nullable: true })
    department?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column()
    usedById!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'usedById' })
    usedBy!: User;

    @Column({ type: 'date' })
    usageDate!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
