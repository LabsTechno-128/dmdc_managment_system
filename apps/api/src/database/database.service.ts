import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { loadConfig } from '@hospital/config';
import { createDataSource, Patients, User, Doctor, DiagnosticTest, Billing, BillingItem, TestOrder, Report, Notification, Employee, Appointment } from '@hospital/database';
import { randomUUID } from 'crypto';
import { newDb } from 'pg-mem';
import { DataSource, Repository } from 'typeorm';



@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private dataSource?: DataSource;


    async onModuleInit() {
        const cfg = loadConfig();
        // In test environment, always use in-memory pg-mem to isolate suites
        if (cfg.nodeEnv !== 'test' && cfg.databaseUrl) {
            this.dataSource = createDataSource(cfg.databaseUrl);
            await this.dataSource.initialize();
            // Auto-sync schema - enable via DB_SYNCHRONIZE=true env var in production
            const shouldSync = cfg.nodeEnv !== 'production' || process.env.DB_SYNCHRONIZE === 'true';
            if (shouldSync) {
                console.log('🔄 Synchronizing database schema...');
                await this.dataSource.synchronize();
                console.log('✅ Database schema synchronized');
            }

            // Create the custom sequence for patient IDs since TypeORM synchronize won't automatically create it
            await this.dataSource.query(`CREATE SEQUENCE IF NOT EXISTS patient_id_seq;`);

            return;
        }

        const pg = newDb({ autoCreateForeignKeyIndices: true });
        pg.public.registerFunction({ name: 'version', implementation: () => 'PostgreSQL 14.0' });
        pg.public.registerFunction({ name: 'current_database', implementation: () => 'pg_mem' });
        pg.public.registerFunction({
            name: 'uuid_generate_v4',
            implementation: () => randomUUID(),
            impure: true,
        });

        this.dataSource = pg.adapters.createTypeormDataSource({
            type: 'postgres',
            entities: [
                User,
                Employee,
                Patients,
                Doctor,
                DiagnosticTest,
                Billing,
                BillingItem,
                TestOrder,
                Report,
                Notification,
                Appointment
            ],
            synchronize: true,
            logging: false,
        }) as unknown as DataSource;

        await this.dataSource.initialize();
    }

    async onModuleDestroy() {
        if (this.dataSource && this.dataSource.isInitialized) {
            await this.dataSource.destroy();
        }
    }

    getDataSource(): DataSource {
        if (!this.dataSource || !this.dataSource.isInitialized) {
            throw new Error('DataSource not initialized');
        }
        return this.dataSource;
    }

    // Convenience repository getters
    repoUser(): Repository<User> {
        return this.getDataSource().getRepository(User);
    }
    repoPatients(): Repository<Patients> {
        return this.getDataSource().getRepository(Patients);
    }
    repoDoctor(): Repository<Doctor> {
        return this.getDataSource().getRepository(Doctor);
    }
    repoDiagnosticTest(): Repository<DiagnosticTest> {
        return this.getDataSource().getRepository(DiagnosticTest);
    }
    repoBilling(): Repository<Billing> {
        return this.getDataSource().getRepository(Billing);
    }
    repoBillingItem(): Repository<BillingItem> {
        return this.getDataSource().getRepository(BillingItem);
    }
    repoTestOrder(): Repository<TestOrder> {
        return this.getDataSource().getRepository(TestOrder);
    }
    repoReport(): Repository<Report> {
        return this.getDataSource().getRepository(Report);
    }
    repoNotification(): Repository<Notification> {
        return this.getDataSource().getRepository(Notification);
    }
    repoAppointment(): Repository<Appointment> {
        return this.getDataSource().getRepository(Appointment);
    }
}
// trigger recompile 2
