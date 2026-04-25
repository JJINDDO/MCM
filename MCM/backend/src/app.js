import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk'; // 👈 Groq 추가
import dotenv from 'dotenv';

// ✅ 수정 1: Vercel 환경이 아닐 때(로컬일 때)만 안전하게 .env를 읽어오기
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
let totalApiRequests = 0;

app.use((req, res, next) => {
  if (req.path === '/app/story' && req.method === 'POST') {
    totalApiRequests++;
    console.log(`[API 호출 알림] 누적 호출: ${totalApiRequests}회`);
  }
  next();
});

app.get('/app/count', (req, res) => {
  res.json({ totalCalls: totalApiRequests });
});

// CORS 설정 (프론트엔드 주소 완벽합니다)
const allowedOrigins = [
  'https://mcm-p7cv678og-perjungs-projects.vercel.app',
  'https://mcm-git-main-jjinddos-projects.vercel.app', 
  'http://localhost:3000', 'http://localhost:8081', 'http://localhost:8080'
];
app.use(cors({ origin: (o, cb) => !o || allowedOrigins.includes(o) ? cb(null, true) : cb(new Error('CORS')), credentials: true }));
app.use(express.json());

// --- AI 설정 ---
// ✅ 수정 2: API 키가 없어도 서버가 터지지 않게 안전장치(|| "") 추가
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ✅ 수정 3: 세상에 존재하는 올바른 모델명으로 변경
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite", 
  generationConfig: { responseMimeType: "application/json" }
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
// ----------------

app.post('/app/story', async (req, res) => {
  const { schedules } = req.body;

  // 만약 일정이 비어있거나 배열이 아니면 에러 반환
  if (!schedules || !Array.isArray(schedules)) {
    return res.status(400).json({ error: "일정 데이터가 올바르지 않습니다." });
  }

  // 🔥 프롬프트 수정 완료: schedules 배열을 순회하며 리스트 형태로 만들어줍니다.
  const prompt = `
    너는 지금부터 B급 코미디 시트콤 작가야. 
    아래 제공된 [일정 리스트]를 바탕으로 주인공(나)의 계획들이 연쇄적으로 실패했을 때 벌어지는 '대환장 미래' 시나리오를 써줘.

    [일정 리스트]
    ${schedules.map(s => `- 시간대: ${s.time}, 그 시간대에 실행할 계획: ${s.myAction || '평범한 일상'}`).join('\n')}
    
    [미션]
    1. 각 시간대별 일정마다 계획이 꼬여버린 현장에 '최소 1명에서 최대 4명'의 구체적인 조연(extras)들을 난입시켜줘.
    2. 각 조연은 반드시 고유한 'name'과 'action'을 가져야 해.
    3. 'fullStory'는 이 모든 조연들이 그 시간대에 얽혀서 내 계획을 어떻게 박살 냈는지 묘사한 내용이야. 각 시간대의 fullStory들이 전체적으로 자연스럽게 이어져야 해. 
       단, 인과관계가 있는 문장들로 구성되어야 하고, 문장들 사이에 마침표, 느낌표로 딱 끊어서 생동감 있게 출력해줘!
    4. 'action'에 들어갈 문장의 끝맺음은 항상 '~하기'로 끝내야 해.

    결과는 반드시 아래의 JSON 형식으로만 응답해:
    {
      "results": [
        {
          "time": "요청받은 시간대",
          "fullStory": "모든 조연이 얽혀 이 시간대의 계획이 처참하게(하지만 웃기게) 망한 상황을 묘사한 통합된 문장",
          "extras": [
            {
              "name": "조연 1의 정체",
              "action": "조연 1이 내 계획을 방해하며 벌인 행동 (~하기)"
            },
            {
              "name": "조연 2의 정체",
              "action": "조연 2가 상황을 더 악화시킨 행동 (~하기)"
            }
          ]
        }
      ]
    }
  `;

  let storyData;

  try {
    console.log("🚀 [1순위] Gemini 시도...");
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    storyData = JSON.parse(response.text().replace(/```json/g, '').replace(/```/g, ''));
    console.log("✅ Gemini 성공");

  } catch (err) {
    console.error("⚠️ Gemini 실패, Groq로 전환합니다.");
    
    try {
      // 🔥 [무료 구원투수] Groq (Llama-3.3-70b 모델 사용)
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a comedy writer. Respond ONLY in JSON format." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile", // 성능 좋은 최신 70B 모델 적용 완료
        response_format: { type: "json_object" } 
      });

      storyData = JSON.parse(chatCompletion.choices[0].message.content);
      console.log("✅ Groq(Llama3) 대체 성공!");

    } catch (groqErr) {
      console.error("❌ 모든 AI 실패:", groqErr.message);
      return res.status(500).json({ error: "모든 AI가 지쳤습니다." });
    }
  }

  res.status(200).json({ data: storyData.results });
});

if (!process.env.VERCEL) {
  app.listen(8080, () => console.log(`🚀 Server on 8080`));
}
export default app;