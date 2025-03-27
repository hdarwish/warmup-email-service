import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1743035378563 implements MigrationInterface {
    name = 'UpdateSchema1743035378563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "name" character varying,
                "tenantId" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Create quotas table
        await queryRunner.query(`
            CREATE TABLE "quotas" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "initialDailyLimit" integer NOT NULL,
                "maxDailyLimit" integer NOT NULL,
                "sentToday" integer NOT NULL DEFAULT 0,
                "totalSent" integer NOT NULL DEFAULT 0,
                "warmupStage" character varying NOT NULL,
                "warmupDay" integer NOT NULL DEFAULT 1,
                "growthRate" double precision NOT NULL DEFAULT 1.1,
                "lastResetDate" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_quotas" PRIMARY KEY ("id"),
                CONSTRAINT "FK_quotas_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create email_credentials table
        await queryRunner.query(`
            CREATE TABLE "email_credentials" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying,
                "provider" character varying NOT NULL,
                "accessToken" character varying,
                "refreshToken" character varying,
                "tokenExpiry" TIMESTAMP,
                "userId" uuid NOT NULL,
                "tenantId" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_email_credentials" PRIMARY KEY ("id"),
                CONSTRAINT "FK_email_credentials_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create emails table
        await queryRunner.query(`
            CREATE TABLE "emails" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "toAddress" character varying NOT NULL,
                "subject" character varying NOT NULL,
                "body" text NOT NULL,
                "status" character varying NOT NULL DEFAULT 'QUEUED',
                "error" character varying,
                "userId" uuid NOT NULL,
                "tenantId" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_emails" PRIMARY KEY ("id"),
                CONSTRAINT "FK_emails_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_tenant" ON "users" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_quotas_user" ON "quotas" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_email_credentials_user" ON "email_credentials" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_email_credentials_tenant" ON "email_credentials" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_emails_user" ON "emails" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_emails_tenant" ON "emails" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_emails_status" ON "emails" ("status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_emails_status"`);
        await queryRunner.query(`DROP INDEX "IDX_emails_tenant"`);
        await queryRunner.query(`DROP INDEX "IDX_emails_user"`);
        await queryRunner.query(`DROP INDEX "IDX_email_credentials_tenant"`);
        await queryRunner.query(`DROP INDEX "IDX_email_credentials_user"`);
        await queryRunner.query(`DROP INDEX "IDX_quotas_user"`);
        await queryRunner.query(`DROP INDEX "IDX_users_tenant"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "emails"`);
        await queryRunner.query(`DROP TABLE "email_credentials"`);
        await queryRunner.query(`DROP TABLE "quotas"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
