-- ============================================
-- 고령층 AI 자서전 서비스 데이터베이스 스키마
-- ============================================
-- 생성일: 2025-06-28
-- 설명: 고령층을 위한 AI 기반 자서전 만들기 서비스의 전체 데이터베이스 구조

-- 기존 테이블 삭제 (역순으로)
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS autobiographies CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(100),
    birth_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. 인터뷰 세션 메타데이터 테이블 (12개 세션)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_number INTEGER UNIQUE NOT NULL CHECK (session_number BETWEEN 1 AND 12),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- 질문들을 JSON 배열로 저장
    order_index INTEGER NOT NULL,
    estimated_duration INTEGER, -- 예상 소요 시간 (분)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 사용자별 세션 진행 상황 테이블
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    UNIQUE(user_id, session_id)
);

-- 4. 대화 기록 테이블
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_session_id INTEGER NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    speaker VARCHAR(10) NOT NULL CHECK (speaker IN ('ai', 'user')),
    message_text TEXT NOT NULL,
    message_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    question_index INTEGER, -- 몇 번째 질문에 대한 응답인지
    audio_file_url VARCHAR(500), -- 음성 파일 URL (향후 확장용)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 생성된 자서전 테이블
CREATE TABLE autobiographies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) DEFAULT '나의 자서전',
    content TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    api_provider VARCHAR(50) DEFAULT 'chatgpt', -- chatgpt, claude, etc.
    model_version VARCHAR(50),
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
    word_count INTEGER,
    character_count INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 사용자 설정 및 환경설정 테이블
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE, -- API 키 등 민감 정보 암호화 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

-- 사용자 관련 인덱스
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 세션 관련 인덱스
CREATE INDEX idx_sessions_session_number ON sessions(session_number);
CREATE INDEX idx_sessions_order_index ON sessions(order_index);

-- 사용자 세션 관련 인덱스
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
CREATE INDEX idx_user_sessions_last_updated ON user_sessions(last_updated);

-- 대화 관련 인덱스
CREATE INDEX idx_conversations_user_session_id ON conversations(user_session_id);
CREATE INDEX idx_conversations_speaker ON conversations(speaker);
CREATE INDEX idx_conversations_timestamp ON conversations(message_timestamp);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- 자서전 관련 인덱스
CREATE INDEX idx_autobiographies_user_id ON autobiographies(user_id);
CREATE INDEX idx_autobiographies_status ON autobiographies(status);
CREATE INDEX idx_autobiographies_generated_at ON autobiographies(generated_at);

-- 사용자 설정 관련 인덱스
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_key ON user_preferences(preference_key);

-- ============================================
-- 트리거 함수 및 트리거 생성
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_autobiographies_updated_at BEFORE UPDATE ON autobiographies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 기본 제약 조건 및 검증 규칙
-- ============================================

-- 사용자명 검증 (영문, 숫자, 언더스코어만 허용)
ALTER TABLE users ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_]{3,50}$');

-- 비밀번호 최소 길이 검증 (해시된 상태이므로 최소 60자)
ALTER TABLE users ADD CONSTRAINT password_hash_length_check 
CHECK (LENGTH(password_hash) >= 60);

-- 이메일 형식 검증
ALTER TABLE users ADD CONSTRAINT email_format_check 
CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 출생년도 검증 (1900년 ~ 현재년도)
ALTER TABLE users ADD CONSTRAINT birth_year_check 
CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= EXTRACT(YEAR FROM CURRENT_DATE)));

-- 세션 번호는 1-12 사이
ALTER TABLE sessions ADD CONSTRAINT session_number_range_check 
CHECK (session_number BETWEEN 1 AND 12);

-- 메시지 텍스트 최소 길이
ALTER TABLE conversations ADD CONSTRAINT message_text_not_empty_check 
CHECK (LENGTH(TRIM(message_text)) > 0);

-- 자서전 내용 최소 길이
ALTER TABLE autobiographies ADD CONSTRAINT content_not_empty_check 
CHECK (LENGTH(TRIM(content)) > 0);

-- ============================================
-- 뷰 생성 (자주 사용되는 쿼리 최적화)
-- ============================================

-- 사용자별 진행 현황 뷰
CREATE VIEW user_progress_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    COUNT(us.id) as total_sessions,
    COUNT(CASE WHEN us.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN us.status = 'in_progress' THEN 1 END) as in_progress_sessions,
    ROUND(
        (COUNT(CASE WHEN us.status = 'completed' THEN 1 END) * 100.0 / 
         NULLIF(COUNT(us.id), 0)), 2
    ) as completion_percentage,
    MAX(us.last_updated) as last_activity
FROM users u
LEFT JOIN user_sessions us ON u.id = us.user_id
GROUP BY u.id, u.username, u.full_name;

-- 세션별 대화 통계 뷰
CREATE VIEW session_conversation_stats AS
SELECT 
    us.id as user_session_id,
    us.user_id,
    us.session_id,
    s.title as session_title,
    COUNT(c.id) as total_messages,
    COUNT(CASE WHEN c.speaker = 'user' THEN 1 END) as user_messages,
    COUNT(CASE WHEN c.speaker = 'ai' THEN 1 END) as ai_messages,
    MIN(c.message_timestamp) as first_message_at,
    MAX(c.message_timestamp) as last_message_at,
    SUM(LENGTH(c.message_text)) as total_characters
FROM user_sessions us
JOIN sessions s ON us.session_id = s.id
LEFT JOIN conversations c ON us.id = c.user_session_id
GROUP BY us.id, us.user_id, us.session_id, s.title;

-- ============================================
-- 스키마 정보 확인 쿼리
-- ============================================

-- 모든 테이블 목록 및 레코드 수 확인
-- SELECT 
--     schemaname,
--     tablename,
--     attname as column_name,
--     typname as data_type
-- FROM pg_tables t
-- JOIN pg_attribute a ON a.attrelid = (schemaname||'.'||tablename)::regclass
-- JOIN pg_type ty ON a.atttypid = ty.oid
-- WHERE schemaname = 'public' 
--   AND tablename IN ('users', 'sessions', 'user_sessions', 'conversations', 'autobiographies', 'user_preferences')
--   AND a.attnum > 0
-- ORDER BY tablename, a.attnum;

COMMENT ON TABLE users IS '사용자 계정 정보를 저장하는 테이블';
COMMENT ON TABLE sessions IS '12개 인터뷰 세션의 메타데이터를 저장하는 테이블';
COMMENT ON TABLE user_sessions IS '사용자별 세션 진행 상황을 추적하는 테이블';
COMMENT ON TABLE conversations IS 'AI와 사용자 간의 모든 대화 내역을 저장하는 테이블';
COMMENT ON TABLE autobiographies IS '생성된 자서전을 저장하는 테이블';
COMMENT ON TABLE user_preferences IS '사용자 설정 및 API 키 등을 저장하는 테이블';

-- 스키마 생성 완료 메시지
SELECT 'Database schema for 고령층 AI 자서전 서비스 created successfully!' as status;