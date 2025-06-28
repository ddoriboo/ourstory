/**
 * Railway 프로덕션 데이터베이스 최종 검증
 */

import { Pool } from 'pg';

const DATABASE_PUBLIC_URL = "postgresql://postgres:ZSDLybTztOtWUyipMTUwYDCSjhPBHkxr@switchyard.proxy.rlwy.net:21741/railway";

const pool = new Pool({
  connectionString: DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false },
});

async function verifyDatabase() {
  console.log('🔍 Railway 프로덕션 데이터베이스 최종 검증...\n');
  
  try {
    // 1. 연결 확인
    console.log('1️⃣ 데이터베이스 연결 확인...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name, version() as version');
    console.log('✅ 연결 성공!');
    console.log('📅 서버 시간:', result.rows[0].current_time);
    console.log('🗄️ 데이터베이스:', result.rows[0].db_name);
    console.log('🔧 PostgreSQL 버전:', result.rows[0].version.split(' ')[1]);
    client.release();
    
    // 2. 테이블 존재 확인
    console.log('\n2️⃣ 테이블 존재 확인...');
    const tablesResult = await pool.query(`
      SELECT 
        t.table_name,
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
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name} (${row.column_count}개 컬럼)`);
    });
    
    if (tablesResult.rows.length !== 6) {
      console.log(`❌ 테이블 수가 올바르지 않습니다. 예상: 6개, 실제: ${tablesResult.rows.length}개`);
      return;
    }
    
    // 3. 세션 데이터 확인
    console.log('\n3️⃣ 인터뷰 세션 데이터 확인...');
    const sessionCount = await pool.query('SELECT count(*) as count FROM sessions');
    console.log(`📊 총 세션 수: ${sessionCount.rows[0].count}개`);
    
    if (sessionCount.rows[0].count > 0) {
      const sessions = await pool.query(`
        SELECT 
          session_number, 
          title, 
          estimated_duration,
          length(questions::text) as questions_length
        FROM sessions 
        ORDER BY session_number 
        LIMIT 12
      `);
      
      console.log('📝 인터뷰 세션 목록:');
      sessions.rows.forEach(row => {
        console.log(`  ${row.session_number}. ${row.title} (${row.estimated_duration}분, 질문 데이터: ${row.questions_length}자)`);
      });
    }
    
    // 4. 인덱스 확인
    console.log('\n4️⃣ 인덱스 확인...');
    const indexResult = await pool.query(`
      SELECT schemaname, tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
      ORDER BY tablename, indexname
    `);
    
    console.log(`📊 생성된 인덱스: ${indexResult.rows.length}개`);
    
    // 5. 트리거 확인
    console.log('\n5️⃣ 트리거 확인...');
    const triggerResult = await pool.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log(`⚡ 생성된 트리거: ${triggerResult.rows.length}개`);
    
    // 6. 뷰 확인
    console.log('\n6️⃣ 뷰 확인...');
    const viewResult = await pool.query(`
      SELECT table_name as view_name
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`👁️  생성된 뷰: ${viewResult.rows.length}개`);
    viewResult.rows.forEach(row => {
      console.log(`  - ${row.view_name}`);
    });
    
    // 7. 최종 통계
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
    console.log('📈 데이터베이스 현황:');
    console.log(`  👥 사용자: ${stats.total_users}명`);
    console.log(`  📝 세션 템플릿: ${stats.total_sessions}개`);
    console.log(`  🎯 사용자 세션: ${stats.total_user_sessions}개`);
    console.log(`  💬 대화 기록: ${stats.total_conversations}개`);
    console.log(`  📖 자서전: ${stats.total_autobiographies}개`);
    console.log(`  ⚙️  사용자 설정: ${stats.total_preferences}개`);
    console.log(`  💾 데이터베이스 크기: ${stats.database_size}`);
    
    // 8. 데이터베이스 준비 상태 확인
    console.log('\n8️⃣ 데이터베이스 준비 상태 평가...');
    
    const issues = [];
    if (tablesResult.rows.length !== 6) issues.push('테이블 수 부족');
    if (sessionCount.rows[0].count < 12) issues.push('인터뷰 세션 템플릿 부족');
    if (indexResult.rows.length < 10) issues.push('인덱스 부족');
    
    if (issues.length === 0) {
      console.log('🎉 데이터베이스가 완벽하게 준비되었습니다!');
      console.log('🌐 ourstory-production.up.railway.app 서비스를 시작할 수 있습니다!');
      console.log('✨ 모든 기능이 정상적으로 작동할 것입니다.');
    } else {
      console.log('⚠️  다음 문제들이 발견되었습니다:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
  } catch (error) {
    console.error('\n❌ 데이터베이스 검증 실패:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await pool.end();
    console.log('\n🔐 데이터베이스 연결 종료');
  }
}

// 검증 실행
verifyDatabase();