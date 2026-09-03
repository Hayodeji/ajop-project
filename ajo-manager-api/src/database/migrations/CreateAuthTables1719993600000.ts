import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1719993600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
        phone_verified_at TIMESTAMP,
        email_verified_at TIMESTAMP,
        profile_picture_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT false,
        is_suspended BOOLEAN NOT NULL DEFAULT false,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for users
    await queryRunner.query(`CREATE INDEX idx_users_phone ON users(phone)`);
    await queryRunner.query(
      `CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL`,
    );
    await queryRunner.query(`CREATE INDEX idx_users_role ON users(role)`);
    await queryRunner.query(`CREATE INDEX idx_users_is_active ON users(is_active)`);
    await queryRunner.query(`CREATE INDEX idx_users_is_suspended ON users(is_suspended)`);

    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for refresh_tokens
    await queryRunner.query(
      `CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked) WHERE revoked = false`,
    );

    // Create otp_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS otp_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        verified_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for otp_logs
    await queryRunner.query(`CREATE INDEX idx_otp_logs_phone ON otp_logs(phone)`);
    await queryRunner.query(`CREATE INDEX idx_otp_logs_expires_at ON otp_logs(expires_at)`);
    await queryRunner.query(
      `CREATE INDEX idx_otp_logs_pending ON otp_logs(created_at) WHERE verified_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop otp_logs table
    await queryRunner.query(`DROP TABLE IF EXISTS otp_logs CASCADE`);

    // Drop refresh_tokens table
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);

    // Drop users table
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
  }
}
