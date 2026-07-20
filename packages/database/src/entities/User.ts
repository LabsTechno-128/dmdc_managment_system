import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
@Index(['employeeId'], { unique: true })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 20, unique: true })
    employeeId!: string;

    @Column({ length: 100 })
    firstName!: string;

    @Column({ length: 100 })
    lastName!: string;

    @Column({ length: 200, unique: true })
    email!: string;

    @Column({ length: 20, unique: true })
    phone!: string;

    @Column()
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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}