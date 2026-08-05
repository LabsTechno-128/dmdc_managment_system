import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './User';


@Entity({ name: 'employees' })
export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true, length: 20 })
    employeeId!: string;

    @Column({ length: 100, nullable: true })
    firstName!: string;

    @Column({ length: 100, nullable: true })
    lastName!: string;

    @Column({ length: 20, unique: true, nullable: true })
    phone!: string;

    @Column({ nullable: true })
    avatar?: string;

    @Column({ type: 'date' })
    joiningDate!: Date;

    @Column({ default: true })
    isActive!: boolean;

    @OneToOne(() => User, (user) => user.employee, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn()
    user?: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}