# Web Code Rules

## 파일과 디렉터리

- 파일 이름은 무조건 kebab-case를 사용한다. React 컴포넌트도 예외 없이 `webtoon-canvas.tsx`, `project-store.ts`처럼 작성한다.
- 디렉터리 이름도 kebab-case를 사용한다.
- 컴포넌트 디렉터리에서 `index.ts` 재export를 만들지 않는다.
- 상대 경로는 `../..`까지만 허용한다. `../../..` 이상이면 path alias를 사용한다.

## TypeScript

- 객체 타입은 `type` 대신 `interface`를 사용한다.
- 함수 선언보다 `const` 화살표 함수를 우선 사용한다.
- 가능하면 함수와 이벤트 핸들러에 명시적인 타입을 둔다.
- inline export 대신 파일 끝에서 named export를 사용한다.
- 예: `export { foo, bar }`, `export type { FooType }`

## React

- 가독성을 위해 early return 패턴을 적극 사용한다.
- `useMemo`, `useCallback` 훅을 사용하지 않는다. React 19.2+와 React Compiler의 자동 메모이제이션을 전제로 한다.
- `useEffect` 코드를 추가할 때는 항상 JSDoc으로 의도를 설명한다.
- `useEffect`는 항상 컴포넌트 맨 밑, `return` 직전에 배치한다.
- JSX props에 인라인 함수를 전달하지 않는다. 컴포넌트 내부에서 `const handleXxx = () => {}` 형태로 선언한 뒤 전달한다.
- 컴포넌트 내부에서 불필요한 `<div>` 중첩을 피한다. 가능한 경우 시맨틱 HTML 태그로 계층을 구분한다.

## 스타일링

- HTML 요소 스타일링은 반드시 Tailwind 클래스를 사용한다.
- inline style은 사용하지 않는다.
- 여러 Tailwind `className`을 조합하거나 조건부로 전달할 때는 template literal 문자열 결합 대신 `cn` 유틸을 사용한다.
- 디자인/스타일링 작업 시 `DESIGN.md`의 토큰, 레이아웃, 컴포넌트 규칙을 따른다.
