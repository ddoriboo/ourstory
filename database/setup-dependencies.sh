#!/bin/bash

# ============================================
# 데이터베이스 연결을 위한 Node.js 의존성 설치
# ============================================

echo "🚀 고령층 AI 자서전 서비스 데이터베이스 의존성 설치를 시작합니다..."

# 메인 프로젝트 디렉토리로 이동
cd "$(dirname "$0")/.."

echo "📦 PostgreSQL 관련 패키지 설치 중..."

# PostgreSQL 클라이언트 및 관련 패키지 설치
npm install --save pg
npm install --save-dev @types/pg

# 환경변수 관리
npm install --save dotenv
npm install --save-dev @types/dotenv

# 데이터베이스 마이그레이션 도구 (선택사항)
npm install --save-dev node-pg-migrate

# 보안 관련 패키지
npm install --save bcrypt
npm install --save-dev @types/bcrypt

# JWT 토큰 관리
npm install --save jsonwebtoken
npm install --save-dev @types/jsonwebtoken

# 날짜 처리
npm install --save date-fns

# 로깅
npm install --save winston

echo "✅ 기본 패키지 설치 완료!"

echo "🔧 package.json에 데이터베이스 스크립트 추가 중..."

# package.json에 스크립트 추가 (jq가 설치된 경우)
if command -v jq &> /dev/null; then
  echo "📝 jq를 사용하여 package.json 업데이트 중..."
  
  # 백업 생성
  cp package.json package.json.backup
  
  # 스크립트 추가
  jq '.scripts += {
    "db:setup": "psql $DATABASE_URL < database/schema.sql",
    "db:seed": "psql $DATABASE_URL < database/initial_data.sql",
    "db:reset": "npm run db:setup && npm run db:seed",
    "db:backup": "pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql",
    "db:test": "node -e \"require('./database/connection.ts').testConnection()\"",
    "db:stats": "node -e \"require('./database/connection.ts').getDbStats().then(console.log)\""
  }' package.json > package.json.tmp && mv package.json.tmp package.json
  
  echo "✅ package.json 스크립트 추가 완료!"
else
  echo "⚠️ jq가 설치되지 않아 package.json을 수동으로 업데이트해야 합니다."
  echo "다음 스크립트들을 package.json의 scripts 섹션에 추가하세요:"
  echo ""
  echo '"db:setup": "psql $DATABASE_URL < database/schema.sql",'
  echo '"db:seed": "psql $DATABASE_URL < database/initial_data.sql",'
  echo '"db:reset": "npm run db:setup && npm run db:seed",'
  echo '"db:backup": "pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql",'
  echo '"db:test": "node -e \"require('"'"'./database/connection.ts'"'"').testConnection()\"",'
  echo '"db:stats": "node -e \"require('"'"'./database/connection.ts'"'"').getDbStats().then(console.log)\""'
fi

echo ""
echo "🎯 설치 완료! 다음 단계를 진행하세요:"
echo ""
echo "1. 환경변수 설정:"
echo "   cp database/.env.example .env"
echo "   # .env 파일에서 DATABASE_URL 등을 실제 값으로 수정"
echo ""
echo "2. 데이터베이스 초기화:"
echo "   npm run db:reset"
echo ""
echo "3. 연결 테스트:"
echo "   npm run db:test"
echo ""
echo "4. 데이터베이스 상태 확인:"
echo "   npm run db:stats"
echo ""
echo "🔧 사용 가능한 명령어:"
echo "   npm run db:setup  - 데이터베이스 스키마 생성"
echo "   npm run db:seed   - 기본 데이터 삽입"
echo "   npm run db:reset  - 전체 초기화"
echo "   npm run db:backup - 데이터베이스 백업"
echo "   npm run db:test   - 연결 테스트"
echo "   npm run db:stats  - 현황 통계"
echo ""
echo "✨ 모든 설정이 완료되었습니다!"