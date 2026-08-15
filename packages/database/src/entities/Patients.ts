import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    BaseEntity,
    OneToMany,
} from 'typeorm';
import { Appointment } from './Appointment';
import { Report } from './Report';
import { Billing } from './Billing';

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',

}

@Entity({ name: 'patients' })

export class Patients extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        unique: true,
        nullable: true,
        // default: () => "('DMDCPTN-' || lpad(nextval('patient_id_seq')::text, 7, '0'))"
    })
    patientId?: string;

    @Column({ length: 100, nullable: true })
    name?: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({ nullable: true })
    email!: string;

    @Column({
        type: 'enum',
        enum: Gender,
        nullable: true,
    })
    gender!: Gender;

    @Column({ type: 'date', nullable: true })
    dateOfBirth!: Date;

    @Column({ nullable: true })
    age!: number;

    @Column({ nullable: true })
    bloodGroup!: string;

    @Column({ nullable: true })
    weight!: number

    @Column({ nullable: true })
    bloodPresure!: string

    @Column({ nullable: true })
    occupation!: string;

    @Column({ nullable: true })
    maritalStatus!: string;

    @Column({ nullable: true })
    religion!: string;

    @Column({ nullable: true })
    emergencyContactName!: string;

    @Column({ nullable: true })
    emergencyContactPhone!: string;

    @Column({ nullable: true })
    emergencyRelationship!: string;

    @Column({ type: 'text', nullable: true })
    address!: string;


    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => Appointment, (appointment) => appointment.patient)
    appointments!: Appointment[];

    @OneToMany(() => Report, (report) => report.patient)
    reports!: Report[];

    @OneToMany(() => Billing, (billing) => billing.patient)
    billings!: Billing[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @BeforeInsert()
    async generatePatientId() {
        if (this.patientId) return;

        // TypeORM queries often return numbers as strings to avoid big integer precision loss
        const result = await Patients.query(`SELECT nextval('patient_id_seq')`);
        const rawVal = result[0]?.nextval ?? result[0]?.next_val;
        const nextval = Number(rawVal);

        this.patientId = `DMDCPTN-${String(nextval).padStart(7, '0')}`;
    }
}



