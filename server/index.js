/**
 * 고령층 AI 자서전 서비스 백엔드 API 서버
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경변수 로드
dotenv.config({ path: join(__dirname, '../database/.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// 미들웨어 설정
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'https://ourstory-production.up.railway.app'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(join(__dirname, '../dist')));

// 데이터베이스 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '토큰이 필요합니다' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ourstory-secret-key');
    
    // 사용자 정보 조회
    const userResult = await pool.query('SELECT id, username, full_name FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: '유효하지 않은 사용자입니다' });
    }
    
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    res.status(403).json({ error: '유효하지 않은 토큰입니다' });
  }
};

// 헬스체크 API
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: '연결됨',
      server_time: result.rows[0].server_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// ======================
// 인증 API
// ======================

// 회원가입
app.post('/api/auth/register', async (req, res) => {
  const { username, password, full_name, birth_year } = req.body;

  try {
    // 사용자명 중복 확인
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 아이디입니다' });
    }

    // 비밀번호 해시화
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const result = await pool.query(`
      INSERT INTO users (username, password_hash, full_name, birth_year, created_at, last_login)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, username, full_name, birth_year, created_at
    `, [username, password_hash, full_name, birth_year]);

    const user = result.rows[0];

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'ourstory-secret-key',
      { expiresIn: process.env.SESSION_TIMEOUT || '24h' }
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        birth_year: user.birth_year
      },
      token
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다' });
  }
});

// 로그인
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 사용자 조회
    const result = await pool.query('SELECT id, username, password_hash, full_name, birth_year FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '존재하지 않는 계정입니다' });
    }

    const user = result.rows[0];

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
    }

    // 마지막 로그인 시간 업데이트
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'ourstory-secret-key',
      { expiresIn: process.env.SESSION_TIMEOUT || '24h' }
    );

    res.json({
      message: '로그인이 완료되었습니다',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        birth_year: user.birth_year
      },
      token
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다' });
  }
});

// ======================
// 세션 API
// ======================

// 모든 세션 템플릿 조회
app.get('/api/sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        session_number,
        title,
        description,
        questions,
        estimated_duration,
        order_index
      FROM sessions 
      ORDER BY session_number
    `);

    res.json({
      sessions: result.rows
    });
  } catch (error) {
    console.error('세션 조회 오류:', error);
    res.status(500).json({ error: '세션 조회 중 오류가 발생했습니다' });
  }
});

// 사용자별 세션 진행 상황 조회
app.get('/api/user-sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        us.id,
        us.session_id,
        us.status,
        us.started_at,
        us.completed_at,
        us.progress_percent,
        us.last_updated,
        s.session_number,
        s.title,
        s.description,
        s.questions,
        s.estimated_duration
      FROM user_sessions us
      JOIN sessions s ON us.session_id = s.id
      WHERE us.user_id = $1
      ORDER BY s.session_number
    `, [req.user.id]);

    res.json({
      userSessions: result.rows
    });
  } catch (error) {
    console.error('사용자 세션 조회 오류:', error);
    res.status(500).json({ error: '사용자 세션 조회 중 오류가 발생했습니다' });
  }
});

// 세션 시작
app.post('/api/user-sessions/:sessionId/start', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;

  try {
    // 기존 사용자 세션 확인
    let userSession = await pool.query(`
      SELECT id, status FROM user_sessions 
      WHERE user_id = $1 AND session_id = $2
    `, [req.user.id, sessionId]);

    if (userSession.rows.length === 0) {
      // 새 사용자 세션 생성
      const result = await pool.query(`
        INSERT INTO user_sessions (user_id, session_id, status, started_at, last_updated)
        VALUES ($1, $2, 'in_progress', NOW(), NOW())
        RETURNING id, status, started_at, last_updated
      `, [req.user.id, sessionId]);
      userSession = result;
    } else {
      // 기존 세션 상태 업데이트
      const result = await pool.query(`
        UPDATE user_sessions 
        SET status = 'in_progress', 
            started_at = COALESCE(started_at, NOW()),
            last_updated = NOW()
        WHERE id = $1
        RETURNING id, status, started_at, last_updated
      `, [userSession.rows[0].id]);
      userSession = result;
    }

    res.json({
      message: '세션이 시작되었습니다',
      userSession: userSession.rows[0]
    });
  } catch (error) {
    console.error('세션 시작 오류:', error);
    res.status(500).json({ error: '세션 시작 중 오류가 발생했습니다' });
  }
});

// ======================
// 대화 API
// ======================

// 대화 내역 조회
app.get('/api/conversations/:userSessionId', authenticateToken, async (req, res) => {
  const { userSessionId } = req.params;

  try {
    // 권한 확인
    const userSessionCheck = await pool.query(`
      SELECT id FROM user_sessions 
      WHERE id = $1 AND user_id = $2
    `, [userSessionId, req.user.id]);

    if (userSessionCheck.rows.length === 0) {
      return res.status(403).json({ error: '접근 권한이 없습니다' });
    }

    const result = await pool.query(`
      SELECT 
        id,
        speaker,
        message_text,
        message_timestamp,
        question_index,
        created_at
      FROM conversations
      WHERE user_session_id = $1
      ORDER BY message_timestamp ASC
    `, [userSessionId]);

    res.json({
      conversations: result.rows
    });
  } catch (error) {
    console.error('대화 조회 오류:', error);
    res.status(500).json({ error: '대화 조회 중 오류가 발생했습니다' });
  }
});

// 대화 저장
app.post('/api/conversations', authenticateToken, async (req, res) => {
  const { userSessionId, speaker, messageText, questionIndex } = req.body;

  try {
    // 권한 확인
    const userSessionCheck = await pool.query(`
      SELECT id FROM user_sessions 
      WHERE id = $1 AND user_id = $2
    `, [userSessionId, req.user.id]);

    if (userSessionCheck.rows.length === 0) {
      return res.status(403).json({ error: '접근 권한이 없습니다' });
    }

    // 대화 저장
    const result = await pool.query(`
      INSERT INTO conversations (user_session_id, speaker, message_text, question_index, message_timestamp)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, speaker, message_text, message_timestamp, question_index, created_at
    `, [userSessionId, speaker, messageText, questionIndex]);

    // 세션 last_updated 업데이트
    await pool.query(`
      UPDATE user_sessions 
      SET last_updated = NOW()
      WHERE id = $1
    `, [userSessionId]);

    res.status(201).json({
      message: '대화가 저장되었습니다',
      conversation: result.rows[0]
    });
  } catch (error) {
    console.error('대화 저장 오류:', error);
    res.status(500).json({ error: '대화 저장 중 오류가 발생했습니다' });
  }
});

// ======================
// 자서전 API
// ======================

// 자서전 생성
app.post('/api/autobiographies', authenticateToken, async (req, res) => {
  const { title, content, apiProvider, modelVersion } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO autobiographies (user_id, title, content, api_provider, model_version, word_count, character_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, generated_at, status, word_count, character_count
    `, [
      req.user.id,
      title || '나의 자서전',
      content,
      apiProvider || 'gemini',
      modelVersion,
      content.split(/\s+/).length,
      content.length
    ]);

    res.status(201).json({
      message: '자서전이 생성되었습니다',
      autobiography: result.rows[0]
    });
  } catch (error) {
    console.error('자서전 생성 오류:', error);
    res.status(500).json({ error: '자서전 생성 중 오류가 발생했습니다' });
  }
});

// 사용자 자서전 목록 조회
app.get('/api/autobiographies', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        title,
        generated_at,
        status,
        word_count,
        character_count,
        api_provider,
        model_version,
        updated_at
      FROM autobiographies
      WHERE user_id = $1
      ORDER BY generated_at DESC
    `, [req.user.id]);

    res.json({
      autobiographies: result.rows
    });
  } catch (error) {
    console.error('자서전 조회 오류:', error);
    res.status(500).json({ error: '자서전 조회 중 오류가 발생했습니다' });
  }
});

// ======================
// SPA 라우팅 (프론트엔드)
// ======================
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ 데이터베이스 연결 성공:', result.rows[0].current_time);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 서버가 시작되었습니다!`);
      console.log(`📍 로컬: http://localhost:${PORT}`);
      console.log(`🌐 프로덕션: https://ourstory-production.up.railway.app`);
      console.log(`🔧 환경: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 프로세스 종료 처리
process.on('SIGINT', async () => {
  console.log('\n🛑 서버 종료 중...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 서버 종료 중...');
  await pool.end();
  process.exit(0);
});

startServer();