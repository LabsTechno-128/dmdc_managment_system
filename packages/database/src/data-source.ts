import 'reflect-metadata'

import { DataSource } from 'typeorm'
import { User } from './entities/User'
import { Patients } from './entities/Patients'
import { Doctor } from './entities/Doctor'
import { DiagnosticTest } from './entities/DiagnosticTest'
import { Billing } from './entities/Billing'
import { BillingItem } from './entities/BillingItem'
import { TestOrder } from './entities/TestOrder'
import { Report } from './entities/Report'
import { Notification } from './entities/Notification'
import { Employee } from './entities/employee'
import { Appointment } from './entities/Appointment'
import { LabTest } from './entities/LabTest'

export const createDataSource = (databaseUrl: string) => new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [
        User,
        Patients,
        Doctor,
        DiagnosticTest,
        Billing,
        BillingItem,
        TestOrder,
        Report,
        Notification,
        Employee,
        Appointment,
        LabTest
    ],
    synchronize: true,
    logging: false,
    migrations: [],
})
