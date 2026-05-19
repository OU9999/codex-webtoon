# webtoon-panel-studio

[EN](./README.md) | **KR**

로컬 우선 AI 웹툰 패널 에디터입니다.

세로 웹툰 캔버스를 만들고, 선택한 패널을 생성하며, 패널별 후보 이미지를
보관하고, 말풍선을 별도 레이어로 편집할 수 있습니다. 앱은 로컬에서 실행되며
프로젝트를 사용자의 컴퓨터에 저장합니다.

## 요구 사항

- Node.js 22.13.0 이상
- pnpm 11

## CLI 사용

패키지 배포 후 다음 명령으로 실행할 수 있습니다.

```bash
pnpm dlx webtoon-panel-studio
```

기본적으로 서버는 <http://127.0.0.1:4321/> 에서 시작됩니다.

사용 가능한 명령:

```bash
pnpm dlx webtoon-panel-studio serve
pnpm dlx webtoon-panel-studio status
pnpm dlx webtoon-panel-studio help
```

## 인증

이미지 생성은 사용 가능한 첫 번째 공급자를 사용합니다.

- Codex CLI가 설치되어 있고 인증된 경우 Codex OAuth
- `OPENAI_API_KEY` 또는 로컬 설정 파일의 OpenAI API 키

API 키 설정 파일:

```json
{
  "openaiApiKey": "sk-..."
}
```

기본 설정 파일 경로:

```text
~/.config/webtoon-panel-studio/config.json
```

## 환경 변수

| 변수                           | 기본값                           | 설명                                              |
| ------------------------------ | -------------------------------- | ------------------------------------------------- |
| `OPENAI_API_KEY`               | 설정 안 됨                       | OpenAI API 키 대체 경로입니다.                    |
| `WPS_HOST`                     | `127.0.0.1`                      | 로컬 서버 호스트입니다.                           |
| `WPS_PORT`                     | `4321`                           | 로컬 서버 포트입니다.                             |
| `WPS_CONFIG_DIR`               | `~/.config/webtoon-panel-studio` | 설정 및 서버 광고 디렉터리입니다.                 |
| `WPS_PROJECTS_ROOT`            | `~/WebtoonProjects`              | 로컬 프로젝트 저장소 루트입니다.                  |
| `WPS_OAUTH`                    | `auto`                           | OAuth 모드입니다. 값은 `auto`, `on`, `off`입니다. |
| `WPS_OAUTH_PROXY_PORT`         | `10531`                          | 로컬 OAuth 프록시 포트입니다.                     |
| `WPS_OAUTH_STARTUP_TIMEOUT_MS` | `20000`                          | OAuth 프록시 시작 제한 시간입니다.                |

## 개발

의존성을 설치하기 전에 고정된 Node.js 버전을 사용하세요.

```bash
nvm use
```

`.node-version`을 읽는 도구는 동일한 `22.13.0` 기준으로 자동 전환할 수
있습니다.

```bash
pnpm install
pnpm dev
```

Vite 개발 서버는 <http://127.0.0.1:5173/> 에서 실행되고, API 서버는
<http://127.0.0.1:4321/> 에서 실행됩니다.

## 기능

- 선택 가능한 패널이 있는 세로 웹툰 캔버스
- 패널 추가, 복제, 삭제, 재정렬, 크기 조절
- 프로젝트 공통 프롬프트와 패널별 장면 프롬프트
- 선택한 패널의 목업 생성과 후보 히스토리
- 대사, 독백, 생각, 효과음 레이어 편집
- 로컬 JSON 내보내기와 전체 스트립 PNG 내보내기

## 스택

- pnpm
- Vite + React + TypeScript
- Tailwind CSS v4
- shadcn/ui 스타일 로컬 컴포넌트

## 검사

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```
