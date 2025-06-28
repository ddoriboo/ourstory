/**
 * Railway 환경에서 데이터베이스 스키마 적용
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Railway 환경에서는 환경변수가 자동으로 설정됨
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  console.log('🚀 Railway 환경에서 데이터베이스 스키마 설정 시작...\n');
  
  try {
    // 1. 연결 테스트
    console.log('1️⃣ 데이터베이스 연결 테스트...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ 연결 성공!');
    console.log('📅 서버 시간:', result.rows[0].current_time);
    console.log('🗄️ 데이터베이스:', result.rows[0].db_name);
    client.release();
    
    // 2. 기존 테이블 확인
    console.log('\n2️⃣ 기존 테이블 확인...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 기존 테이블 목록:');
      tablesResult.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
      console.log('\n⚠️  테이블이 이미 존재합니다. 다시 생성하시겠습니까? (강제 진행)');
    }
    
    // 3. 스키마 적용
    console.log('\n3️⃣ 스키마 적용 중...');
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    // 트랜잭션으로 전체 스키마 적용
    await pool.query('BEGIN');
    try {
      await pool.query(schemaSql);
      await pool.query('COMMIT');
      console.log('✅ 스키마가 성공적으로 적용되었습니다.');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    
    // 4. 생성된 테이블 확인
    console.log('\n4️⃣ 생성된 테이블 확인...');
    const newTablesResult = await pool.query(`
      SELECT 
        table_name,
        (SELECT count(*) 
         FROM information_schema.columns 
         WHERE table_name = t.table_name 
         AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
      ORDER BY table_name
    `);
    
    console.log('📋 생성된 테이블 목록:');
    newTablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name} (${row.column_count}개 컬럼)`);
    });
    
    // 5. 초기 데이터 확인/설정
    console.log('\n5️⃣ 초기 데이터 설정...');
    
    // 세션 템플릿 데이터가 있는지 확인
    const sessionCount = await pool.query('SELECT count(*) as count FROM sessions');
    if (sessionCount.rows[0].count === '0') {
      console.log('📝 기본 세션 템플릿을 로드합니다...');
      
      // initial_data.sql이 있으면 실행
      try {
        const initialDataPath = join(__dirname, 'initial_data.sql');
        const initialDataSql = readFileSync(initialDataPath, 'utf8');
        await pool.query(initialDataSql);
        console.log('✅ 초기 데이터가 로드되었습니다.');
      } catch (error) {
        console.log('⚠️  initial_data.sql 파일이 없거나 오류가 발생했습니다:', error.message);
      }
    }
    
    // 6. 최종 통계
    console.log('\n6️⃣ 최종 데이터베이스 통계...');
    const statsResult = await pool.query(`
      SELECT 
        (SELECT count(*) FROM users) as total_users,
        (SELECT count(*) FROM sessions) as total_sessions,
        (SELECT count(*) FROM user_sessions) as total_user_sessions,
        (SELECT count(*) FROM conversations) as total_conversations,
        (SELECT count(*) FROM autobiographies) as total_autobiographies,
        (SELECT count(*) FROM user_preferences) as total_preferences
    `);
    
    const stats = statsResult.rows[0];
    console.log('📈 데이터베이스 현황:');
    console.log(`  - 사용자: ${stats.total_users}명`);
    console.log(`  - 세션 템플릿: ${stats.total_sessions}개`);
    console.log(`  - 사용자 세션: ${stats.total_user_sessions}개`);
    console.log(`  - 대화 기록: ${stats.total_conversations}개`);
    console.log(`  - 자서전: ${stats.total_autobiographies}개`);
    console.log(`  - 사용자 설정: ${stats.total_preferences}개`);
    
    console.log('\n🎉 데이터베이스 설정이 완료되었습니다!');
    console.log('🌐 애플리케이션을 시작할 수 있습니다.');
    
  } catch (error) {
    console.error('\n❌ 데이터베이스 설정 실패:', error.message);
    console.error('상세 오류:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 스크립트 실행
setupDatabase();