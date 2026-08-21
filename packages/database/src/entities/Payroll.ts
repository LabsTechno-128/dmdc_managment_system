import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Employee } from './employee';

@Entity({ name: 'payrolls' })
@Index(['employeeId', 'month', 'year'], { unique: true })
export class Payroll {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    employeeId!: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee!: Employee;

    @Column({ type: 'int' })
    month!: number; // 1-12

    @Column({ type: 'int' })
    year!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    monthlySalary!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    dailyRate!: number;

    @Column({ type: 'int', default: 24 })
    workingDays!: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    presentDays!: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    absentDays!: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    leaveDays!: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    halfDays!: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    fridayOffDays!: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    deductibleDays!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    totalDeduction!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    netSalary!: number;

    @Column({ length: 50, default: 'Draft' })
    status!: string; // Draft, Approved, Paid

    @CreateDateColumn()
    generatedAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
