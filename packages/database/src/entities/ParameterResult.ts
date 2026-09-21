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
import { LabResult } from './LabResult';
import { TestParameter, ParameterDataType } from './TestParameter';
import { User } from './User';

@Entity({ name: 'parameter_results' })
export class ParameterResult {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    labResultId!: string;

    @ManyToOne(() => LabResult, (result) => result.parameterResults)
    @JoinColumn({ name: 'labResultId' })
    labResult!: LabResult;

    @Column('uuid')
    testParameterId!: string;

    @ManyToOne(() => TestParameter)
    @JoinColumn({ name: 'testParameterId' })
    testParameter!: TestParameter;

    @Column({ type: 'text', nullable: true })
    resultValue?: string; // The entered result

    @Column({ type: 'text', nullable: true })
    remarks?: string;

    // --- IMMUTABLE SNAPSHOT ---
    // These fields capture the state of the parameter at the moment the result was finalized
    
    @Column({ length: 150, nullable: true })
    snapshotParameterName?: string;

    @Column({ length: 50, nullable: true })
    snapshotUnit?: string;

    @Column({ length: 150, nullable: true })
    snapshotReferenceValue?: string;

    @Column({
        type: 'enum',
        enum: ParameterDataType,
        nullable: true,
    })
    snapshotDataType?: ParameterDataType;

    @Column({ type: 'int', nullable: true })
    snapshotDisplayOrder?: number;

    @Column({ length: 150, nullable: true })
    snapshotGroup?: string;

    @Column({ type: 'boolean', nullable: true })
    snapshotIsSubItem?: boolean;

    // --- AUDIT LOGGING ---

    @Column({ nullable: true })
    enteredById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'enteredById' })
    enteredBy?: User;

    @Column({ type: 'timestamp', nullable: true })
    enteredAt?: Date;

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
