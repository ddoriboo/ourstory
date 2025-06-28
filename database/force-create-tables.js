/**
 * Railway 프로덕션 환경에서 강제로 데이터베이스 테이블 생성
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Railway 공개 URL 사용 (외부 접근 가능) - 최신 URL
const DATABASE_PUBLIC_URL = "postgresql://postgres:ZSDLybTztOtWUyipMTUwYDCSjhPBHkxr@switchyard.proxy.rlwy.net:21741/railway";

const pool = new Pool({
  connectionString: DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

async function forceCreateTables() {
  console.log('🚀 Railway 프로덕션 데이터베이스 테이블 강제 생성 시작...\n');
  console.log('📍 프로젝트: ourstory-production.up.railway.app');
  console.log('🔗 DB URL: roundhouse.proxy.rlwy.net:51141\n');
  
  let client;
  
  try {
    // 1. 연결 테스트
    console.log('1️⃣ 데이터베이스 연결 테스트...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name, version() as version');
    console.log('✅ 연결 성공!');
    console.log('📅 서버 시간:', result.rows[0].current_time);
    console.log('🗄️ 데이터베이스:', result.rows[0].db_name);
    console.log('🔧 PostgreSQL 버전:', result.rows[0].version.split(' ')[1]);
    client.release();
    
    // 2. 기존 테이블 확인 및 삭제 여부 결정
    console.log('\n2️⃣ 기존 테이블 상태 확인...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 기존 테이블 발견:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      console.log('\n⚠️  기존 테이블들을 삭제하고 새로 생성합니다...');
    } else {
      console.log('📋 기존 테이블 없음 - 새로 생성합니다.');
    }
    
    // 3. 스키마 강제 적용 (트랜잭션 사용)
    console.log('\n3️⃣ 스키마 강제 적용 중...');
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    // 큰 트랜잭션으로 모든 작업 수행
    console.log('🔄 트랜잭션 시작...');
    await pool.query('BEGIN');
    
    try {
      // 스키마 실행 (DROP CASCADE 포함되어 있어서 기존 테이블 자동 삭제됨)
      await pool.query(schemaSql);
      await pool.query('COMMIT');
      console.log('✅ 스키마 적용 완료!');
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('❌ 스키마 적용 실패:', error.message);
      throw error;
    }
    
    // 4. 생성된 테이블 검증
    console.log('\n4️⃣ 생성된 테이블 검증...');
    const newTablesResult = await pool.query(`
      SELECT 
        t.table_name,
        (SELECT count(*) 
         FROM information_schema.columns 
         WHERE table_name = t.table_name 
         AND table_schema = 'public') as column_count,
        (SELECT count(*) 
         FROM information_schema.table_constraints 
         WHERE table_name = t.table_name 
         AND table_schema = 'public'
         AND constraint_type = 'PRIMARY KEY') as has_pk
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
      ORDER BY table_name
    `);
    
    console.log('📋 생성된 테이블 검증 결과:');
    newTablesResult.rows.forEach(row => {
      const pkStatus = row.has_pk > 0 ? '✅' : '❌';
      console.log(`  ${pkStatus} ${row.table_name} (${row.column_count}개 컬럼, PK: ${row.has_pk > 0 ? '있음' : '없음'})`);
    });
    
    // 5. 초기 데이터 로드
    console.log('\n5️⃣ 12개 인터뷰 세션 템플릿 로드...');
    
    const sessionCount = await pool.query('SELECT count(*) as count FROM sessions');
    if (sessionCount.rows[0].count === '0') {
      try {
        const initialDataPath = join(__dirname, 'initial_data.sql');
        const initialDataSql = readFileSync(initialDataPath, 'utf8');
        
        console.log('📝 세션 템플릿 데이터 삽입 중...');
        await pool.query('BEGIN');
        await pool.query(initialDataSql);
        await pool.query('COMMIT');
        console.log('✅ 12개 인터뷰 세션 템플릿 삽입 완료!');
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ 초기 데이터 로드 실패:', error.message);
        throw error;
      }
    } else {
      console.log('📝 세션 템플릿이 이미 존재합니다.');
    }
    
    // 6. 인덱스 및 트리거 확인
    console.log('\n6️⃣ 인덱스 및 트리거 확인...');
    const indexResult = await pool.query(`
      SELECT schemaname, tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
      ORDER BY tablename, indexname
    `);
    
    console.log(`📊 생성된 인덱스: ${indexResult.rows.length}개`);
    
    const triggerResult = await pool.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log(`⚡ 생성된 트리거: ${triggerResult.rows.length}개`);
    
    // 7. 최종 데이터베이스 통계
    console.log('\n7️⃣ 최종 데이터베이스 통계...');
    const statsResult = await pool.query(`
      SELECT 
        (SELECT count(*) FROM users) as total_users,
        (SELECT count(*) FROM sessions) as total_sessions,
        (SELECT count(*) FROM user_sessions) as total_user_sessions,
        (SELECT count(*) FROM conversations) as total_conversations,
        (SELECT count(*) FROM autobiographies) as total_autobiographies,
        (SELECT count(*) FROM user_preferences) as total_preferences,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size
    `);
    
    const stats = statsResult.rows[0];
    console.log('📈 최종 데이터베이스 현황:');
    console.log(`  👥 사용자: ${stats.total_users}명`);
    console.log(`  📝 세션 템플릿: ${stats.total_sessions}개`);
    console.log(`  🎯 사용자 세션: ${stats.total_user_sessions}개`);
    console.log(`  💬 대화 기록: ${stats.total_conversations}개`);
    console.log(`  📖 자서전: ${stats.total_autobiographies}개`);
    console.log(`  ⚙️  사용자 설정: ${stats.total_preferences}개`);
    console.log(`  💾 데이터베이스 크기: ${stats.database_size}`);
    
    // 8. 세션 템플릿 미리보기
    console.log('\n8️⃣ 인터뷰 세션 템플릿 미리보기...');
    const sessionsPreview = await pool.query(`
      SELECT 
        session_number,
        title,
        estimated_duration,
        json_array_length(questions) as question_count
      FROM sessions 
      ORDER BY session_number 
      LIMIT 5
    `);
    
    console.log('📋 인터뷰 세션 템플릿 (처음 5개):');
    sessionsPreview.rows.forEach(row => {
      console.log(`  ${row.session_number}. ${row.title} (${row.question_count}개 질문, ${row.estimated_duration}분)`);
    });
    console.log(`  ... 및 ${stats.total_sessions - 5}개 더`);
    
    console.log('\n🎉 데이터베이스 테이블 강제 생성 완료!');
    console.log('🌐 ourstory-production.up.railway.app 준비 완료!');
    console.log('✨ 애플리케이션을 사용할 수 있습니다.');
    
  } catch (error) {
    console.error('\n💥 데이터베이스 생성 실패:');
    console.error('❌ 오류 메시지:', error.message);
    console.error('🔍 상세 정보:', error);
    
    if (error.code) {
      console.error('📋 오류 코드:', error.code);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔐 데이터베이스 연결 종료');
  }
}

// 강제 생성 실행
forceCreateTables();