import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })

export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;


    @Column({ length: 100 })
    firstName!: string;

    @Column({ length: 100 })
    lastName!: string;

    @Column({ length: 200, unique: true })
    email!: string;

    @Column({ length: 20, unique: true })
    phone!: string;

    @Column({ select: false })
    password!: string;

    @Column({
        default: true,
    })
    isActive!: boolean;

    @Column({
        default: false,
    })
    isVerified!: boolean;

    @Column({
        nullable: true,
    })
    avatar?: string;

    @OneToOne(() => Employee, (employee) => employee.user, {
        nullable: true,
    })
    employee?: Employee;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}