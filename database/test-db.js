/**
 * 데이터베이스 연결 및 테이블 생성 테스트
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// 환경변수 로드
dotenv.config({ path: './database/.env' });

// 데이터베이스 연결 설정
console.log('🔗 연결 URL:', process.env.DATABASE_PUBLIC_URL ? '설정됨' : '없음');

const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function testDatabaseConnection() {
  console.log('🔍 데이터베이스 연결 테스트 시작...\n');
  
  try {
    // 1. 기본 연결 테스트
    console.log('1️⃣ 기본 연결 테스트...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('📅 서버 시간:', result.rows[0].current_time);
    console.log('🗄️ DB 버전:', result.rows[0].db_version.split(' ')[0]);
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
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('❌ 데이터베이스 테이블이 존재하지 않습니다.');
    }
    
    // 3. 스키마 적용 (테이블이 없는 경우)
    if (tablesResult.rows.length === 0) {
      console.log('\n3️⃣ 스키마 적용 중...');
      const schemaPath = join(process.cwd(), 'database', 'schema.sql');
      const schemaSql = readFileSync(schemaPath, 'utf8');
      
      await pool.query(schemaSql);
      console.log('✅ 스키마가 성공적으로 적용되었습니다.');
      
      // 4. 생성된 테이블 재확인
      console.log('\n4️⃣ 생성된 테이블 확인...');
      const newTablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
        ORDER BY table_name
      `);
      
      console.log('📋 생성된 테이블 목록:');
      newTablesResult.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }
    
    // 5. 각 테이블의 구조 확인
    console.log('\n5️⃣ 테이블 구조 확인...');
    const tables = ['users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences'];
    
    for (const tableName of tables) {
      try {
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (columnsResult.rows.length > 0) {
          console.log(`\n📊 ${tableName} 테이블 구조:`);
          columnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
          });
        }
      } catch (error) {
        console.log(`❌ ${tableName} 테이블을 찾을 수 없습니다.`);
      }
    }
    
    // 6. 초기 데이터 확인
    console.log('\n6️⃣ 초기 데이터 확인...');
    try {
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
      console.log('📈 데이터베이스 통계:');
      console.log(`  - 사용자: ${stats.total_users}명`);
      console.log(`  - 세션 템플릿: ${stats.total_sessions}개`);
      console.log(`  - 사용자 세션: ${stats.total_user_sessions}개`);
      console.log(`  - 대화 기록: ${stats.total_conversations}개`);
      console.log(`  - 자서전: ${stats.total_autobiographies}개`);
      console.log(`  - 사용자 설정: ${stats.total_preferences}개`);
      
    } catch (error) {
      console.log('❌ 통계 조회 중 오류:', error.message);
    }
    
    console.log('\n🎉 데이터베이스 테스트 완료!');
    
  } catch (error) {
    console.error('\n❌ 데이터베이스 테스트 실패:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await pool.end();
  }
}

// 테스트 실행
testDatabaseConnection();