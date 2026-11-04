import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWebaddressToHospitalSettings1730700000000 implements MigrationInterface {
    name = 'AddWebaddressToHospitalSettings1730700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('hospital_settings');
        if (hasTable) {
            const hasColumn = await queryRunner.hasColumn('hospital_settings', 'webaddress');
            if (!hasColumn) {
                await queryRunner.addColumn(
                    'hospital_settings',
                    new TableColumn({
                        name: 'webaddress',
                        type: 'varchar',
                        length: '200',
                        isNullable: true,
                        default: "''",
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('hospital_settings');
        if (hasTable) {
            const hasColumn = await queryRunner.hasColumn('hospital_settings', 'webaddress');
            if (hasColumn) {
                await queryRunner.dropColumn('hospital_settings', 'webaddress');
            }
        }
    }
}

