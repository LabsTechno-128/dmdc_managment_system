import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToMany
} from 'typeorm';
import { InventoryItem } from './InventoryItem';

@Entity({ name: 'inventory_categories' })
export class InventoryCategory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100, unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @OneToMany(() => InventoryItem, (item) => item.category)
    items!: InventoryItem[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
