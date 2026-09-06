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
import { PaymentTransaction } from './entities/PaymentTransaction'
import { Attendance } from './entities/Attendance'
import { Payroll } from './entities/Payroll'
import { Expense } from './entities/Expense'
import { InventoryCategory } from './entities/InventoryCategory'
import { InventoryItem } from './entities/InventoryItem'
import { InventoryBatch } from './entities/InventoryBatch'
import { InventoryStockEntry } from './entities/InventoryStockEntry'
import { InventoryUsageLog } from './entities/InventoryUsageLog'
import { SampleCollection } from './entities/SampleCollection'
import { ResultTemplate } from './entities/ResultTemplate'
import { LabResult } from './entities/LabResult'
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
        LabTest,
        PaymentTransaction,
        Attendance,
        Payroll,
        Expense,
        InventoryCategory,
        InventoryItem,
        InventoryBatch,
        InventoryStockEntry,
        InventoryUsageLog,
        SampleCollection,
        ResultTemplate,
        LabResult
    ],
    synchronize: true,
    logging: false,
    migrations: [],
})
