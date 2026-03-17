import pg, { QueryResultRow } from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const { Pool } = pg;

const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
              host:     process.env.DB_HOST     || 'localhost',
              port:     Number(process.env.DB_PORT) || 5432,
              database: process.env.DB_NAME     || 'ecc_db',
              user:     process.env.DB_USER     || 'postgres',
              password: process.env.DB_PASSWORD || 'password',
          }
);

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
});

export const db = {
    query: <T extends QueryResultRow = any>(text: string, params?: any[]) =>
        pool.query<T>(text, params),
    getClient: () => pool.connect(),
};

// Run schema.sql on first boot (idempotent — uses IF NOT EXISTS)
export async function runMigrations() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.join(__dirname, 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
        console.warn('schema.sql not found — skipping migrations.');
        return;
    }

    const sql = fs.readFileSync(schemaPath, 'utf-8');
    try {
        await pool.query(sql);
        console.log('✅ Database schema applied.');
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        throw err;
    }
}

export default pool;
