/**
 * 데이터베이스 연결 설정
 * PostgreSQL 연결 및 기본 설정을 관리합니다.
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

// 데이터베이스 연결 설정
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // 연결 풀 설정
  max: 20, // 최대 연결 수
  min: 2,  // 최소 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃 (30초)
  connectionTimeoutMillis: 2000, // 연결 타임아웃 (2초)
  
  // 쿼리 타임아웃
  query_timeout: 30000, // 쿼리 타임아웃 (30초)
  statement_timeout: 30000, // 명령문 타임아웃 (30초)
};

// 연결 풀 생성
export const pool = new Pool(poolConfig);

// 연결 풀 이벤트 리스너
pool.on('connect', (client) => {
  console.log('🔗 새로운 데이터베이스 클라이언트가 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('❌ 데이터베이스 연결 풀에서 오류가 발생했습니다:', err);
});

pool.on('remove', () => {
  console.log('🔌 데이터베이스 클라이언트 연결이 해제되었습니다.');
});

/**
 * 데이터베이스 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('📅 서버 시간:', result.rows[0].current_time);
    console.log('🗄️ DB 버전:', result.rows[0].db_version.split(' ')[0]);
    
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    return false;
  }
}

/**
 * 트랜잭션 실행 헬퍼
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 쿼리 실행 헬퍼 (로깅 포함)
 */
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('🔍 쿼리 실행:', {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ 쿼리 실행 오류:', {
      query: text,
      params,
      error: error.message
    });
    throw error;
  }
}

/**
 * 데이터베이스 상태 확인
 */
export async function getDbStats() {
  try {
    const stats = await query(`
      SELECT 
        (SELECT count(*) FROM users) as total_users,
        (SELECT count(*) FROM sessions) as total_sessions,
        (SELECT count(*) FROM user_sessions WHERE status = 'completed') as completed_sessions,
        (SELECT count(*) FROM conversations) as total_conversations,
        (SELECT count(*) FROM autobiographies) as total_autobiographies,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size
    `);
    
    return stats.rows[0];
  } catch (error) {
    console.error('❌ DB 통계 조회 오류:', error);
    throw error;
  }
}

/**
 * 애플리케이션 종료 시 연결 풀 정리
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('🔐 데이터베이스 연결 풀이 정상적으로 종료되었습니다.');
  } catch (error) {
    console.error('❌ 연결 풀 종료 중 오류:', error);
  }
}

// 프로세스 종료 시 연결 풀 정리
process.on('SIGINT', async () => {
  console.log('\n🛑 애플리케이션이 종료됩니다...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 애플리케이션이 종료됩니다...');
  await closePool();
  process.exit(0);
});

// 기본 내보내기
export default {
  pool,
  query,
  withTransaction,
  testConnection,
  getDbStats,
  closePool
};