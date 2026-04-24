import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// .env 파일에서 GEMINI_API_KEY를 불러오기 위한 설정
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Gemini AI 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  // 💡 중요: AI가 헛소리 안 하고 딱 JSON 형식으로만 대답하게 강제하는 옵션
  generationConfig: { responseMimeType: "application/json" }
});

// 필수 설정
app.use(cors());
app.use(express.json()); // Body로 들어오는 JSON 데이터를 읽기 위해 꼭 필요함!

// 1. 기본 라우트 (GET 테스트용 - 브라우저 주소창에서 확인 가능)
app.get('/', (req, res) => {
  res.send('스토리 생성 백엔드 서버가 쌩쌩하게 돌아가는 중! 🚀');
});

// 2. 메인 AI 스토리 생성 라우트 (POST 테스트용 - Thunder Client로 확인)
app.post('/api/story', async (req, res) => {
  const { time, myAction } = req.body;

  // 행동을 입력 안 했을 경우의 예외 처리
  const userActionDescription = myAction
    ? `내가 "${myAction}" 행동을 하고 있을 때`
    : "내가 그 시간대에 할 법한 행동을 네가 알아서 상상해서";

  // AI에게 내릴 프롬프트(명령)
  const prompt = `
    사용자의 시간대: ${time}
    상황: ${userActionDescription}
    
    위 정보를 바탕으로 아주 짧은 스토리를 생성해줘.
    결과는 반드시 아래의 JSON 형식으로만 응답해:
    {
      "name": "주변에 있을 법한 조연의 이름 혹은 직업",
      "action": "조연이 하고 있는 구체적인 행동",
      "benefit": "조연의 행동으로 인해 내가 얻는 이점 혹은 미래",
      "fullStory": "전체 상황을 묘사한 자연스러운 한 문장의 스토리"
    }
  `;

  try {
    // 구글 Gemini에게 생성 요청
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

      // AI가 준 글자를 자바스크립트가 읽을 수 있는 진짜 JSON으로 변환
      storyData = JSON.parse(cleanText);
    } catch (e) {
      console.error("❌ JSON 파싱 실패:", text);
      throw e;
    }
    // 성공했을 때 돌려줄 결과
    res.status(200).json({
      message: "AI 스토리 생성 완료!",
      data: {
        time: time,
        ...storyData
      }
    });

  } catch (error) {
    console.error("AI 생성 중 에러 발생:", error);
    res.status(500).json({ error: "스토리 생성 중 문제가 발생했습니다." });
  }
});

// 서버 켜기
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});