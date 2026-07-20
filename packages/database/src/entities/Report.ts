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
import { TestOrder } from './TestOrder';

@Entity({ name: 'reports' })
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    patientId!: string;

    @ManyToOne(() => Patients)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    @Column()
    testOrderId!: string;

    @ManyToOne(() => TestOrder)
    @JoinColumn({ name: 'testOrderId' })
    testOrder!: TestOrder;

    @Column('text', { nullable: true })
    reportData?: string;

    @Column('boolean', { default: false })
    isDelivered!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
