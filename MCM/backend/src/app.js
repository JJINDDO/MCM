import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈 방식에서 __dirname을 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 환경 변수 설정 (경로를 정확히 지정)
dotenv.config({ path: path.join(__dirname, '../.env') });

// 2. express 앱 생성
const app = express();

// 3. 미들웨어 설정 (★ 수정됨: 로컬과 Vercel 모두 허용)
const allowedOrigins = [
  'https://mcm-git-main-jjinddos-projects.vercel.app', // Vercel 배포 주소
  'http://localhost:3000', // React 기본 포트
  'http://localhost:8081', // Expo(React Native) 기본 포트
  'http://localhost:8080'  // 백엔드 자체 포트 (테스트용)
];

app.use(cors({
  origin: function (origin, callback) {
    // origin이 없거나(서버 간 요청 등), 허용된 목록에 있으면 통과
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// 4. Gemini 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: { responseMimeType: "application/json" }
});

// 키가 잘 읽혔는지 확인용 로그
console.log("API 키 로드 여부:", process.env.GEMINI_API_KEY ? "성공" : "실패(undefined)");

// 5. 메인 AI 스토리 생성 라우트
app.post('/app/story', async (req, res) => {
  const { time, myAction } = req.body;

  // 행동 예외 처리
  const userActionDescription = myAction
    ? `내가 "${myAction}"(을)를 야심 차게 계획했는데, 얼탱이없게 꼬여버린 상황.`
    : `이 시간대에 내가 할 법한 흔한 계획을 네가 상상하고, 그게 아주 어이없게 실패한 상황.`;

  // AI 프롬프트
  const prompt = `
    너는 지금부터 B급 코미디 시트콤 작가야. 
    아래 정보를 바탕으로 주인공(나)의 계획이 실패했을 때 벌어지는 '대환장 미래' 시나리오를 하나 써줘.

    [배경 정보]
    - 시간대: ${time}
    - 그 시간대에 실행할 계획 : ${userActionDescription}
    
    [미션]
    1. 이 계획이 꼬여버린 현장에 '최소 1명에서 최대 4명'의 구체적인 조연(extras)들을 난입시켜줘.
    2. 각 조연은 반드시 고유한 'name'과 'action'을 가져야 해.
    3. 'fullStory'는 이 모든 조연들이 그 시간대에 얽혀서 내 계획을 어떻게 박살 냈는지 묘사한, 자연스럽게 이어져야 해.
      단, 인과관계가 있는 문장들로 구성되어야 하고, 문장들 사이에 마침표, 느낌표로 딱 끊어서 출력해줘. 생동감있게 출력해줘!
    4. 'action'에 들어갈 문장의 끝맺음은 항상 '~하기'로 끝내야 해.

    결과는 반드시 아래의 JSON 형식으로만 응답해:
    {
      "fullStory": "모든 조연이 얽혀 내 계획이 처참하게(하지만 웃기게) 망한 상황을 묘사한 통합된 한 문장",
      "extras": [
        {
          "name": "조연 1의 정체",
          "action": "조연 1이 내 계획을 방해하며 벌인 행동"
        },
        {
          "name": "조연 2의 정체",
          "action": "조연 2가 상황을 더 악화시킨 행동"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("RAW TEXT:", text);

    let storyData;
    try {
      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      storyData = JSON.parse(cleanText);
    } catch (e) {
      console.error("❌ JSON 파싱 실패:", text);
      throw e;
    }

    res.status(200).json({
      message: "AI 스토리 생성 완료!",
      data: {
        time: time,
        fullStory: storyData.fullStory,
        extras: storyData.extras
      }
    });

  } catch (error) {
    console.error("AI 생성 중 에러 발생:", error);
    res.status(500).json({ error: "스토리 생성 중 문제가 발생했습니다." });
  }
});

// 6. 서버 실행 조건 (★ 수정됨: Vercel과 로컬 완벽 분리)
// Vercel은 실행 환경에 process.env.VERCEL 변수를 1로 주입합니다.
// 즉, Vercel이 아닐 때(로컬 컴퓨터일 때)만 포트를 열고 서버를 켭니다.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 대기 중입니다!`);
  });
}

// Vercel이 서버리스 함수로 사용할 수 있도록 app을 내보냄
export default app;