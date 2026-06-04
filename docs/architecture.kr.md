# 아키텍처

[EN](./architecture.md) | **KR**

codex-webtoon은 로컬에서 실행되는 웹툰 제작 도구입니다. 사용자는 npm으로 CLI를
설치하고, CLI는 로컬 Express 서버와 Codex OAuth 프록시를 실행합니다. 브라우저
UI는 이 로컬 서버에 붙어서 프로젝트 저장, 이미지 생성, 후보 관리, PNG/JSON
내보내기를 수행합니다.

`openai-oauth`는 이 프로젝트가 사용하는 OAuth 프록시입니다. 제3자 패키지이며
OpenAI 공식 제품, SDK, API endpoint 또는 지원되는 OpenAI 공식 API 경로가
아닙니다. 라이선스는 AGPL-3.0-only입니다.
[제3자 고지](./third-party-notices.kr.md)를 참조하세요.

## 구성요소

| 영역      | 주요 파일                                                  | 역할                                                          |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| CLI       | `bin/codex-webtoon.ts`                                     | `setup`, `serve`, `status`, `help` 명령 처리                  |
| 설정      | `server/config.ts`                                         | 환경변수, config file, 기본값 병합                            |
| 서버      | `server/server.ts`                                         | Express app 구성, static UI 제공, API 라우팅                  |
| 인증      | `server/lib/auth/*`                                        | Codex OAuth 감지, 제3자 `openai-oauth` 실행, 이미지 생성 호출 |
| API       | `server/routes/*`                                          | 프로젝트, 인증 상태, 이미지 생성 API                          |
| 저장소    | `server/lib/project-store.ts`, `server/lib/image-store.ts` | 프로젝트 JSON과 후보 PNG/metadata 저장                        |
| 공유 타입 | `shared/*`                                                 | 서버와 UI가 공유하는 상태/타입/정규화 로직                    |
| 웹 UI     | `src/*`                                                    | React 기반 프로젝트 선택 화면과 스튜디오 화면                 |

## 실행 흐름

### 1. 설치

사용자 설치 경로는 npm global install입니다.

```bash
npm install -g codex-webtoon
```

패키지는 빌드된 CLI, 서버 코드, Vite 정적 산출물, README 이미지 assets를
포함합니다. 런타임 dependency로 `@openai/codex`와 `openai-oauth`를 포함하므로
사용자가 별도로 Codex CLI나 OAuth 프록시 패키지를 설치할 필요가 없습니다.
`openai-oauth`는 AGPL-3.0-only 라이선스의 제3자 런타임 의존성입니다.

### 2. Setup

```bash
codex-webtoon setup
```

`setup`은 현재 Codex OAuth 세션을 확인합니다. 세션이 없으면 패키지 내부
`codex` CLI를 우선 실행하고, 필요한 경우 `npx --yes @openai/codex login`으로
fallback합니다.

인증이 확인되면 config file에 OAuth mode를 저장합니다.

```text
~/.config/codex-webtoon/config.json
```

Windows에서는 사용자 홈 아래 대응되는 config 경로가 사용됩니다.

### 3. Serve

```bash
codex-webtoon serve
```

`serve`는 빌드된 서버 엔트리 `build/server/server.js`를 실행합니다. 서버 시작
시 Codex 인증 상태를 확인하고, OAuth mode가 활성 상태면 패키지 내부
`openai-oauth` 실행 파일을 우선 사용해 로컬 OpenAI-compatible proxy를 띄웁니다.
여기서 OpenAI-compatible은 로컬 HTTP interface 형태를 뜻하며, OpenAI 공식 API
경로를 의미하지 않습니다.

```text
http://127.0.0.1:4321
```

브라우저 UI와 API는 같은 로컬 서버에서 제공됩니다.

## API 흐름

### 프로젝트

프로젝트 API는 로컬 파일 시스템에 프로젝트 metadata와 상태 JSON을 저장합니다.

| API                             | 역할               |
| ------------------------------- | ------------------ |
| `GET /api/projects`             | 프로젝트 목록      |
| `POST /api/projects`            | 새 프로젝트 생성   |
| `GET /api/projects/:name/state` | 프로젝트 상태 로드 |
| `PUT /api/projects/:name/state` | 프로젝트 상태 저장 |
| `PATCH /api/projects/:name`     | 프로젝트 이름 변경 |
| `DELETE /api/projects/:name`    | 프로젝트 삭제      |

