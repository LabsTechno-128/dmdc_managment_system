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
import { BillingItem } from './BillingItem';
import { Patients } from './Patients';
import { LabTest } from './LabTest';
import { User } from './User';

export enum SampleStatus {
    PENDING = 'PENDING',
    COLLECTED = 'COLLECTED',
    RECOLLECTION_REQUIRED = 'RECOLLECTION_REQUIRED',
    REJECTED = 'REJECTED'
}

@Entity({ name: 'sample_collections' })
export class SampleCollection {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    billingId!: string;

    @ManyToOne(() => Billing)
    @JoinColumn({ name: 'billingId' })
    billing!: Billing;

    @Column()
    billingItemId!: string;

    @ManyToOne(() => BillingItem)
    @JoinColumn({ name: 'billingItemId' })
    billingItem!: BillingItem;

    @Column()
    patientId!: string;

    @ManyToOne(() => Patients)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    @Column()
    testId!: number;

    @ManyToOne(() => LabTest)
    @JoinColumn({ name: 'testId' })
    test!: LabTest;

    @Column({ unique: true })
    barcode!: string;

    @Column({
        type: 'enum',
        enum: SampleStatus,
        default: SampleStatus.PENDING,
    })
    status!: SampleStatus;

    @Column({ length: 100, nullable: true })
    sampleType?: string;

    @Column({ type: 'timestamp', nullable: true })
    requiredCollectionTime?: Date;

    @Column({ type: 'timestamp', nullable: true })
    collectedAt?: Date;

    @Column({ nullable: true })
    collectedById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'collectedById' })
    collectedBy?: User;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
