# codex-webtoon

[EN](./README.md) | **KR**

<!-- TODO: 패키지 로고 이미지를 여기에 추가: assets/logo.png -->

codex-webtoon은 Codex CLI OAuth를 사용하는 비공식 로컬 우선 AI 웹툰
스튜디오입니다. OpenAI와 제휴, 보증 또는 후원 관계가 없습니다.

세로 웹툰 캔버스를 만들고, 선택한 패널을 생성하며, 패널별 후보 이미지를
보관하고, 말풍선을 별도 레이어로 편집할 수 있습니다. 앱은 로컬에서 실행되며
프로젝트를 사용자의 컴퓨터에 저장합니다.

<!-- TODO: 메인 스튜디오 스크린샷을 여기에 추가: assets/screenshots/studio-overview.png -->

## 요구 사항

- Node.js 22.13.0 이상
- pnpm 11

## CLI 사용

패키지 배포 후 다음 명령으로 실행할 수 있습니다.

```bash
pnpm dlx codex-webtoon setup
pnpm dlx codex-webtoon serve
```

기본적으로 서버는 <http://127.0.0.1:4321/> 에서 시작됩니다.

사용 가능한 명령:

```bash
pnpm dlx codex-webtoon setup
pnpm dlx codex-webtoon serve
pnpm dlx codex-webtoon status
pnpm dlx codex-webtoon help
```

패키지는 기존 호환성을 위해 `wps` CLI alias도 유지합니다.

## 인증

이미지 생성은 로컬 Codex OAuth 프록시를 사용합니다. `setup`은 패키지에
포함된 Codex CLI 로그인 흐름을 실행하고 config 디렉터리에 로컬 설정을
저장합니다.

```bash
pnpm dlx codex-webtoon setup
```

설정 후 `serve`는 로컬 웹 서버를 시작하고, Codex OAuth 세션이 있으면
패키지에 포함된 `openai-oauth` 프록시를 함께 실행합니다.

## 환경 변수

| 변수                                     | 기본값                                | 설명                                                                        |
| ---------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `CODEX_WEBTOON_HOST`                     | `127.0.0.1`                           | 로컬 서버 호스트입니다.                                                     |
| `CODEX_WEBTOON_PORT`                     | `4321`                                | 로컬 서버 포트입니다.                                                       |
| `CODEX_WEBTOON_CONFIG_DIR`               | `~/.config/codex-webtoon`             | 설정 및 서버 광고 디렉터리입니다.                                           |
| config file                              | `~/.config/codex-webtoon/config.json` | `codex-webtoon setup`이 쓰는 선택적 파일 설정입니다. 환경변수가 우선합니다. |
| `CODEX_WEBTOON_PROJECTS_ROOT`            | `~/WebtoonProjects`                   | 로컬 프로젝트 저장소 루트입니다.                                            |
| `CODEX_WEBTOON_OAUTH`                    | `auto`                                | OAuth 모드입니다. 값은 `auto`, `on`, `off`입니다.                           |
| `CODEX_WEBTOON_OAUTH_PROXY_PORT`         | `10531`                               | 로컬 OAuth 프록시 포트입니다.                                               |
| `CODEX_WEBTOON_OAUTH_STARTUP_TIMEOUT_MS` | `20000`                               | OAuth 프록시 시작 제한 시간입니다.                                          |

기존 `WPS_*` 환경변수는 fallback으로 계속 동작합니다. 별도 config
디렉터리를 지정하지 않았고 `~/.config/webtoon-panel-studio`가 이미 있으면,
codex-webtoon은 호환성을 위해 해당 디렉터리를 읽습니다.

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

<!--
TODO: 이 섹션 또는 가까운 위치에 워크플로우 스크린샷 추가:
- assets/screenshots/panel-generation.png
- assets/screenshots/speech-bubbles.png
- assets/screenshots/png-export.png
-->

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
