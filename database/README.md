# 🗄️ 고령층 AI 자서전 서비스 데이터베이스

## 📋 개요

이 데이터베이스는 **고령층을 위한 AI 기반 자서전 만들기 서비스**를 위해 설계되었습니다. 사용자의 인생 이야기를 12개 세션에 걸쳐 체계적으로 수집하고, AI를 통해 아름다운 자서전으로 생성하는 전체 과정을 지원합니다.

## 🏗️ 데이터베이스 구조

### 주요 테이블

| 테이블명 | 설명 | 주요 기능 |
|---------|-----|----------|
| `users` | 사용자 계정 정보 | 회원가입, 로그인, 프로필 관리 |
| `sessions` | 12개 인터뷰 세션 메타데이터 | 세션별 질문과 구조 정의 |
| `user_sessions` | 사용자별 세션 진행 상황 | 진행률 추적, 완료 상태 관리 |
| `conversations` | AI-사용자 대화 기록 | 모든 대화 내역 저장 |
| `autobiographies` | 생성된 자서전 | AI로 생성된 자서전 관리 |
| `user_preferences` | 사용자 설정 | API 키, 개인설정 저장 |

### 주요 뷰

| 뷰명 | 설명 |
|-----|-----|
| `user_progress_summary` | 사용자별 전체 진행 현황 요약 |
| `session_conversation_stats` | 세션별 대화 통계 |

## 🚀 설치 및 설정

### 1. 스키마 생성

```bash
# PostgreSQL에 연결하여 스키마 생성
psql "postgresql://postgres:ZSDLybTztOtWUyipMTUwYDCSjhPBHkxr@postgres.railway.internal:5432/railway" < schema.sql
```

### 2. 기본 데이터 삽입

```bash
# 12개 세션의 기본 데이터 삽입
psql "postgresql://postgres:ZSDLybTztOtWUyipMTUwYDCSjhPBHkxr@postgres.railway.internal:5432/railway" < initial_data.sql
```

## 📊 주요 쿼리 모음

### 👤 사용자 관리

```sql
-- 1. 사용자 전체 현황 조회
SELECT 
    username,
    full_name,
    completed_sessions,
    total_sessions,
    completion_percentage,
    last_activity
FROM user_progress_summary
ORDER BY completion_percentage DESC;

-- 2. 신규 사용자 생성
INSERT INTO users (username, password_hash, full_name, email, birth_year)
VALUES ('user123', '$2b$12$...', '김할아버지', 'kim@example.com', 1950);

-- 3. 사용자별 전체 진행 상황
SELECT 
    u.username,
    s.session_number,
    s.title,
    us.status,
    us.progress_percent,
    us.last_updated
FROM users u
JOIN user_sessions us ON u.id = us.user_id
JOIN sessions s ON us.session_id = s.id
WHERE u.username = 'user123'
ORDER BY s.session_number;
```

### 📚 세션 관리

```sql
-- 1. 모든 세션 목록 조회
SELECT 
    session_number,
    title,
    description,
    json_array_length(questions) as question_count,
    estimated_duration
FROM sessions
ORDER BY session_number;

-- 2. 특정 세션의 질문 조회
SELECT 
    title,
    json_array_elements_text(questions) as question
FROM sessions
WHERE session_number = 1;

-- 3. 세션별 참여 통계
SELECT 
    s.session_number,
    s.title,
    COUNT(us.id) as total_participants,
    COUNT(CASE WHEN us.status = 'completed' THEN 1 END) as completed_count,
    ROUND(
        COUNT(CASE WHEN us.status = 'completed' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(us.id), 0), 2
    ) as completion_rate
FROM sessions s
LEFT JOIN user_sessions us ON s.id = us.session_id
GROUP BY s.session_number, s.title
ORDER BY s.session_number;
```

### 💬 대화 분석

```sql
-- 1. 사용자별 대화 통계
SELECT 
    u.username,
    COUNT(c.id) as total_messages,
    COUNT(CASE WHEN c.speaker = 'user' THEN 1 END) as user_messages,
    COUNT(CASE WHEN c.speaker = 'ai' THEN 1 END) as ai_messages,
    SUM(LENGTH(c.message_text)) as total_characters,
    MIN(c.message_timestamp) as first_conversation,
    MAX(c.message_timestamp) as last_conversation
FROM users u
JOIN user_sessions us ON u.id = us.user_id
JOIN conversations c ON us.id = c.user_session_id
WHERE u.username = 'user123'
GROUP BY u.id, u.username;

-- 2. 세션별 대화 내역 조회
SELECT 
    c.speaker,
    c.message_text,
    c.message_timestamp,
    c.question_index
FROM conversations c
JOIN user_sessions us ON c.user_session_id = us.id
JOIN users u ON us.user_id = u.id
JOIN sessions s ON us.session_id = s.id
WHERE u.username = 'user123' 
  AND s.session_number = 1
ORDER BY c.message_timestamp;

-- 3. 일별 대화 활동량
SELECT 
    DATE(c.message_timestamp) as conversation_date,
    COUNT(c.id) as message_count,
    COUNT(DISTINCT us.user_id) as active_users
FROM conversations c
JOIN user_sessions us ON c.user_session_id = us.id
WHERE c.message_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(c.message_timestamp)
ORDER BY conversation_date DESC;
```

