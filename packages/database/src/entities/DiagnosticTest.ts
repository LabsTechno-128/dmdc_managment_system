import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'diagnostic_tests' })
export class DiagnosticTest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 255 })
    name!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;

    @Column('text', { nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
