# 🎬 GDG_MCM: Main Character Maker
**"내 인생이 B급 시트콤이라면?" — 엉뚱한 상상을 현실로 만드는 망상 플래너**

사용자가 계획한 일정이 예상치 못한 방향으로 꼬였을 때, 어떤 조연(엑스트라)이 난입하여 어떤 대환장 파티를 벌일지 AI가 시트콤 시나리오를 써주는 이색 플래너 서비스입니다.

<br>

## 👥 팀원 구성
- **Frontend** : 플솝 25 김유정
- **Backend** : 플솝 25 진도현
- **AI 작가** : Google Gemini 2.5 Flash

<br>

## ✨ 주요 기능

📅 **망상 타임테이블 (Mangsang Timetable)**
- 드래그 앤 드롭 방식으로 직관적인 일정 생성
- 시간대별 고유 컬러 지정 및 중복 방지 로직 적용

🤖 **AI 엑스트라 플랜 생성 (Extra Plan)**
- 내 계획이 시원하게 망했을 때의 미래를 AI가 시뮬레이션
- **조연 난입**: 최소 1명에서 최대 4명의 개성 넘치는 조연(비둘기, 배달원 등) 등장
- **대환장 시나리오**: 조연들과 얽히고설킨 'fullStory' 제공

🎬 **조연 상세 보기**
- 각 시간대별 조연의 이름과 엉뚱한 행동(Action) 확인
- 팝업을 통해 해당 상황이 나에게 가져다줄 어이없는 이점(Benefit) 열람

<br>

## 🛠 기술 스택 (Tech Stack)
- **Frontend** : React Native (Expo)
- **Backend** : Node.js, Express
- **AI** : Google Generative AI (Gemini-2.5-Flash-Lite)
- **Storage** : AsyncStorage (로컬 데이터 저장)
- **Collaboration** : GitHub, Git

<br>

## 📡 API 명세 (API Specification)

### **POST** `/api/story`
사용자의 계획을 바탕으로 시트콤 시나리오를 생성합니다.

- **Request Body**
  ```json
  {
    "time": "14:00 ~ 15:00",
    "myAction": "카페에서 카공하기"
  }
  ```
- **Response Body**
  ```json
  {
    "message": "AI 스토리 생성 완료!",
    "data": {
      "extras": [
        { "name": "3년 차 비둘기", "action": "창밖에서 내 인강 속도를 비웃듯 구구거림" }
      ],
      "fullStory": "집중하려던 찰나 비둘기와의 기싸움에서 패배해 책을 덮게 된 대환장 시나리오."
    }
  }
  ```

<br>

## 🚀 실행 방법

### **Backend**
```bash
cd ./backend
npm install
# .env 파일에 GEMINI_API_KEY 설정 필수!
npm run dev
```

### **Frontend**
```bash
cd ./frontend
npm install
npm start
```

<br>

## 💡 프로젝트의 핵심 철학
> "계획은 망하라고 있는 것이다. 하지만 망해도 시트콤처럼 웃기게 망하자!"

---

****
