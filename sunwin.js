import fastify from "fastify";
import cors from "@fastify/cors";
import WebSocket from "ws";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/* ================== CONFIG ================== */
const PORT = 3000;
const WS_URL = "wss://websocket.azhkthg1.net/websocket?token=";
const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiJ0dWFuZGVwemFpMjUwMiIsImJvdCI6MCwiaXNNZXJjaGFudCI6ZmFsc2UsInZlcmlmaWVkQmFua0FjY291bnQiOnRydWUsInBsYXlFdmVudExvYmJ5IjpmYWxzZSwiY3VzdG9tZXJJZCI6MTYzNDEyMjAwLCJhZmZJZCI6IlN1bndpbiIsImJhbm5lZCI6ZmFsc2UsImJyYW5kIjoic3VuLndpbiIsInRpbWVzdGFtcCI6MTc2NzQ0MjI0NDQ3NSwibG9ja0dhbWVzIjpbXSwiYW1vdW50IjowLCJsb2NrQ2hhdCI6ZmFsc2UsInBob25lVmVyaWZpZWQiOnRydWUsImlwQWRkcmVzcyI6IjE4My44MC4zOS43OCIsIm11dGUiOmZhbHNlLCJhdmF0YXIiOiJodHRwczovL2ltYWdlcy5zd2luc2hvcC5uZXQvaW1hZ2VzL2F2YXRhci9hdmF0YXJfMTAucG5nIiwicGxhdGZvcm1JZCI6NSwidXNlcklkIjoiYWI4Zjk0YzQtMjYxNi00Mjc1LTljMjMtNWEyMWQwNWFmYTg5IiwicmVnVGltZSI6MTcxNzk0NDQ3NDA2NCwicGhvbmUiOiI4NDM4NDczMzA0MyIsImRlcG9zaXQiOnRydWUsInVzZXJuYW1lIjoiU0Nfbm10MjUwMiJ9.AYZyEts9lRI4DoKGYjp1T81Z8hhaxyHm2q2HuEmPB_c";

/* ================== GLOBAL ================== */
let rikResults = [];
let rikWS = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================== PATTERN DB ================== */
const PATTERN_DATABASE = {
  "1-1": ["tx", "xt"],
  "bệt": ["tt", "xx"],
  "2-2": ["ttxx", "xxtt"],
  "3-3": ["tttxxx", "xxxttt"],
  "zigzag": ["txt", "xtx"],
  "alternate": ["txtx", "xtxt"]
};

/* ================== UTIL ================== */
function calculatePatternNoise(tx) {
  if (tx.length < 10) return 0.5;
  let changes = 0;
  for (let i = 1; i < tx.length; i++) {
    if (tx[i] !== tx[i - 1]) changes++;
  }
  return changes / (tx.length - 1);
}

