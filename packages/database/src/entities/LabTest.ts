import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lab_tests')
export class LabTest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 180, nullable: true })
  name!: string;

  @Column({ type: 'float', default: 0, nullable: true })
  billRate!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
