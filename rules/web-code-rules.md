# Web Code Rules

## 파일과 디렉터리

- 파일 이름은 kebab-case 고정
- React 컴포넌트 파일도 `webtoon-canvas.tsx`, `project-store.ts` 형식
- 디렉터리 이름도 kebab-case 고정
- 컴포넌트 디렉터리의 `index.ts` 재export 금지
- 상대 경로는 `../..`까지만 허용
- `../../..` 이상 경로는 path alias 사용

## TypeScript

- 객체 타입은 `type` 대신 `interface` 사용
- 함수 선언보다 `const` 화살표 함수 우선
- 함수와 이벤트 핸들러의 명시적 타입 우선
- inline export 대신 파일 끝 named export 사용
- 예: `export { foo, bar }`, `export type { FooType }`

## React

- early return 패턴 적극 사용
- `useMemo`, `useCallback` 훅 사용 금지
- React 19.2+와 React Compiler의 자동 메모이제이션 전제
- `useEffect` 추가 시 JSDoc 의도 설명 필수
- `useEffect`는 컴포넌트 맨 밑, `return` 직전 배치
- JSX props 인라인 함수 전달 금지
- 컴포넌트 내부 `const handleXxx = () => {}` 선언 후 전달
- 불필요한 `<div>` 중첩 회피
- 가능한 경우 시맨틱 HTML 태그로 계층 구분

## 스타일링

- HTML 요소 스타일링은 Tailwind 클래스만 사용
- inline style 금지
- 여러 Tailwind `className` 조합 또는 조건부 전달 시 `cn` 유틸 사용
- template literal 문자열 결합 금지
- 디자인/스타일링 작업 시 `DESIGN.md` 토큰, 레이아웃, 컴포넌트 규칙 준수
