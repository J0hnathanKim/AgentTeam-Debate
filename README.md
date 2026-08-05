<p align="center">
  <img src="docs/icon-rounded.png" alt="Agent Team Debate" width="120">
</p>

<h1 align="center">Agent Team Debate</h1>

<p align="center">
  소방 전문가 4인이 디스코드에서 토론하고 보고서를 써주는 봇 — 처음부터 세팅하기
</p>

[![CI](https://github.com/J0hnathanKim/AgentTeam-Debate/actions/workflows/ci.yml/badge.svg)](https://github.com/J0hnathanKim/AgentTeam-Debate/actions)

다른 컴퓨터에서도 이 순서 그대로 따라 하면 됩니다. **Claude Pro 또는 Max 구독 계정**과 디스코드 계정만 있으면 되고, API 키는 필요 없습니다.

> This is the quick-start guide for the bundled multi-agent debate demo. For the full English platform reference (all slash commands, security model, per-OS installers), see **[PLATFORM.md](PLATFORM.md)**.

## 팀 구성

| 이름 | 역할 |
|------|------|
| **김장비** | 소방용품 전문가 |
| **김유엘** | UL 인증 전문가 |
| **김공학** | 소방기술사 |
| **김문서** | 문서작성자 (봇 본체) |

각 전문가가 순서대로/병렬로 의견을 내고, 서로 반박·동의하며 토론한 뒤, 김문서가 합의된 결론을 정해진 양식의 `.docx`로 작성해 채널에 자동 첨부합니다.

---

## 0. 준비물 체크

- [ ] Node.js 20 이상 설치 가능한 컴퓨터 (Windows / macOS / Linux 다 됨)
- [ ] Git 설치
- [ ] Claude Pro 또는 Max 구독 계정 (API 키 아님)
- [ ] 디스코드 계정 + 봇을 초대할 서버의 관리자 권한

## 1. 저장소 클론 & 설치

터미널(PowerShell / Terminal)을 열고 원하는 폴더에서 실행합니다.

```bash
git clone https://github.com/J0hnathanKim/AgentTeam-Debate.git
cd AgentTeam-Debate
npm install
```

> **더 쉬운 길**: 설치까지 자동으로 해주는 스크립트도 있습니다. macOS/Linux는 `./install.sh`, Windows는 `install.bat`을 실행하면 Node.js·Claude Code CLI·패키지를 알아서 설치합니다. 이 가이드는 어떤 일이 벌어지는지 보여주기 위해 수동 순서로 설명합니다.

## 2. Claude Code CLI 설치 & 로그인

```bash
npm install -g @anthropic-ai/claude-code
claude
```

마지막 `claude` 실행 시 브라우저가 열리면서 Anthropic 계정 로그인을 요구합니다. 로그인이 끝나고 대화가 바로 시작되면 준비 완료입니다.

> ⚠️ **주의**: 여기서 API 키(`ANTHROPIC_API_KEY`)를 넣지 않습니다. 이 프로젝트는 로그인된 구독 세션만 사용하도록 만들어져 있습니다.

## 3. 디스코드 봇 앱 만들기

[Discord Developer Portal](https://discord.com/developers/applications)에서 **New Application**으로 새 앱을 만듭니다.

**Bot 탭**
- **Reset Token**으로 토큰 발급 → 복사해두기 (한 번만 보여줌)
- **MESSAGE CONTENT INTENT** 켜고 저장 — 꺼져 있으면 봇이 로그인 자체를 못 함

**OAuth2 → URL Generator 탭**
- **SCOPES**: `bot`, `applications.commands`
- **BOT PERMISSIONS**: `Send Messages`, `Embed Links`, `Read Message History`, `Use Slash Commands`, `Manage Webhooks`

> 🔑 **Manage Webhooks가 특히 중요**: 이게 있어야 김장비·김유엘·김공학이 토론할 때 각자 다른 이름/아이콘으로 메시지가 나뉘어 보입니다. 빠뜨리면 봇 하나의 이름으로만 전부 나옵니다.

생성된 URL을 브라우저에 붙여넣고, 초대할 서버를 선택해 **Authorize**합니다.

## 4. 서버 ID · 사용자 ID 복사

디스코드 앱 → 사용자 설정 → 고급 → **개발자 모드** 켜기. 그다음:

- 서버 이름 우클릭 → **서버 ID 복사** (= `DISCORD_GUILD_ID`)
- 본인 프로필 우클릭 → **사용자 ID 복사** (= `ALLOWED_USER_IDS`, 여러 명이면 쉼표로 구분)

## 5. .env 작성

클론한 폴더 루트에서 `.env.example`을 복사해 `.env`를 만들고 값을 채웁니다.

```bash
# macOS/Linux: cp .env.example .env
# Windows:      copy .env.example .env
```

```env
DISCORD_BOT_TOKEN=3단계에서 복사한 토큰
DISCORD_GUILD_ID=4단계 서버 ID
ALLOWED_USER_IDS=4단계 사용자 ID
BASE_PROJECT_DIR=저장소를 클론한 상위 폴더 경로
RATE_LIMIT_PER_MINUTE=10
SHOW_COST=true
```

| 변수 | 의미 |
|------|------|
| `BASE_PROJECT_DIR` | 이 경로 밑에 있는 폴더만 `/register`로 등록할 수 있습니다. 저장소를 `/home/me/dev/AgentTeam-Debate`에 클론했다면 `/home/me/dev`로 설정하세요. |
| `SHOW_COST` | 매 응답마다 예상 비용 표시. Max 플랜이면 `false` 권장. |

## 6. docx 생성 도구 설치

문서작성자 에이전트가 최종 보고서 파일을 만들 때 쓰는 작은 스크립트의 의존성을 한 번만 설치합니다.

```bash
cd examples/fire-safety-report-team/tools
npm install
cd ../../..
```

## 7. 봇 실행

```bash
npm run dev
```

콘솔에 `Bot logged in as ...`와 `Registered 10 slash commands`가 뜨면 정상입니다. 계속 켜두려면 macOS는 `./mac-start.sh`, Windows는 `win-start.bat`, Linux는 `./linux-start.sh`로 백그라운드 실행하세요 (트레이 아이콘 제공).

## 8. 채널에 등록

봇을 쓸 디스코드 채널로 이동해서 슬래시 명령어로 등록합니다.

```
/register AgentTeam-Debate/examples/fire-safety-report-team
```

초록색 **Project Registered** 임베드가 뜨면 성공입니다.

## 9. 토론 시켜보기

같은 채널에 그냥 평범한 메시지로 주제를 던집니다 (슬래시 명령어 아님):

```
국내 감지기 문제점과 개선방안 보고서 작성해줘
```

일어나는 일:
- 김장비·김유엘·김공학이 각자 1차 의견을 마치는 대로 채널에 게시
- 서로의 의견에 대한 2차 토론(동의/반박)이 이어서 게시
- 김문서가 합의된 결론을 정해진 양식의 `.docx`로 작성
- 완성된 파일이 채널에 자동 첨부

> 💡 **진행이 느리면**: `/auto-approve on`을 채널에서 실행하세요. 꺼진 상태면 문서 저장(파일 쓰기) 단계마다 승인 버튼을 눌러줘야 합니다.

## 10. 내 주제로 바꾸기

`examples/fire-safety-report-team/` 폴더를 복사해서 이름을 바꾸고, 그 안의 `.claude/agents/*.md` 4개 파일(전문가 페르소나)과 `CLAUDE.md`(토론 진행 방식)를 원하는 주제로 고쳐 쓰면 됩니다. 자세한 절차는 [`examples/fire-safety-report-team/README.md`](examples/fire-safety-report-team/README.md)에 있습니다.

---

## 막히면

<details>
<summary><strong>봇이 로그인 단계에서 계속 재연결만 반복해요 (Used disallowed intents)</strong></summary>
<br>

Developer Portal → Bot 탭에서 MESSAGE CONTENT INTENT가 꺼져 있는 경우입니다. 켜고 저장한 뒤 봇을 다시 시작하세요.
</details>

<details>
<summary><strong>메시지를 보내도 "⏳ Thinking..."에서 멈춰요</strong></summary>
<br>

먼저 터미널에서 `claude -p "hi"`가 바로 응답하는지 확인해 로그인 상태를 점검하세요. 이 저장소는 Windows에서 발생하던 PATH 관련 버그가 이미 수정되어 있습니다.
</details>

<details>
<summary><strong>Another bot instance is already running 이라고 나와요</strong></summary>
<br>

이전 실행이 비정상 종료되며 `.bot.lock` 파일이 남은 경우입니다. 봇 프로세스가 실제로 종료됐는지 확인 후 저장소 루트의 `.bot.lock` 파일을 삭제하고 다시 실행하세요.
</details>

<details>
<summary><strong>전문가별로 이름이 안 나뉘고 봇 이름으로만 나와요</strong></summary>
<br>

초대 시 Manage Webhooks 권한이 빠졌을 가능성이 큽니다. 서버 설정 → 연동(Integrations)에서 봇 권한에 추가하거나, 그 권한을 포함해서 봇을 다시 초대하세요.
</details>

---

<p align="center">
  Agent Team Debate — <a href="https://github.com/J0hnathanKim/AgentTeam-Debate">github.com/J0hnathanKim/AgentTeam-Debate</a> · MIT License<br>
  이 봇 자체의 다른 기능(다른 프로젝트 등록, 세션 관리, 여러 PC 연동, 보안 구조 등)은 <a href="PLATFORM.md">PLATFORM.md</a> 참고
</p>
