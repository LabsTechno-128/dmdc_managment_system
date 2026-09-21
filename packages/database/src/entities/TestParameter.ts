import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Index
} from 'typeorm';
import { LabTest } from './LabTest';
import { User } from './User';

export enum ParameterDataType {
    NUMERIC = 'NUMERIC',
    DECIMAL = 'DECIMAL',
    TEXT = 'TEXT',
    POSITIVE_NEGATIVE = 'POSITIVE_NEGATIVE',
    SELECT = 'SELECT'
}

@Entity({ name: 'test_parameters' })
@Unique(['testId', 'name'])
@Index(['testId', 'displayOrder'])
export class TestParameter {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    testId!: number;

    @ManyToOne(() => LabTest, (test) => test.parameters)
    @JoinColumn({ name: 'testId' })
    test!: LabTest;

    @Column({ length: 150 })
    name!: string;

    @Column({ length: 50, nullable: true })
    shortCode?: string;

    @Column({ length: 50, nullable: true })
    unit?: string;

    @Column({ length: 150, nullable: true })
    referenceValue?: string;

    @Column({ length: 150, nullable: true })
    maleReferenceRange?: string;

    @Column({ length: 150, nullable: true })
    femaleReferenceRange?: string;

    @Column({ length: 150, nullable: true })
    normalRange?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: ParameterDataType,
        default: ParameterDataType.TEXT,
    })
    dataType!: ParameterDataType;

    @Column({ type: 'jsonb', nullable: true })
    selectOptions?: string[]; // Allowed options if dataType is SELECT

    @Column({ type: 'int', default: 1 })
    displayOrder!: number;

    @Column({ type: 'boolean', default: true })
    isRequired!: boolean;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'boolean', default: false })
    isSubItem!: boolean; // Used for frontend indentation/grouping

    @Column({ length: 150, nullable: true })
    group?: string; // e.g. "RBC - Red Blood Cells"

    @Column({ nullable: true })
    createdById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'createdById' })
    createdBy?: User;

    @Column({ nullable: true })
    updatedById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'updatedById' })
    updatedBy?: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
