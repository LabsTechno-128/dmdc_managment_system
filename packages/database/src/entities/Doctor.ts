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
    availability?: string;

    @OneToMany(() => Appointment, (appointment) => appointment.doctor)
    appointments!: Appointment[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
