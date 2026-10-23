import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { SampleCollection } from './SampleCollection';
import { InventoryItem } from './InventoryItem';

@Entity({ name: 'sample_collection_items' })
export class SampleCollectionItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    sampleCollectionId!: string;

    @ManyToOne(() => SampleCollection, (sample) => sample.inventoryItems, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sampleCollectionId' })
    sampleCollection!: SampleCollection;

    @Column()
    itemId!: string;

    @ManyToOne(() => InventoryItem)
    @JoinColumn({ name: 'itemId' })
    item!: InventoryItem;

    @Column('int')
    quantity!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
