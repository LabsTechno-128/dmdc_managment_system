import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Appointment } from './Appointment';

@Entity({ name: 'doctors' })
export class Doctor {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    firstName!: string;

    @Column({ length: 100 })
    lastName!: string;

    @Column({ length: 255 })
    specialization!: string;

    @Column({ length: 255, nullable: true })
    degree?: string;

    @Column({ length: 255, nullable: true })
    availability?: string;

    @Column({ nullable: true })
    avatar?: string;

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @Column({ length: 50, default: '4.9' })
    rating!: string;

    @Column({ length: 100, nullable: true })
    department?: string;

    @Column({ length: 100, nullable: true })
    experience?: string;

    @Column({ default: true })
    isPublished!: boolean;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    consultationFee!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    followUpFee!: number;

    @OneToMany(() => Appointment, (appointment) => appointment.doctor)
    appointments!: Appointment[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