### 📖 자서전 관리

```sql
-- 1. 생성된 자서전 목록
SELECT 
    u.username,
    a.title,
    a.word_count,
    a.character_count,
    a.generated_at,
    a.api_provider,
    a.status
FROM autobiographies a
JOIN users u ON a.user_id = u.id
ORDER BY a.generated_at DESC;

-- 2. 사용자별 자서전 버전 관리
SELECT 
    version,
    title,
    status,
    generated_at,
    word_count,
    LENGTH(content) as content_length
FROM autobiographies
WHERE user_id = (SELECT id FROM users WHERE username = 'user123')
ORDER BY version DESC;

-- 3. 자서전 생성 통계
SELECT 
    DATE(generated_at) as generation_date,
    COUNT(*) as autobiographies_generated,
    AVG(word_count) as avg_word_count,
    api_provider
FROM autobiographies
WHERE generated_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(generated_at), api_provider
ORDER BY generation_date DESC;
```

### ⚙️ 시스템 관리

```sql
-- 1. 테이블별 레코드 수 확인
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as current_records
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY current_records DESC;

-- 2. 사용자 활동 분석
SELECT 
    DATE_TRUNC('week', last_login) as week,
    COUNT(*) as active_users
FROM users
WHERE last_login >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY DATE_TRUNC('week', last_login)
ORDER BY week DESC;

-- 3. 데이터베이스 크기 확인
SELECT 
    pg_size_pretty(pg_database_size('railway')) as database_size;
```

## 🔧 유지보수

### 정기 백업

```sql
-- 백업 스크립트 (bash)
pg_dump "postgresql://postgres:ZSDLybTztOtWUyipMTUwYDCSjhPBHkxr@postgres.railway.internal:5432/railway" > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 성능 최적화

```sql
-- 1. 인덱스 사용 통계 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 2. 느린 쿼리 분석
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%conversations%'
ORDER BY total_time DESC
LIMIT 10;
```

### 데이터 정리

```sql
-- 1. 오래된 임시 데이터 정리 (30일 이상)
DELETE FROM conversations 
WHERE created_at < CURRENT_DATE - INTERVAL '30 days'
  AND user_session_id IN (
    SELECT id FROM user_sessions WHERE status = 'not_started'
  );

-- 2. 중복 자서전 버전 정리
DELETE FROM autobiographies 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM autobiographies
    ORDER BY user_id, version DESC
)
AND status = 'draft';
```

## 🔐 보안 고려사항

1. **비밀번호**: bcrypt로 해시화하여 저장
2. **API 키**: `user_preferences`에서 암호화 저장
3. **개인정보**: 최소한의 정보만 수집
4. **접근 제어**: 사용자별 데이터 격리

## 📈 모니터링 지표

### 핵심 KPI

```sql
-- 1. 일일 활성 사용자 (DAU)
SELECT COUNT(DISTINCT user_id) as dau
FROM conversations
WHERE DATE(message_timestamp) = CURRENT_DATE;

-- 2. 세션 완료율
SELECT 
    AVG(CASE WHEN status = 'completed' THEN 1.0 ELSE 0.0 END) * 100 as completion_rate
FROM user_sessions;

-- 3. 자서전 생성 성공률
SELECT 
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN status = 'final' THEN 1 END) as successful_generations,
    ROUND(
        COUNT(CASE WHEN status = 'final' THEN 1 END) * 100.0 / COUNT(*), 2
    ) as success_rate
FROM autobiographies;
```

## 🆘 문제 해결

### 일반적인 문제들

1. **연결 오류**: Railway PostgreSQL 연결 문자열 확인
2. **권한 오류**: 데이터베이스 사용자 권한 확인
3. **성능 저하**: 인덱스 재구성 및 VACUUM ANALYZE 실행

```sql
-- 테이블 최적화
VACUUM ANALYZE users;
VACUUM ANALYZE conversations;
VACUUM ANALYZE autobiographies;
```

---

**📞 지원**: 문제가 발생하면 개발팀에 문의하세요.
**📅 업데이트**: 2025-06-28