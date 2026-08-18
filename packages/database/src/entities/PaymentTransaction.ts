import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Billing } from './Billing';
import { Patients } from './Patients';
import { User } from './User';

export enum PaymentTransactionType {
    PAYMENT = 'PAYMENT',
    REFUND = 'REFUND',
}

@Entity({ name: 'payment_transactions' })
export class PaymentTransaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    billingId!: string;

    @ManyToOne(() => Billing)
    @JoinColumn({ name: 'billingId' })
    billing!: Billing;

    @Column()
    patientId!: string;

    @ManyToOne(() => Patients)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    @Column('decimal', { precision: 10, scale: 2 })
    amount!: number;

    @Column({ length: 50, default: 'Cash' })
    paymentMethod!: string;

    @Column({
        type: 'enum',
        enum: PaymentTransactionType,
        default: PaymentTransactionType.PAYMENT,
    })
    type!: PaymentTransactionType;

    @Column({ nullable: true })
    receivedById?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'receivedById' })
    receivedBy?: User;

    @Column({ length: 50, default: 'Completed' })
    status!: string;

    @Column({ length: 255, nullable: true })
    reference?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
