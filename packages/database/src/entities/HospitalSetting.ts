import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'hospital_settings' })
export class HospitalSetting {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 200, default: 'Dr. Muazzem Medical Diagnostic Center' })
    centerName!: string;

    @Column({ type: 'text', default: '82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka' })
    address!: string;

    @Column({ length: 100, default: '01234567890, 01234567899' })
    phone!: string;

    @Column({ length: 100, default: 'dmdc.contact@gmail.com' })
    email!: string;

    @Column({ length: 10, default: 'BDT' })
    currency!: string;

    @Column({ length: 100, default: '001234567-0101' })
    bin!: string; // Business Identification Number (13-digit or 9-digit VAT Registration)

    @Column({ length: 100, default: 'Mushak-6.3 (মূসক-৬.৩)' })
    musakForm!: string;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    defaultVatRate!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
