import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Doctor } from './Doctor';
import { Patients } from './Patients';

export enum AppointmentStatus {
    Pending = 'Pending',
    Confirmed = 'Confirmed',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
    NoShow = 'NoShow',
}

export enum AppointmentType {
    New = 'New',
    FollowUp = 'FollowUp',
    Emergency = 'Emergency',
}

@Entity({ name: 'appointments' })
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    doctorId!: string;

    @Column()
    patientId!: string;

    @ManyToOne(() => Doctor, (doctor) => doctor.appointments)
    @JoinColumn({ name: 'doctorId' })
    doctor!: Doctor;

    @ManyToOne(() => Patients, (patient) => patient.appointments)
    @JoinColumn({ name: 'patientId' })
    patient!: Patients;

    @Column({ type: 'date', nullable: true })
    appointmentDate!: Date;

    @Column({ type: 'time', nullable: true })
    appointmentTime!: string;

    @Column({
        type: 'enum',
        enum: AppointmentType,
        default: AppointmentType.New,
    })
    appointmentType!: AppointmentType;

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.Pending,
    })
    status!: AppointmentStatus;

    @Column({ type: 'text', nullable: true })
    visitReason?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    consultationFee!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}