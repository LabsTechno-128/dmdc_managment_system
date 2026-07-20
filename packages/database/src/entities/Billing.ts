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

@Entity({ name: 'billings' })
export class Billing {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    patientId!: string;

    @ManyToOne(() => Patients)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    @Column('decimal', { precision: 10, scale: 2 })
    subtotal!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    discount!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    additionalCharges!: number;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount!: number;

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
}
