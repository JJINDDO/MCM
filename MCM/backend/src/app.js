import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// 1. 환경 변수 설정
dotenv.config();

// 2. express 앱 생성 (이 줄이 app.post보다 반드시 위에 있어야 합니다!)
const app = express();

// 3. 미들웨어 설정
app.use(cors());
app.use(express.json());

// 4. Gemini 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // 모델명 확인 (2.5-flash-lite는 존재하지 않는 모델일 수 있습니다)
  generationConfig: { responseMimeType: "application/json" }
});

// 2. 메인 AI 스토리 생성 라우트
app.post('/api/story', async (req, res) => {
  const { time, myAction } = req.body;

  // 행동 예외 처리 (계획이 시원하게 망한 상황으로 설정)
  const userActionDescription = myAction 
    ? `내가 "${myAction}"(을)를 야심 차게 계획했는데, 완벽하게 망해버린 상황.` 
    : `이 시간대에 내가 할 법한 흔한 계획을 네가 상상하고, 그게 아주 어이없게 실패한 상황.`;

  // AI에게 내릴 프롬프트
  const prompt = `
    너는 지금부터 B급 코미디 시트콤 작가야. 
    아래 정보를 바탕으로 주인공(나)의 계획이 실패했을 때 벌어지는 '대환장 미래' 시나리오를 하나 써줘.

    [배경 정보]
    - 현재 시간대: ${time}
    - 상황: ${userActionDescription}
    
    [미션]
    1. 이 계획이 꼬여버린 현장에 '최소 1명에서 최대 4명'의 구체적인 조연(extras)들을 난입시켜줘.
    2. 각 조연은 반드시 고유한 'name'과 'action'을 가져야 해.
    3. 'fullStory'는 이 모든 조연들이 한꺼번에 얽혀서 내 계획을 어떻게 박살 냈는지 묘사한 '단 하나의 통합된 문장'이어야 해.
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
    
    // 최종 응답: 시간대 하나당 하나의 storyData(fullStory + 여러 명의 extras)
    res.status(200).json({
      message: "AI 스토리 생성 완료!",
      data: {
        time: time,
        fullStory: storyData.fullStory,
        extras: storyData.extras // 1~4명의 조연 리스트
      }
    });

  } catch (error) {
    console.error("AI 생성 중 에러 발생:", error);
    res.status(500).json({ error: "스토리 생성 중 문제가 발생했습니다." });
  }
});