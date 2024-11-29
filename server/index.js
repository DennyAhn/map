require("dotenv").config(); // .env 파일 로드
const express = require("express");
const cors = require("cors");
const geocodeRouter = require("./router/geocodeRouter");
const directionRouter = require("./router/directionRouter");

const app = express();
const PORT = 3001;
app.use(express.json());

// CORS 설정
app.use(
  cors({
    origin: "http://localhost:3000", // React 앱에서 오는 요청을 허용
  })
);

// 기본 경로 처리
app.get("/", (req, res) => {
  res.send("Express 서버가 실행 중입니다!");
});

// 라우터 연결
app.use("/geocode", geocodeRouter);
app.use("/direction", directionRouter);

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
