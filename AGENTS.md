# Codex Webtoon Agent Rules

## 프로젝트 환경

- 패키지 매니저는 `pnpm`만 사용한다. `npm`, `yarn`은 사용하지 않는다.

## 필수 참조 규칙

- 모든 작업 전 `rules/work-rules.md`를 참조한다.
- web 코드 수정 시 `rules/web-code-rules.md`를 참조한다.
- 디자인, 스타일링 작업 시 `DESIGN.md`를 참조한다.
- 테스트/검증이 필요한 작업 시 `rules/test-rules.md`를 참조한다.
- 문서 작성/수정 시 `rules/docs-rules.md`를 참조한다.

## 프로젝트 맵

- `src/`: React UI, 컴포넌트, 훅, i18n, 클라이언트 API.
- `server/`: Express 서버, 라우트, 인증, 이미지/프로젝트 저장소.
- `shared/`: 클라이언트와 서버가 공유하는 타입과 상태 모델.
- `tests/`: `tsx --test` 기반 테스트.
- `docs/`: 사용자/아키텍처 문서.
- `DESIGN.md`: 제품 디자인 원칙과 UI 토큰.
