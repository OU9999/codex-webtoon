### 프로젝트 환경

- 패키지 매니저: pnpm 사용. npm, yarn 사용 금지.

### 디자인 규칙

- 디자인, 스타일링 작업 시 `DESIGN.md` 참조할 것.

### 코드 작성 규칙

- 가독성을 위해 early return 패턴 적극 사용
- HTML 요소 스타일링은 반드시 Tailwind 클래스 사용. inline style 사용 금지.
- 여러 Tailwind className을 조합하거나 조건부로 전달할 때는 template literal 문자열 결합 대신 `cn` 유틸 사용.
- 함수 선언 대신 `const` 화살표 함수 사용 (예: `const toggle = () =>`) 가능하면 타입도 정의.
- 단, App Router 라우트 컴포넌트(page, layout, loading, error 등)는 `export default function`으로 선언.
- inline export 대신 파일 끝에서 named export 사용 (예: `export { foo, bar }`, `export type { FooType }`)
- `useMemo`, `useCallback` 훅 사용 금지. React 19.2+ with React Compiler 사용으로 메모이제이션 자동 처리.
- 상대 경로는 `../..`까지만 허용. `../../..` 이상이면 path alias 사용.
- 객체 타입은 `type` 대신 `interface` 사용.
- 해키한 패턴 금지. 우회가 필요하면 구조 자체를 재설계.
- `useEffect` 코드 추가시 항상 JSDoc으로 코드 설명.
- `useEffect`는 항상 컴포넌트 맨 밑(return 직전)에 배치.
- 컴포넌트 내부에서 불필요한 `<div>` 중첩 지양. 적절한 시맨틱 HTML 태그로 계층을 구분하여 가독성 확보.
- JSX props에 인라인 함수 전달 금지. 컴포넌트 내부에서 `const handleXxx = () => {}` 형태로 선언 후 전달.
- 컴포넌트 디렉토리에서 `index.ts` 재export 금지.
