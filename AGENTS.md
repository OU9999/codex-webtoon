# Codex Webtoon Agent Rules

## 프로젝트 개요

Codex CLI OAuth 기반 로컬 우선 웹툰 스튜디오. React/Vite UI와 Express 서버 구성. AI 패널 생성, 프로젝트 저장, 이미지 관리 제공.

## 프로젝트 맵

- `src/`: React UI, 컴포넌트, 훅, i18n, 클라이언트 API
- `server/`: Express 서버, 라우트, 인증, 이미지/프로젝트 저장소
- `shared/`: 클라이언트·서버 공유 타입과 상태 모델
- `tests/`: `tsx --test` 기반 테스트
- `docs/`: 사용자/아키텍처 문서
- `DESIGN.md`: 제품 디자인 원칙과 UI 토큰

## 프로젝트 환경

- `pnpm` 전용 패키지 관리
- `npm`, `yarn` 사용 금지

## 필수 참조 규칙

- 모든 작업 전 `rules/work-rules.md` 참조
- web 코드 수정 시 `rules/web-code-rules.md` 참조
- 디자인·스타일링 작업 시 `DESIGN.md` 참조
- 테스트·검증 필요 시 `rules/test-rules.md` 참조
- 스킬·에이전트·규칙 문서 작성/수정 시 `rules/docs-rules.md` 참조
