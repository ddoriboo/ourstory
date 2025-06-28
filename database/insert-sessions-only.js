/**
 * 한국어 인터뷰 세션 데이터만 별도로 안전하게 삽입
 */

import { Pool } from 'pg';

const DATABASE_PUBLIC_URL = "postgresql://postgres:ZSDLybTztOtWUyipMTUwYDCSjhPBHkxr@switchyard.proxy.rlwy.net:21741/railway";

const pool = new Pool({
  connectionString: DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false },
});

// 12개 인터뷰 세션 데이터 (JavaScript 객체로 안전하게 정의)
const sessions = [
  {
    session_number: 1,
    title: '프롤로그 - 나의 뿌리와 세상의 시작',
    description: '어르신의 가족 배경, 출생지, 그리고 이름의 유래 등 인생의 기초가 되는 이야기를 나누는 세션입니다.',
    questions: [
      "아버님이 태어나신 곳의 고향은 어떤 곳이었나요?",
      "부모님(할아버지, 할머니)께서는 어떤 분들이셨고, 어떻게 만나셨다고 들으셨나요?",
      "아버님이 태어나셨을 무렵의 시대는 어떤 분위기였나요?",
      "형제 관계는 어떻게 되시나요?",
      "이름은 누가, 어떤 의미로 지어주셨나요?"
    ],
    order_index: 1,
    estimated_duration: 45
  },
  {
    session_number: 2,
    title: '제1장 - 기억의 첫 페이지, 유년 시절',
    description: '어릴 적 추억, 놀이, 가족과의 관계 등 유년 시절의 소중한 기억들을 되돌아보는 세션입니다.',
    questions: [
      "아주 어릴 적, 가장 선명하게 떠오르는 기억은 무엇인가요?",
      "어린 시절 살았던 집과 동네는 어떤 모습으로 기억되시나요?",
      "초등학교 입학 전, 주로 무엇을 하고 놀았나요? 가장 친했던 친구는 누구였나요?",
      "어린 시절의 아버님은 어떤 아이였나요?",
      "부모님께 가장 크게 칭찬받거나 꾸중 들었던 기억이 있으신가요?",
      "그 시절, 가장 큰 영향을 주었던 어른이 계셨나요?"
    ],
    order_index: 2,
    estimated_duration: 50
  },
  {
    session_number: 3,
    title: '제2장 - 꿈과 방황의 시간, 학창 시절',
    description: '중고등학교 시절의 우정, 첫사랑, 진로 고민 등 청소년기의 다양한 경험을 나누는 세션입니다.',
    questions: [
      "중학교/고등학교 시절, 가장 친했던 친구들과는 어떤 이야기를 나누셨나요?",
      "공부는 좋아하셨나요? 특별히 흥미를 느꼈거나 어려워했던 과목이 있었나요?",
      "그 시절, 마음에 품었던 첫사랑이나 짝사랑의 기억이 있으신가요?",
      "부모님께 반항하거나 가장 크게 갈등을 겪었던 사건이 있다면 무엇이었나요?",
      "학창 시절에 처음으로 '어른이 되면 무엇이 되겠다'고 꿈꿨던 장래희망은 무엇이었나요?",
      "졸업식 날, 어떤 마음으로 교문을 나섰는지 기억나시나요?"
    ],
    order_index: 3,
    estimated_duration: 55
  },
  {
    session_number: 4,
    title: '제3장 - 세상으로 나아가다, 군대와 첫 직장',
    description: '군 복무 경험과 사회 진출 초기의 이야기, 첫 직장에서의 경험을 나누는 세션입니다.',
    questions: [
      "군대에 가셨을 때의 기분과 첫날 밤 생각이 기억나시나요?",
      "군 생활 중 가장 힘들었던 일과 가장 즐거웠던 일은 무엇이었나요?",
      "제대 후 첫 직장은 어떻게 구하게 되셨나요?",
      "첫 월급을 받았을 때의 기분과 그 돈으로 무엇을 하셨는지 기억나시나요?",
      "직장 생활을 하면서 처음으로 '아, 이제 나도 어른이구나' 싶었던 순간이 있었나요?",
      "그 시절 꿈꿨던 미래는 어떤 모습이었나요?"
    ],
    order_index: 4,
    estimated_duration: 50
  },
  {
    session_number: 5,
    title: '제4장 - 운명의 만남, 사랑과 결혼',
    description: '배우자와의 만남, 연애, 결혼에 이르는 과정의 아름다운 사랑 이야기를 나누는 세션입니다.',
    questions: [
      "아내(배우자)를 처음 만났을 때의 첫인상은 어떠셨나요?",
      "어떻게 서로 마음을 확인하고 연애를 시작하게 되셨나요?",
      "프로포즈는 어떻게 하셨나요? 그때의 떨림이 아직도 기억나시나요?",
      "결혼식 날의 기억 중 가장 선명하게 남아있는 장면은 무엇인가요?",
      "신혼 초에 있었던 달콤하거나 재미있는 에피소드가 있다면 들려주세요.",
      "결혼 후 '아, 이 사람과 평생을 함께하겠구나' 싶었던 순간이 있었나요?"
    ],
    order_index: 5,
    estimated_duration: 55
  },
  {
    session_number: 6,
    title: '제5장 - 아버지가 되다, 가족의 탄생',
    description: '자녀의 탄생과 양육, 가족과 함께한 소중한 추억들을 되돌아보는 세션입니다.',
    questions: [
      "첫 아이의 임신 소식을 들었을 때 어떤 기분이셨나요?",
      "아이가 태어났을 때, 처음 아이를 품에 안았을 때의 느낌을 기억하시나요?",
      "아이들의 이름은 어떤 마음으로 지어주셨나요?",
      "아이들이 어렸을 때, 함께했던 가장 행복한 순간들은 어떤 것들이었나요?",
      "아버지로서 가장 뿌듯했던 순간과 가장 미안했던 순간은 언제였나요?",
      "가족과 함께한 여행이나 특별한 추억이 있다면 들려주세요."
    ],
    order_index: 6,
    estimated_duration: 60
  },
  {
    session_number: 7,
    title: '제6장 - 인생의 절정, 일과 성취',
    description: '직업적 성공과 성취, 일을 통해 얻은 보람과 지혜를 나누는 세션입니다.',
    questions: [
      "직장 생활이나 사업에서 가장 큰 성취감을 느꼈던 순간은 언제였나요?",
      "일하시면서 만난 사람들 중 특별히 기억에 남는 분이 계신가요?",
      "가장 열정적으로 일했던 시기는 언제였고, 무엇이 그런 열정을 만들었나요?",
      "경제적으로 가장 안정되고 행복했던 시기의 이야기를 들려주세요.",
      "후배들에게 꼭 전하고 싶은 일에 대한 조언이 있다면 무엇인가요?",
      "은퇴를 앞두고 어떤 생각이 드셨나요?"
    ],
    order_index: 7,
    estimated_duration: 50
  },
  {
    session_number: 8,
    title: '제7장 - 폭풍우를 견디다, 시련과 극복',
    description: '인생의 어려움과 시련을 어떻게 극복했는지, 그 과정에서 얻은 교훈을 나누는 세션입니다.',
    questions: [
      "살면서 가장 큰 시련이나 위기는 무엇이었나요?",
      "그 어려움을 어떻게 극복하셨나요? 누가 가장 큰 힘이 되어주었나요?",
      "실패했지만 큰 교훈을 얻었던 경험이 있으신가요?",
      "가족이나 가까운 사람을 잃었던 경험과 그것을 어떻게 받아들이셨는지 들려주세요.",
      "인생에서 가장 큰 터닝포인트가 되었던 사건은 무엇이었나요?",
      "그 시련들이 지금의 아버님을 어떻게 만들었다고 생각하시나요?"
    ],
    order_index: 8,
    estimated_duration: 55
  },
  {
    session_number: 9,
    title: '제8장 - 지혜의 계절, 나이 들어감의 의미',
    description: '나이가 들면서 얻은 지혜와 깨달음, 현재의 삶에 대한 이야기를 나누는 세션입니다.',
    questions: [
      "나이가 들면서 새롭게 깨닫게 된 것들이 있다면 무엇인가요?",
      "젊었을 때와 달라진 가치관이나 생각이 있으신가요?",
      "요즘 가장 행복한 순간은 어떤 때인가요?",
      "건강을 위해 특별히 신경 쓰시는 것이 있나요?",
      "은퇴 후의 삶은 어떠신가요? 새롭게 시작한 일이나 취미가 있으신가요?",
      "지금 이 나이가 되어 느끼는 삶의 의미는 무엇인가요?"
    ],
    order_index: 9,
    estimated_duration: 50
  },
  {
    session_number: 10,
    title: '제9장 - 못다 이룬 꿈, 후회와 화해',
    description: '아쉽게 남은 꿈들과 후회에 대해 이야기하고, 그것들과 화해하는 과정을 나누는 세션입니다.',
    questions: [
      "이루지 못한 꿈이나 아쉬움으로 남은 일이 있다면 무엇인가요?",
      "다시 돌아간다면 꼭 해보고 싶은 일이 있으신가요?",
      "누군가에게 꼭 전하고 싶었지만 못했던 말이 있나요?",
      "용서하고 싶거나 용서받고 싶은 일이 있으신가요?",
      "그 후회들과 어떻게 화해하셨나요?",
      "지금의 관점에서 보면, 그 실패나 후회도 의미가 있었다고 생각하시나요?"
    ],
    order_index: 10,
    estimated_duration: 55
  },
  {
    session_number: 11,
    title: '제10장 - 사랑하는 이들에게 남기는 말',
    description: '가족들에게 전하고 싶은 마음과 메시지를 정리하는 감동적인 세션입니다.',
    questions: [
      "배우자에게, 미처 다 하지 못했던 마음을 담아 편지를 남겨주세요.",
      "자녀들이 어떤 인생을 살아가기를 바라시나요? 각 자녀에게 남기고 싶은 말이 있다면요?",
      "(계시다면) 손주들에게는 어떤 할아버지로 기억되고 싶으신가요?"
    ],
    order_index: 11,
    estimated_duration: 60
  },
  {
    session_number: 12,
    title: '에필로그 - 내 삶이라는 책을 덮으며',
    description: '인생 전체를 돌아보며 자신만의 인생 철학과 메시지를 정리하는 마지막 세션입니다.',
    questions: [
      "아버님의 인생을 한 권의 책이라고 한다면, 어떤 제목을 붙이고 싶으신가요?",
      "인생을 다시 한번 살 수 있다면, 똑같은 삶을 선택하시겠어요?",
      "먼 훗날, 사람들이 아버님을 어떻게 기억해주었으면 좋겠나요?"
    ],
    order_index: 12,
    estimated_duration: 45
  }
];

