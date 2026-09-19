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
import { Patients } from './Patients';
import { LabResult } from './LabResult';

export enum ReportStatus {
    DRAFT = 'DRAFT',
    FINALIZED = 'FINALIZED',
    PUBLISHED = 'PUBLISHED'
}

@Entity({ name: 'reports' })
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    patientId!: string;

    @ManyToOne(() => Patients)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    @Column({ nullable: true })
    labResultId?: string;

    @ManyToOne(() => LabResult)
    @JoinColumn({ name: 'labResultId' })
    labResult?: LabResult;

    @Column('text', { nullable: true })
    reportData?: string;

    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.DRAFT,
    })
    status!: ReportStatus;

    @Column('boolean', { default: false })
    isDelivered!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
