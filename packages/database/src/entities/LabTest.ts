import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TestParameter } from './TestParameter';

@Entity('lab_tests')
export class LabTest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 180, nullable: true })
  name!: string;

  @Column({ length: 100, nullable: true })
  sampleType?: string;

  @Column({ length: 100, nullable: true })
  department?: string;

  @Column({ type: 'float', default: 0, nullable: true })
  billRate!: number;

  @OneToMany(() => TestParameter, (param) => param.test)
  parameters!: TestParameter[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
