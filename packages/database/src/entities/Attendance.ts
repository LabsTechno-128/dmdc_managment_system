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

export enum AttendanceStatus {
    Present = 'Present',
    Absent = 'Absent',
    Leave = 'Leave',
    HalfDay = 'Half Day',
    FridayOff = 'Friday Off',
    WeeklyOff = 'Weekly Off',
    Holiday = 'Holiday',
}

@Entity({ name: 'attendance' })
@Index(['employeeId', 'date'], { unique: true })
export class Attendance {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    employeeId!: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee!: Employee;

    @Column({ type: 'date' })
    date!: string; // Format: YYYY-MM-DD

    @Column({
        type: 'enum',
        enum: AttendanceStatus,
        default: AttendanceStatus.Present,
    })
    status!: AttendanceStatus;

    @Column({ type: 'timestamp', nullable: true })
    checkIn?: Date;

    @Column({ type: 'timestamp', nullable: true })
    checkOut?: Date;

    @Column({ type: 'int', default: 0 })
    workingMinutes!: number;

    @Column({ type: 'int', default: 0 })
    lateMinutes!: number;

    @Column({ type: 'int', default: 0 })
    overtimeMinutes!: number;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ length: 100, nullable: true })
    markedBy?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
