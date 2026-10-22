import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'landing_content' })
export class LandingContent {
    @PrimaryColumn({ type: 'varchar', length: 50, default: 'default' })
    id!: string;

    @Column({ type: 'jsonb' })
    hero!: Record<string, any>;

    @Column({ type: 'jsonb' })
    about!: Record<string, any>;

    @Column({ type: 'jsonb' })
    services!: Record<string, any>;

    @Column({ type: 'jsonb' })
    stats!: Record<string, any>;

    @Column({ type: 'jsonb' })
    articles!: Record<string, any>;

    @Column({ type: 'jsonb' })
    contact!: Record<string, any>;

    @Column({ type: 'jsonb' })
    seo!: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    sectionVisibility?: Record<string, boolean>;

    @Column({ type: 'jsonb', nullable: true })
    doctorSettings?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
