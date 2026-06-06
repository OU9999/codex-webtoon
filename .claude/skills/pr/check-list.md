# PR 사전 검사 체크리스트

PR 제목과 본문 작성 전 체크리스트 작성.

## 검사 대상 확인

```bash
git diff --name-status --find-renames origin/main...HEAD -- CLAUDE.md AGENTS.md .claude .agents
```

`origin/main`을 사용할 수 없는 경우:

```bash
git diff --name-status --find-renames main...HEAD -- CLAUDE.md AGENTS.md .claude .agents
```

## 필수 체크리스트

- [ ] `CLAUDE.md`의 프로젝트 환경, 코드 작성 규칙, 커밋 & PR 규칙 준수 여부
- [ ] `AGENTS.md`의 프로젝트 환경, 코드 작성 규칙, 커밋 & PR 규칙 준수 여부
- [ ] `CLAUDE.md`와 `AGENTS.md`의 규칙 충돌 여부
- [ ] `.claude/skills/<name>` 스킬 추가, 삭제, 이름 변경 시 대응 `.agents/skills/<name>` wrapper 반영 여부
- [ ] `.agents/skills/<name>` wrapper 추가, 삭제, 이름 변경 시 대응 `.claude/skills/<name>` source skill 존재 여부
- [ ] `.claude` 또는 `.agents` 한쪽만 스킬 변경 시 의도된 예외 여부와 PR 미리보기 사유 작성 여부

## 중단 조건

- `CLAUDE.md` 또는 `AGENTS.md` 규칙 위반 확인 시 PR 생성 전 수정
- 스킬 한쪽 추가 상태와 명확한 예외 사유 부재 시 PR 생성 전 수정
