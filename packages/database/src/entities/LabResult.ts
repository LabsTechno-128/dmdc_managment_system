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
import { Billing } from './Billing';
import { LabTest } from './LabTest';
import { SampleCollection } from './SampleCollection';
import { Patients } from './Patients';
import { User } from './User';

export enum LabResultStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED'
}

@Entity({ name: 'lab_results' })
export class LabResult {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    billingId!: string;

    @ManyToOne(() => Billing)
    @JoinColumn({ name: 'billingId' })
    billing!: Billing;

    @Column()
    testId!: number;

    @ManyToOne(() => LabTest)
    @JoinColumn({ name: 'testId' })
    test!: LabTest;

    @Column()
    sampleId!: string;

    @ManyToOne(() => SampleCollection)
    @JoinColumn({ name: 'sampleId' })
    sample!: SampleCollection;

    @Column()
    patientId!: string;

    @ManyToOne(() => Patients)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    // JSON object storing field keys and their result values
    @Column({ type: 'jsonb', default: {} })
    resultData!: any;

    @Column({
        type: 'enum',
        enum: LabResultStatus,
        default: LabResultStatus.PENDING,
    })
    status!: LabResultStatus;

    @Column({ type: 'text', nullable: true })
    remarks?: string;

    @Column({ nullable: true })
    performedById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'performedById' })
    performedBy?: User;

    @Column({ type: 'timestamp', nullable: true })
    performedAt?: Date;

    @Column({ nullable: true })
    verifiedById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'verifiedById' })
    verifiedBy?: User;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
