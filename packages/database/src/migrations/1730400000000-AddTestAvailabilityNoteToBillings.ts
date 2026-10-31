import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTestAvailabilityNoteToBillings1730400000000 implements MigrationInterface {
    name = 'AddTestAvailabilityNoteToBillings1730400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('billings', 'test_availability_note');
        if (!hasColumn) {
            await queryRunner.addColumn(
                'billings',
                new TableColumn({
                    name: 'test_availability_note',
                    type: 'text',
                    isNullable: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('billings', 'test_availability_note');
        if (hasColumn) {
            await queryRunner.dropColumn('billings', 'test_availability_note');
        }
    }
}

