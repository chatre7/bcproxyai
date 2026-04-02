# BCProxyAI — Smart AI Gateway

ระบบ Gateway อัจฉริยะ สำหรับเลือกโมเดล AI ฟรีที่ดีที่สุดให้อัตโนมัติ  
ออกแบบมาสำหรับใช้งานร่วมกับ **OpenClaw** และ **HiClaw**

---

## คำเตือนด้านความปลอดภัย

> **ระบบนี้ไม่มีการยืนยันตัวตน (API Key) ในการเรียกใช้ Gateway**  
> ห้ามเปิดให้เข้าถึงจากภายนอก (Internet) โดยเด็ดขาด  
>  
> **แนะนำให้ติดตั้งบน Local หรือ Network ภายในองค์กรเท่านั้น**  
> หากต้องการเปิดให้ภายนอกใช้งาน ให้นำ Code ไปแก้ไขเพิ่มระบบ Authentication ก่อน

---

## สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [ความสามารถหลัก](#ความสามารถหลัก)
- [ติดตั้งด้วย Docker (แนะนำ)](#ติดตั้งด้วย-docker-แนะนำ)
- [ติดตั้งแบบ Manual](#ติดตั้งแบบ-manual)
- [ตั้งค่า API Keys](#ตั้งค่า-api-keys)
- [เชื่อมต่อกับ OpenClaw / HiClaw](#เชื่อมต่อกับ-openclaw--hiclaw)
- [Virtual Models (โมเดลพิเศษ)](#virtual-models-โมเดลพิเศษ)
- [API Endpoints](#api-endpoints)
- [Dashboard](#dashboard)
- [Worker อัตโนมัติ](#worker-อัตโนมัติ)
- [MCP Server](#mcp-server)
- [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

---

## ภาพรวมระบบ

```
OpenClaw / HiClaw
        │
        ▼
┌─────────────────────────────┐
│     BCProxyAI Gateway       │  ← http://localhost:3333/v1
│  /v1/chat/completions       │
│  /v1/models                 │
│                             │
│  ┌─────────────────────┐    │
│  │  Smart Router        │   │  ← เลือก model อัตโนมัติ
│  │  - Auto-detect tools │   │
│  │  - Auto-detect vision│   │
│  │  - Fallback on error │   │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  Background Worker   │   │  ← ทำงานทุก 1 ชม.
│  │  1. Scan models      │   │
│  │  2. Health check     │   │
│  │  3. Benchmark        │   │
│  └─────────────────────┘    │
│                             │
│  SQLite DB + Dashboard      │
└─────────────────────────────┘
        │
        ▼
┌───────────┬───────────┬───────────┬───────────┐
│ OpenRouter│  Kilo AI  │  Google   │   Groq    │
│  (free)   │  (free)   │ AI Studio │  (free)   │
└───────────┴───────────┴───────────┴───────────┘
```

---

## ความสามารถหลัก

| ความสามารถ | รายละเอียด |
|-----------|-----------|
| **สแกนอัตโนมัติ** | ค้นหาโมเดล AI ฟรีจาก 4 ผู้ให้บริการ ทุก 1 ชม. |
| **Health Check** | ตรวจสอบว่าโมเดลไหนยังใช้ได้ พักโมเดลที่ติด rate limit 2 ชม. |
| **Benchmark ภาษาไทย** | สอบ 3 คำถามภาษาไทย ให้คะแนน 0-10 คัดเฉพาะตัวที่ผ่าน |
| **Smart Routing** | เลือกโมเดลที่เหมาะกับงาน (tools/vision/thai/fast) |
| **Auto-Fallback** | ถ้าโมเดลแรก error จะสลับไปตัวอื่นอัตโนมัติ (สูงสุด 3 ครั้ง) |
| **Tool Detection** | ตรวจจับอัตโนมัติว่าโมเดลไหนรองรับ tool calling |
| **Vision Detection** | ตรวจจับอัตโนมัติว่าโมเดลไหนรองรับการวิเคราะห์ภาพ |
| **Log Rotation** | ลบ log เก่าเกิน 30 วัน อัตโนมัติ |
| **OpenAI Compatible** | ใช้งานเหมือน OpenAI API ทุกประการ |

---

## ติดตั้งด้วย Docker (แนะนำ)

### ขั้นตอนที่ 1: Clone โปรเจค

```bash
git clone <repository-url> bcproxyai
cd bcproxyai
```

### ขั้นตอนที่ 2: สร้างไฟล์ .env.local

```bash
cp .env.example .env.local
```

แก้ไข `.env.local` ใส่ API Key (ดูหัวข้อ [ตั้งค่า API Keys](#ตั้งค่า-api-keys))

### ขั้นตอนที่ 3: Build และ Start

```bash
docker compose build
docker compose up -d
```

### ขั้นตอนที่ 4: เปิด Dashboard

เปิดเบราว์เซอร์ไปที่ **http://localhost:3333**

Worker จะเริ่มสแกนโมเดลอัตโนมัติทันที หรือกดปุ่ม **"รันตอนนี้"** บน Dashboard

---

## ติดตั้งแบบ Manual

ต้องการ **Node.js 20+**

```bash
# ติดตั้ง dependencies
npm ci

# สร้างไฟล์ .env.local (ดูหัวข้อตั้งค่า API Keys)

# Build
npm run build

# Start
npm start
```

เข้าใช้งานที่ **http://localhost:3000**

---

## ตั้งค่า API Keys

สร้างไฟล์ `.env.local` ที่ root ของโปรเจค:

```env
# จำเป็น — ใช้สแกนและ proxy โมเดลฟรี
OPENROUTER_API_KEY=sk-or-v1-xxxx

# จำเป็น — ใช้สแกนและ proxy โมเดลฟรี
GROQ_API_KEY=gsk_xxxx

# ไม่บังคับ — ถ้าไม่ใส่ จะข้ามการสแกน Kilo
KILO_API_KEY=

# ไม่บังคับ — ถ้าไม่ใส่ จะข้ามการสแกน Google AI Studio
GOOGLE_AI_API_KEY=
```

### วิธีสมัคร API Key (ฟรี)

| ผู้ให้บริการ | ลิงก์สมัคร | หมายเหตุ |
|-------------|-----------|----------|
| **OpenRouter** | https://openrouter.ai/keys | สมัครฟรี มีโมเดลฟรีมากที่สุด |
| **Groq** | https://console.groq.com/keys | สมัครฟรี เร็วมาก |
| **Kilo AI** | https://kilo.ai | ไม่ต้องใช้ key ก็สแกนได้ |
| **Google AI Studio** | https://aistudio.google.com/apikey | สมัครฟรี |

---

## เชื่อมต่อกับ OpenClaw / HiClaw

### OpenClaw

เปิด Settings ของ OpenClaw แล้วตั้งค่า:

```json
{
  "apiProvider": "openai-compatible",
  "openAiBaseUrl": "http://localhost:3333/v1",
  "openAiModelId": "auto"
}
```

- `auto` = ให้ BCProxyAI เลือกโมเดลที่ดีที่สุดให้
- สามารถเปลี่ยนเป็น `bcproxy/fast`, `bcproxy/tools`, `bcproxy/thai` ได้
- หรือระบุชื่อโมเดลตรงๆ เช่น `groq/qwen/qwen3-32b`

### HiClaw

ตั้งค่าแบบเดียวกัน — ชี้ Base URL ไปที่ `http://localhost:3333/v1`

---

## Virtual Models (โมเดลพิเศษ)

BCProxyAI มีโมเดลพิเศษ 4 ตัวที่เลือกให้อัตโนมัติ:

| Model ID | พฤติกรรม |
|----------|---------|
| `auto` หรือ `bcproxy/auto` | เลือกโมเดลที่คะแนน benchmark สูงสุด |
| `bcproxy/fast` | เลือกโมเดลที่ตอบเร็วที่สุด (latency ต่ำสุด) |
| `bcproxy/tools` | เลือกโมเดลที่รองรับ tool calling |
| `bcproxy/thai` | เลือกโมเดลที่เก่งภาษาไทย (คะแนน benchmark สูงสุด) |

### การตรวจจับอัตโนมัติ

แม้จะใช้ `auto` แต่ถ้า request มีลักษณะพิเศษ ระบบจะตรวจจับและเลือกให้เหมาะ:

- มี `tools` ใน request → เลือกเฉพาะโมเดลที่รองรับ tool calling
- มี `image_url` ใน messages → เลือกเฉพาะโมเดลที่รองรับ vision
- มี `response_format: json_schema` → เลือกโมเดลขนาดใหญ่ที่จัดการ JSON ได้ดี

### การใช้โมเดลตรง

ระบุ provider + model ID ตรงๆ ได้เลย:

```
groq/llama-3.3-70b-versatile
openrouter/qwen/qwen3-coder:free
kilo/nvidia/nemotron-3-super-120b-a12b:free
```

---

## API Endpoints

### Gateway (OpenAI Compatible)

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/v1/chat/completions` | ส่งข้อความแชท (รองรับ stream) |
| GET | `/v1/models` | รายชื่อโมเดลทั้งหมด + สถานะ |

**ตัวอย่างการเรียกใช้:**

```bash
curl -X POST http://localhost:3333/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "สวัสดีครับ"}],
    "stream": false
  }'
```

**ตัวอย่าง Stream:**

```bash
curl -X POST http://localhost:3333/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "สวัสดีครับ"}],
    "stream": true
  }'
```

**Response Headers พิเศษ:**

| Header | คำอธิบาย |
|--------|---------|
| `X-BCProxy-Model` | โมเดลที่ถูกเลือกใช้จริง |
| `X-BCProxy-Provider` | ผู้ให้บริการ (openrouter/kilo/groq) |

### Dashboard API

| Method | Path | คำอธิบาย |
|--------|------|---------|
| GET | `/api/status` | สถานะ worker + สถิติ + โมเดลใหม่/หายไป |
| GET | `/api/models` | โมเดลทั้งหมด + health + benchmark |
| GET | `/api/leaderboard` | อันดับโมเดลตามคะแนน |
| GET | `/api/worker` | สถานะ worker |
| POST | `/api/worker` | สั่ง worker รันทันที |
| POST | `/api/chat` | Chat API สำหรับ Dashboard |

---

## Dashboard

เปิด **http://localhost:3333** เพื่อดู Dashboard

### หน้าจอหลัก

| ส่วน | คำอธิบาย |
|------|---------|
| **Worker Status** | สถานะ worker + นับถอยหลังครั้งถัดไป |
| **Gateway Config** | Config สำหรับ copy ไปใช้กับ OpenClaw |
| **สถิติ** | จำนวนโมเดลทั้งหมด / พร้อมใช้ / พักผ่อน / มีคะแนน |
| **การเปลี่ยนแปลง** | โมเดลใหม่ (24 ชม.) / หายชั่วคราว / หายถาวร |
| **อันดับโมเดล** | ตาราง ranking ตามคะแนน benchmark |
| **โมเดลทั้งหมด** | Grid แสดงทุกโมเดล + สถานะ + cooldown |
| **ทดลองแชท** | ทดสอบแชทกับโมเดลที่เลือกได้ |
| **บันทึกการทำงาน** | Log การทำงานของ worker |

Dashboard รีเฟรชอัตโนมัติทุก 15 วินาที

---

## Worker อัตโนมัติ

Worker ทำงาน 3 ขั้นตอน ทุก 1 ชั่วโมง:

### ขั้นตอนที่ 1: สแกนโมเดล (Scan)

- ดึงรายชื่อโมเดลฟรีจาก 4 ผู้ให้บริการพร้อมกัน
- บันทึกโมเดลใหม่ อัพเดตโมเดลเดิม
- ตรวจจับโมเดลที่หายไป (หายชั่วคราว 2-48 ชม. / หายถาวร > 48 ชม.)

### ขั้นตอนที่ 2: Health Check

- ส่ง ping ไปทดสอบโมเดลที่ context >= 32K (ข้ามโมเดลเล็ก/ไม่ใช่ chat)
- โมเดลที่ติด rate limit หรือ error → พัก cooldown 2 ชม.
- ทดสอบ tool calling support (สูงสุด 3 ตัว/รอบ)
- ทดสอบ vision support (สูงสุด 3 ตัว/รอบ)

### ขั้นตอนที่ 3: Benchmark

- สอบ 3 คำถามภาษาไทย:
  1. "สวัสดีครับ วันนี้อากาศเป็นยังไงบ้าง?"
  2. "แนะนำอาหารไทยมา 3 เมนู"
  3. "กรุงเทพมหานครอยู่ประเทศอะไร?"
- ให้คะแนน 0-10 โดยโมเดล AI อีกตัว (judge)
- สอบผ่าน = คะแนนเฉลี่ย >= 5/10
- สอบตก (< 3/10) จะไม่สอบซ้ำภายใน 7 วัน
- สอบแล้วครบ 3 ข้อ จะไม่สอบซ้ำอีก

### Log Rotation

- ลบ log เก่าเกิน 30 วัน อัตโนมัติทุกรอบ (worker_logs + health_logs)

---

## MCP Server

BCProxyAI มี MCP Server ให้ OpenClaw/HiClaw เรียกใช้ได้โดยตรง

### ตั้งค่าใน OpenClaw

คัดลอกไฟล์ `mcp-config.openclaw.json` ไปใช้:

```json
{
  "mcpServers": {
    "bcproxyai": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "cwd": "<path-to-bcproxyai>",
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-xxxx",
        "BCPROXYAI_API_URL": "http://localhost:3333"
      }
    }
  }
}
```

### MCP Tools

| Tool | คำอธิบาย |
|------|---------|
| `find_available_models` | หาโมเดลฟรีที่ยังใช้ได้ (ไม่ติด rate limit) |
| `get_best_model` | แนะนำโมเดลที่ดีที่สุดตาม task (coding/thai/fast/reasoning) |
| `get_model_config` | ได้ config สำหรับ OpenClaw/HiClaw ทันที |
| `scan_free_models` | สแกนหาโมเดลฟรีใหม่ |
| `check_model_health` | เช็คโมเดลเฉพาะตัว |

---

## โครงสร้างโปรเจค

```
bcproxyai/
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Dashboard หน้าหลัก
│   │   ├── layout.tsx                     # Layout + metadata
│   │   ├── globals.css                    # CSS animations + glassmorphism
│   │   ├── api/
│   │   │   ├── chat/route.ts              # Chat API (Dashboard ใช้)
│   │   │   ├── models/route.ts            # รายชื่อโมเดล + health + benchmark
│   │   │   ├── status/route.ts            # สถานะ worker + สถิติ
│   │   │   ├── leaderboard/route.ts       # อันดับโมเดล
│   │   │   └── worker/route.ts            # สั่ง worker / ดูสถานะ
│   │   └── v1/
│   │       ├── chat/completions/route.ts  # Gateway (OpenAI compatible)
│   │       └── models/route.ts            # /v1/models
│   ├── components/
│   │   ├── shared.tsx                     # Types, constants, helpers
│   │   ├── StatsCards.tsx                 # การ์ดสถิติ
│   │   ├── ModelGrid.tsx                  # Grid โมเดลทั้งหมด
│   │   └── ChatPanel.tsx                  # หน้าแชท
│   └── lib/
│       ├── db/schema.ts                   # SQLite schema + connection
│       └── worker/
│           ├── index.ts                   # Worker orchestrator + log rotation
│           ├── scanner.ts                 # สแกน 4 providers
│           ├── health.ts                  # Health check + tool/vision detection
│           ├── benchmark.ts               # Benchmark ภาษาไทย
│           └── startup.ts                 # Auto-start worker
├── dist/mcp/                              # MCP Server (compiled)
├── docker-compose.yml
├── Dockerfile                             # Multi-stage build (289MB)
├── .env.local                             # API Keys (ไม่ commit)
└── data/bcproxyai.db                      # SQLite database
```

---

## การแก้ไขปัญหา

### Worker ไม่ทำงาน

```bash
# ดู log ของ container
docker logs bcproxyai-bcproxyai-1

# สั่ง worker รันทันที
curl -X POST http://localhost:3333/api/worker
```

### ไม่มีโมเดลพร้อมใช้

- ตรวจสอบว่าใส่ API Key ใน `.env.local` แล้ว
- รอ worker ทำ health check เสร็จ (ดูจาก Dashboard)
- โมเดลที่ติด rate limit จะพักอัตโนมัติ 2 ชม.

### Gateway ตอบ error

```bash
# ทดสอบ gateway
curl -X POST http://localhost:3333/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"test"}]}'
```

- ตรวจสอบ `X-BCProxy-Model` header เพื่อดูว่าเลือกโมเดลอะไร
- ถ้าไม่มีโมเดลพร้อมใช้ จะตอบ 503

### ต้องการ reset ข้อมูล

```bash
# ลบ database แล้ว restart
docker compose down
docker volume rm bcproxyai_bcproxyai-data
docker compose up -d
```

---

## การพัฒนาต่อ

หากต้องการนำ Code ไปแก้ไขเพิ่มเติม สิ่งที่แนะนำ:

1. **เพิ่ม API Key Authentication** — เพิ่ม middleware ตรวจ Bearer token ที่ `/v1/*` routes
2. **เพิ่ม Provider ใหม่** — เพิ่มฟังก์ชัน `fetchXxxModels()` ใน `scanner.ts` + URL ใน `health.ts`
3. **ปรับคำถาม Benchmark** — แก้ไขตัวแปร `QUESTIONS` ใน `benchmark.ts`
4. **เปลี่ยนเวลา Worker** — แก้ `setInterval` ใน `index.ts` (ปัจจุบัน 1 ชม.)

### รัน Tests

```bash
npm test            # รัน unit tests (67 tests)
npm run test:watch  # รัน tests แบบ watch mode
```

---

## ระบบ Benchmark (คุณครูออกข้อสอบ)

BCProxyAI ใช้ระบบ **"ให้ AI ตรวจข้อสอบ AI"** — โมเดลหนึ่งตอบคำถาม อีกโมเดลหนึ่งเป็นคุณครูตรวจให้คะแนน

### ข้อสอบ (3 ข้อ)

| ข้อ | คำถาม | ทดสอบอะไร |
|-----|-------|----------|
| 1 | "สวัสดีครับ วันนี้อากาศเป็นยังไงบ้าง?" | ทักทาย + ตอบคำถามทั่วไป |
| 2 | "แนะนำอาหารไทยมา 3 เมนู" | ความรู้วัฒนธรรมไทย + จัดรูปแบบ |
| 3 | "กรุงเทพมหานครอยู่ประเทศอะไร?" | ความรู้ทั่วไป + ตอบถูก |

### คุณครูผู้ตรวจ (AI Judge)

ใช้โมเดล AI ฟรีจาก OpenRouter เป็น "คุณครู" ตรวจคำตอบ ให้คะแนน 0-10 พร้อมเหตุผล:

| ลำดับ | โมเดล | หมายเหตุ |
|-------|-------|---------|
| 1 (หลัก) | **Qwen3 235B A22B** (`qwen/qwen3-235b-a22b:free`) | โมเดลใหญ่ที่สุด น่าเชื่อถือที่สุด |
| 2 (สำรอง) | **Llama 4 Scout** (`meta-llama/llama-4-scout:free`) | ถ้าตัวแรกไม่ว่าง |
| 3 (สำรอง) | **Gemma 3 27B** (`google/gemma-3-27b-it:free`) | ถ้าสองตัวแรกไม่ว่าง |

ถ้าคุณครูไม่ว่างทั้ง 3 ตัว จะใช้ Heuristic Score แทน (คำตอบยาว > 10 ตัวอักษร = 5/10)

### เกณฑ์การให้คะแนน

| คะแนน | หมายถึง |
|-------|--------|
| 8-10 | ตอบถูกต้อง เป็นธรรมชาติ ภาษาไทยดี |
| 5-7 | ตอบได้ แต่อาจมีบางจุดไม่สมบูรณ์ |
| 3-4 | ตอบได้บ้าง แต่คุณภาพต่ำ |
| 0-2 | ตอบผิด ตอบไม่เป็นภาษาไทย หรือไม่ตอบ |

### กฎการสอบ

- **สอบผ่าน** = คะแนนเฉลี่ย >= 5/10 — โมเดลพร้อมใช้งาน
- **สอบตก** = คะแนนเฉลี่ย < 3/10 — ไม่สอบซ้ำภายใน 7 วัน (ประหยัด token)
- สอบครบ 3 ข้อแล้ว จะไม่สอบซ้ำอีก
- สอบสูงสุด 3 โมเดลต่อรอบ (ทุก 1 ชม.)
- เฉพาะโมเดลที่ผ่าน Health Check แล้วเท่านั้นจึงจะถูกสอบ

---

## สร้างด้วยอะไร?

โปรเจคนี้สร้างด้วย **Claude Code (Claude CLI)** — AI Coding Assistant จาก Anthropic  
สั่งงานเป็นภาษาไทย สร้างเสร็จภายในวันเดียว ตั้งแต่ออกแบบจนถึง deploy

| เครื่องมือ | ทำหน้าที่ |
|-----------|----------|
| **Claude Code (Opus 4.6)** | เขียนโค้ดทั้งหมด ออกแบบระบบ เขียน tests |
| **Next.js 16 + TypeScript** | Web framework + ภาษาหลัก |
| **SQLite (better-sqlite3)** | ฐานข้อมูลแบบ embedded |
| **Tailwind CSS** | Glassmorphism + animations |
| **Docker** | Multi-stage build (289MB) |
| **Vitest** | Unit testing (67 tests) |

### ต้นทุน

- **ค่า Claude Code** — Claude Pro/Max subscription
- **ค่า AI Model** — ฟรี! ใช้เฉพาะโมเดลฟรี
- **ค่า Server** — ฟรี! รันบน Docker Desktop บนเครื่องตัวเอง

---

**BCProxyAI** — Smart AI Gateway สำหรับ OpenClaw และ HiClaw  
สร้างด้วย Claude Code (Opus 4.6) + Next.js 16 + TypeScript + SQLite + Tailwind CSS
