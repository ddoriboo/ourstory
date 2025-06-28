# 🚀 우리 이야기 서비스 설정 가이드

## 📋 필수 설정

### 1. Gemini API 키 설정

#### API 키 발급 방법:
1. **Google AI Studio** 접속: https://aistudio.google.com/
2. **Create API Key** 클릭
3. **Gemini 2.0 Flash** 모델 접근 권한 확인
4. API 키 복사

#### 로컬 개발 환경 설정:
프로젝트 루트에 `.env` 파일 생성:
```bash
# .env
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
VITE_API_BASE_URL=http://localhost:3002
```

#### Railway 프로덕션 환경 설정:
1. Railway 대시보드 접속
2. 프로젝트 선택
3. **Variables** 탭 이동
4. 환경변수 추가:
   - `VITE_GEMINI_API_KEY`: 발급받은 API 키
   - `DATABASE_URL`: PostgreSQL 연결 문자열

### 2. 로컬 개발 서버 실행

#### 프론트엔드 (Port 5173):
```bash
npm run dev
```

#### 백엔드 API (Port 3002):
```bash
npm run dev:server
```

### 3. 프로덕션 배포

#### Railway 자동 배포:
```bash
git add .
git commit -m "Update configuration"
git push origin main
```

## 🔧 문제 해결

### API 키 관련 오류:
- 브라우저 콘솔에서 "API 키 확인: 설정됨" 메시지 확인
- API 키가 유효한지 Google AI Studio에서 테스트

### 데이터베이스 연결 오류:
```bash
npm run db:test    # 연결 테스트
npm run db:setup   # 스키마 재설정
```

### 대화 저장 문제:
- 브라우저 콘솔에서 "대화 저장 성공" 메시지 확인
- 네트워크 탭에서 API 호출 상태 확인

## 📱 사용 방법

1. **회원가입/로그인**: 계정 생성 후 로그인
2. **세션 선택**: 12개 인터뷰 세션 중 선택
3. **인터뷰 진행**: 🎤 버튼으로 음성 대화
4. **진행 상황 확인**: 대화가 실시간으로 DB에 저장됨
5. **자서전 생성**: 모든 세션 완료 후 자서전 생성

## 🌐 접속 URL

- **로컬**: http://localhost:5173
- **프로덕션**: https://ourstory-production.up.railway.app

## 📊 데이터베이스 구조

- **users**: 사용자 정보
- **sessions**: 12개 인터뷰 세션 템플릿
- **user_sessions**: 사용자별 진행 상황
- **conversations**: AI와의 모든 대화 기록
- **autobiographies**: 생성된 자서전
- **user_preferences**: 사용자 설정

## 🔍 디버깅

### 브라우저 콘솔 확인사항:
- ✅ "데이터베이스 연결 성공"
- ✅ "API 키 확인: 설정됨"
- ✅ "사용자 세션 생성됨: [ID]"
- ✅ "대화 저장 성공: ai/user [메시지]"

### 자주 발생하는 문제:
- **"API 키가 설정되지 않았습니다"**: .env 파일 확인
- **"로그인이 필요합니다"**: 토큰 만료, 재로그인 필요
- **"세션 시작에 실패했습니다"**: 백엔드 서버 상태 확인