기본 프로젝트 루트는 다음입니다.

```text
~/WebtoonProjects
```

### 인증 상태

```text
GET /api/auth/status
```

응답은 Codex 세션 상태, OAuth proxy 상태, 권장 provider를 포함합니다. UI의
`OAuth` badge는 이 API를 기준으로 표시됩니다.

### 이미지 생성

```text
POST /api/generate
```

생성 요청은 다음 흐름으로 처리됩니다.

1. 요청 body 검증
2. 프로젝트 디렉터리 확인
3. provider 결정 (`auto` 또는 `oauth`)
4. 레퍼런스 이미지가 있으면 파일로 읽기
5. `openai-oauth` proxy를 통해 prompt와 reference image data 전송
6. 생성 PNG 저장
7. candidate metadata 저장
8. UI에 candidate 목록 반환

로컬 우선 저장 방식이 이미지 생성을 오프라인으로 만든다는 뜻은 아닙니다.
prompt 텍스트와 선택된 reference image data는 `openai-oauth` proxy를 통해 외부
모델 요청으로 로컬 앱 밖에 전송됩니다.

저장 경로 예시는 다음과 같습니다.

```text
~/WebtoonProjects/<project>/candidates/<panel-id>/<candidate-id>.png
~/WebtoonProjects/<project>/candidates/<panel-id>/<candidate-id>.json
```

candidate metadata에는 prompt snapshot, provider, model, size, reference image
정보가 들어갑니다.

## 상태 모델

UI의 핵심 상태는 `StudioState`입니다. 주요 구성은 다음입니다.

- `commonPrompt`: 프로젝트 공통 프롬프트
- `canvases`: 웹툰 캔버스 목록
- `panels`: 패널 목록과 각 패널의 후보 이미지, 말풍선, 레퍼런스 이미지
- `selectedPanelId`, `selectedPanelIds`: 현재 패널 선택 상태
- `selectedBubbleId`, `selectedBubbleIds`: 현재 말풍선 선택 상태
- `panelGap`, `panelGapColor`: 캔버스 레이아웃 설정
- `variantCount`: 생성 후보 개수

서버 저장 시에는 `shared/project-state.ts`의 정규화 로직으로 legacy state와 잘못된
geometry를 보정합니다.

## 플랫폼 처리

패키지는 macOS, Linux, Windows를 모두 대상으로 합니다.

- Windows에서는 `.cmd` shim을 우선 탐색합니다.
- 패키지 내부 `node_modules/.bin/codex.cmd`와 `openai-oauth.cmd`를 사용합니다.
- 패키지 내부 실행 파일을 찾지 못하면 `npx --yes` fallback을 사용합니다.
- Windows native PowerShell 테스트에서 setup, serve, OAuth ready, 이미지 생성,
  PNG 저장, Edge 렌더링까지 통과했습니다.

## 배포 산출물

npm 패키지의 주요 payload는 `package.json`의 `files` 목록으로 제어됩니다. npm은
`package.json`, `README.md`, `README.kr.md`, `LICENSE` 같은 표준 metadata 및
license/readme 파일도 포함할 수 있습니다. 주요 패키지 경로는 다음입니다.

- `asset`
- `build`
- `docs`
- `dist`
- `README.md`
- `README.kr.md`

소스 TS/TSX 파일, 테스트, `.docs` 내부 기획 문서, 임시 산출물은 npm 패키지에
포함되지 않습니다.

## 보안과 범위

- 앱은 로컬 서버로 동작하며 기본 host는 `127.0.0.1`입니다.
- 프로젝트 파일과 생성 이미지는 사용자 로컬 디스크에 저장됩니다.
- "로컬 우선"은 프로젝트 저장, candidate image 저장, export가 기본적으로 로컬에
  저장된다는 뜻입니다.
- 이미지 생성은 사용자의 Codex OAuth 세션을 사용하며, prompt 텍스트와 선택된
  reference image data를 `openai-oauth`를 통해 외부 모델 서비스로 전송합니다.
- `openai-oauth`는 AGPL-3.0-only 라이선스의 제3자 OAuth 프록시이며 OpenAI 공식
  제품 또는 OpenAI 공식 API 경로가 아닙니다.
- 이 프로젝트는 OpenAI 공식 제품이 아니며 OpenAI와 제휴, 보증, 후원 관계가
  없습니다.
