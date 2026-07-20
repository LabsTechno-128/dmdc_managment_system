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
import { Billing } from './Billing';
import { DiagnosticTest } from './DiagnosticTest';

@Entity({ name: 'test_orders' })
export class TestOrder {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    patientId!: string;

    @ManyToOne(() => Patients)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    @Column({ nullable: true })
    billingId?: string;

    @ManyToOne(() => Billing)
    @JoinColumn({ name: 'billingId' })
    billing?: Billing;

    @Column()
    testId!: string;

    @ManyToOne(() => DiagnosticTest)
    @JoinColumn({ name: 'testId' })
    test!: DiagnosticTest;

    @Column({ length: 50, default: 'Waiting' })
    status!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
