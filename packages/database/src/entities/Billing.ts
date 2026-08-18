import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { Patients } from './Patients';
import { PatientType } from '../enums';
import { BillingItem } from './BillingItem';

export enum BillingType {
    DIAGNOSTIC = 'DIAGNOSTIC',
    CONSULTATION = 'CONSULTATION',
}

@Entity({ name: 'billings' })
export class Billing {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true, nullable: true })
    billNumber?: string;

    @Column()
    patientId!: string;

    @ManyToOne(() => Patients)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    @Column({ type: 'uuid', nullable: true })
    appointmentId?: string;

    @Column({ type: 'uuid', nullable: true })
    doctorId?: string;

    @Column({
        type: 'enum',
        enum: BillingType,
        default: BillingType.DIAGNOSTIC,
    })
    billingType!: BillingType;

    @Column({
        type: 'enum',
        enum: PatientType,
        default: PatientType.IN_HOUSE
    })
    patientType!: PatientType;

    @Column('decimal', { precision: 10, scale: 2 })
    subtotal!: number;

    @Column({ length: 50, default: 'FIXED' })
    discountType!: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    discount!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    discountAmount!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    additionalCharges!: number;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    paidAmount!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    dueAmount!: number;

    @Column({ length: 50, default: 'Cash' })
    paymentMethod!: string;

    @Column({ length: 50, default: 'Unpaid' })
    paymentStatus!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @OneToMany(() => BillingItem, (item) => item.billing)
    items!: BillingItem[];
}

