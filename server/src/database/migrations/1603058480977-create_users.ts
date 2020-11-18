import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class createUsers1603058480977 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'users',
            columns: [  
                {   name: 'id', type: 'integer', isPrimary: true,
                    isGenerated: true, generationStrategy: 'increment' },
                {   name: 'name', type: 'varchar' },
                {   name: 'email', type: 'varchar', isUnique: true },
                {   name: 'password', type: 'varchar' },  
                {   name: 'date_expires', type: 'datetime', isNullable:true },
                {   name: 'token_expires', type: 'timestamptz', isNullable:true },
                {   name: 'password_token', type: 'varchar', isNullable:true }              
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users')
    }
}