/* ================== MATH ================== */
function calculateEMA(arr, period) {
  if (arr.length < period) return arr[arr.length - 1];
  const k = 2 / (period + 1);
  let ema = arr[0];
  for (let i = 1; i < arr.length; i++) {
    ema = arr[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateMACD(totals) {
  if (totals.length < 26) return 0;
  return calculateEMA(totals, 12) - calculateEMA(totals, 26);
}

/* ================== AI CORE ================== */
class AdvancedDeepLearningAI {
  constructor() {
    this.history = [];
  }

  addResult(r) {
    this.history.push({
      session: r.session,
      dice: r.dice,
      total: r.total,
      result: r.result,
      tx: r.total >= 11 ? "T" : "X"
    });
    if (this.history.length > 400) this.history.shift();
  }

  predict() {
    if (this.history.length < 20) {
      return {
        prediction: "tài",
        confidence: 0.5,
        explain: { votes: { T: 0, X: 0 }, noise: "0.50", macd: "0.00" }
      };
    }

    const tx = this.history.map(h => h.tx);
    const totals = this.history.map(h => h.total);

    let votes = { T: 0, X: 0 };

    /* ===== Pattern đơn giản ===== */
    const last3 = tx.slice(-3).join("");
    if (last3 === "TTT") votes.T += 1;
    if (last3 === "XXX") votes.X += 1;

    /* ===== Trend ===== */
    const last10 = tx.slice(-10);
    const tCount = last10.filter(i => i === "T").length;
    const xCount = 10 - tCount;
    if (tCount >= 7) votes.T += 1;
    if (xCount >= 7) votes.X += 1;

    /* ===== MACD ===== */
    const macd = calculateMACD(totals);
    if (macd > 0.4) votes.T += 1;
    if (macd < -0.4) votes.X += 1;

    /* ===== Pattern DB (vote nhẹ) ===== */
    const recent = tx.slice(-6).join("").toLowerCase();
    Object.values(PATTERN_DATABASE).forEach(list => {
      list.forEach(p => {
        if (recent.endsWith(p)) {
          votes[p.includes("t") ? "T" : "X"] += 0.5;
        }
      });
    });

    const totalVotes = votes.T + votes.X;
    let confidence =
      totalVotes === 0 ? 0.5 : Math.max(votes.T, votes.X) / totalVotes;

    const noise = calculatePatternNoise(tx.slice(-15));
    confidence *= 1 - noise * 0.4;
    confidence = Math.min(0.95, Math.max(0.5, confidence));

    const prediction = votes.T >= votes.X ? "tài" : "xỉu";

    return {
      prediction,
      confidence,
      explain: {
        votes,
        noise: noise.toFixed(2),
        macd: macd.toFixed(2)
      }
    };
  }

  getPattern() {
    const tx = this.history.map(h => h.tx).join("").toLowerCase();
    let dominant = "không rõ";
    let max = 0;

    Object.entries(PATTERN_DATABASE).forEach(([name, list]) => {
      list.forEach(p => {
        const count = tx.split(p).length - 1;
        if (count > max) {
          max = count;
          dominant = name;
        }
      });
    });

    return {
      recent: tx.slice(-20),
      long: tx.slice(-50),
      dominant
    };
  }
}

const ai = new AdvancedDeepLearningAI();

/* ================== API ================== */
const app = fastify({ logger: false });
await app.register(cors, { origin: "*" });

app.get("/api/taixiu/sunwin", async () => {
  const valid = rikResults
    .filter(r => Array.isArray(r.dice) && r.dice.length === 3)
    .sort((a, b) => b.session - a.session);

  const last = valid[0];
  if (!last) return { status: "đang chờ dữ liệu..." };

  const predict = ai.predict();
  const pattern = ai.getPattern();

  return {
    phien_truoc: last.session,
    xuc_xac: last.dice,
    tong: last.total,
    ket_qua: last.result.toLowerCase(),
    phien_hien_tai: last.session + 1,
    du_doan: predict.prediction,
    do_tin_cay_ai: (predict.confidence * 100).toFixed(1) + "%",
    pattern_gan_nhat: pattern.recent,
    pattern_dai: pattern.long,
    pattern_chu_dao: pattern.dominant,
    ai_explain: predict.explain
  };
});

/* ================== WS ================== */
function connectRikWebSocket() {
  rikWS = new WebSocket(WS_URL + TOKEN);

  rikWS.on("message", data => {
    try {
      const json = JSON.parse(data);
      if (json.session && Array.isArray(json.dice)) {
        if (!rikResults.find(r => r.session === json.session)) {
          rikResults.unshift(json);
          ai.addResult(json);
        }
      }
    } catch {}
  });

  rikWS.on("close", () => setTimeout(connectRikWebSocket, 3000));
}

/* ================== START ================== */
app.listen({ port: PORT, host: "0.0.0.0" }, () => {
  console.log("🚀 Sunwin AI v10.0 FULL FIX running");
  connectRikWebSocket();
});
