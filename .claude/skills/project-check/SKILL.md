---
name: project-check
description: 로컬 품질 검증과 실패 원인 분류. AGENTS.md/DESIGN.md 규칙 준수 확인, pnpm 기반 format/typecheck/test/build 실행, CI나 로컬 검증 실패 분류, PR 전 점검, 직접 테스트 요청에 사용한다.
---

# 프로젝트 점검

## 원칙

- `pnpm`만 사용한다. `npm`, `yarn`으로 설치/스크립트를 실행하지 않는다.
- 먼저 `AGENTS.md`를 읽고, UI/스타일 변경이면 `DESIGN.md`도 읽는다.
- 정리되지 않은 working tree를 전제로 작업한다. 사용자가 만든 변경을 되돌리지 않는다.
- 실패는 한 번에 하나씩 분류하고, 가장 작은 수정으로 해결한다.

## 실행 순서

### 1. 범위 확인

```bash
git status --short
git diff --name-status --find-renames
git diff --stat
```

변경 파일이 많으면 기능 단위로 묶어서 검증한다. 스킬, 에이전트, 규칙 파일이 바뀌었으면 `.claude`와 `.agents` 동기화 여부를 확인한다.

### 2. 규칙 준수 확인

다음 항목을 빠르게 훑는다.

- 파일/디렉터리 이름이 kebab-case인지
- Tailwind class 사용, inline style 금지, 조건부 class는 `cn` 사용인지
- `useMemo`, `useCallback`이 추가되지 않았는지
- `useEffect`가 return 직전에 있고 JSDoc 설명이 있는지
- 객체 타입은 `interface`인지
- export가 파일 끝 named export인지
- `../..`보다 깊은 상대 경로가 path alias로 처리됐는지
- 컴포넌트 디렉터리에 `index.ts` 재export가 추가되지 않았는지

### 3. 로컬 검증

`package.json`에 존재하는 스크립트만 실행한다. 기본 순서:

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

릴리스/패키징 검증이면 다음을 우선한다.

```bash
pnpm prepublishOnly
```

### 4. 실패 원인 분류

실패하면 다음 순서로 처리한다.

1. 실패 종류를 `format`, `typecheck`, `test`, `build`, `runtime`, `browser` 중 하나로 분류한다.
2. 첫 번째 의미 있는 에러와 관련 파일만 읽는다.
3. 원인 후보를 1-2개로 좁힌다.
4. 필요한 최소 수정만 한다.
5. 실패한 명령을 먼저 재실행하고, 통과하면 이후 명령을 이어서 실행한다.

### 5. 브라우저/수동 UI 확인

사용자가 직접 테스트, 화면 먹통, UI 회귀, PNG/export 문제를 요청하면 `playwright-cli` 스킬을 함께 사용한다.

```bash
pnpm dev
```

브라우저 확인에서는 콘솔 에러, 네트워크 실패, 스크린샷, 재현 단계를 남긴다. UI 변경 검증은 `DESIGN.md` 기준으로 판단한다.

## 보고 형식

- 실행한 명령과 결과
- 발견한 규칙 위반 또는 실패 원인
- 수정한 파일
- 남은 검증 공백
