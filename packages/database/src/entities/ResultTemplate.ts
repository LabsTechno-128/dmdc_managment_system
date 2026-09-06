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
import { LabTest } from './LabTest';

@Entity({ name: 'result_templates' })
export class ResultTemplate {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    testId!: number;

    @ManyToOne(() => LabTest)
    @JoinColumn({ name: 'testId' })
    test!: LabTest;

    // fields will store JSON array of:
    // { name: string, type: 'text' | 'number' | 'select', options?: string[], unit?: string, referenceRange?: string, required: boolean }
    @Column({ type: 'jsonb', default: [] })
    fields!: any;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
