/**
 * Railway 배포 시 자동으로 실행되는 데이터베이스 설정 훅
 * package.json의 build 스크립트에서 호출됩니다.
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabaseOnDeploy() {
  // Railway 환경에서만 실행
  if (!process.env.RAILWAY_ENVIRONMENT) {
    console.log('⚠️  Railway 환경이 아닙니다. 스키마 설정을 건너뜁니다.');
    return;
  }
  
  console.log('🚀 Railway 배포 중 데이터베이스 자동 설정...');
  console.log('🌍 환경:', process.env.RAILWAY_ENVIRONMENT);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  try {
    // 연결 테스트
    console.log('🔗 데이터베이스 연결 확인...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ 연결 성공:', result.rows[0].current_time);
    client.release();
    
    // 테이블 존재 확인
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
    `);
    
    if (tablesResult.rows.length >= 6) {
      console.log('✅ 모든 테이블이 이미 존재합니다.');
      return;
    }
    
    console.log('📋 일부 테이블이 누락되었습니다. 스키마를 적용합니다...');
    
    // 스키마 적용
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    await pool.query('BEGIN');
    await pool.query(schemaSql);
    await pool.query('COMMIT');
    console.log('✅ 스키마 적용 완료');
    
    // 초기 데이터 확인 및 로드
    const sessionCount = await pool.query('SELECT count(*) as count FROM sessions');
    if (sessionCount.rows[0].count === '0') {
      const initialDataPath = join(__dirname, 'initial_data.sql');
      const initialDataSql = readFileSync(initialDataPath, 'utf8');
      
      await pool.query('BEGIN');
      await pool.query(initialDataSql);
      await pool.query('COMMIT');
      console.log('✅ 초기 데이터 로드 완료');
    }
    
    console.log('🎉 데이터베이스 설정 완료!');
    
  } catch (error) {
    console.error('❌ 데이터베이스 설정 실패:', error.message);
    // Railway 배포는 계속 진행되도록 에러를 던지지 않음
  } finally {
    await pool.end();
  }
}

// 배포 시 자동 실행
setupDatabaseOnDeploy();