async function insertSessionsOnly() {
  console.log('🚀 한국어 인터뷰 세션 템플릿 안전 삽입 시작...');
  
  try {
    // 연결 확인
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ 데이터베이스 연결 성공:', result.rows[0].current_time);
    client.release();
    
    // 기존 세션 데이터 확인
    const sessionCount = await pool.query('SELECT count(*) as count FROM sessions');
    console.log(`📊 현재 세션 수: ${sessionCount.rows[0].count}개`);
    
    if (sessionCount.rows[0].count > 0) {
      console.log('🔄 기존 세션 데이터를 삭제하고 새로 삽입합니다...');
      await pool.query('DELETE FROM sessions');
    }
    
    // 각 세션을 개별적으로 안전하게 삽입
    console.log('📝 12개 인터뷰 세션 템플릿 삽입 중...');
    
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      
      try {
        await pool.query(`
          INSERT INTO sessions (session_number, title, description, questions, order_index, estimated_duration) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          session.session_number,
          session.title,
          session.description,
          JSON.stringify(session.questions),
          session.order_index,
          session.estimated_duration
        ]);
        
        console.log(`  ✅ 세션 ${session.session_number}: ${session.title}`);
      } catch (error) {
        console.error(`  ❌ 세션 ${session.session_number} 삽입 실패:`, error.message);
      }
    }
    
    // 최종 확인
    const finalCount = await pool.query('SELECT count(*) as count FROM sessions');
    console.log(`\n📊 최종 세션 수: ${finalCount.rows[0].count}개`);
    
    // 삽입된 세션 미리보기
    const preview = await pool.query(`
      SELECT session_number, title, json_array_length(questions) as question_count
      FROM sessions 
      ORDER BY session_number 
      LIMIT 5
    `);
    
    console.log('\n📋 삽입된 세션 미리보기:');
    preview.rows.forEach(row => {
      console.log(`  ${row.session_number}. ${row.title} (${row.question_count}개 질문)`);
    });
    
    console.log('\n🎉 한국어 인터뷰 세션 템플릿 삽입 완료!');
    
  } catch (error) {
    console.error('\n❌ 세션 삽입 실패:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await pool.end();
  }
}

// 실행
insertSessionsOnly();