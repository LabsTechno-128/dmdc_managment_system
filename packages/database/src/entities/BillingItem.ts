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
import { DiagnosticTest } from './DiagnosticTest';

@Entity({ name: 'billing_items' })
export class BillingItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    billingId!: string;

    @ManyToOne(() => Billing)
    @JoinColumn({ name: 'billingId' })
    billing!: Billing;

    @Column()
    testId!: string;

    @ManyToOne(() => DiagnosticTest)
    @JoinColumn({ name: 'testId' })
    test!: DiagnosticTest;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
