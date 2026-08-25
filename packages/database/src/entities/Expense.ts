import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from './User';

export enum ExpenseType {
    EMPLOYEE_BREAKFAST = 'EMPLOYEE_BREAKFAST',
    EMPLOYEE_FOOD = 'EMPLOYEE_FOOD',
    EMPLOYEE_SALARY = 'EMPLOYEE_SALARY',
    MEDICAL_SUPPLIES = 'MEDICAL_SUPPLIES',
    OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
    ELECTRICITY = 'ELECTRICITY',
    INTERNET = 'INTERNET',
    RENT = 'RENT',
    EQUIPMENT = 'EQUIPMENT',
    MAINTENANCE = 'MAINTENANCE',
    TRANSPORTATION = 'TRANSPORTATION',
    OTHER = 'OTHER',
}

@Entity({ name: 'expenses' })
export class Expense {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'enum',
        enum: ExpenseType,
        default: ExpenseType.OTHER,
    })
    expenseType!: ExpenseType;

    @Column('decimal', { precision: 12, scale: 2 })
    amount!: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ length: 100, nullable: true })
    referenceNumber?: string;

    @Column({ type: 'date' })
    expenseDate!: Date;

    @Column()
    createdById!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'createdById' })
    createdBy!: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
