# PR 사전 검사 체크리스트

PR 제목과 본문을 만들기 전에 이 체크리스트를 작성한다.

## 검사 대상 확인

```bash
git diff --name-status --find-renames origin/main...HEAD -- CLAUDE.md AGENTS.md .claude .agents
```

`origin/main`을 사용할 수 없는 경우:

```bash
git diff --name-status --find-renames main...HEAD -- CLAUDE.md AGENTS.md .claude .agents
```

## 필수 체크리스트

- [ ] `CLAUDE.md`의 프로젝트 환경, 코드 작성 규칙, 커밋 & PR 규칙에 맞게 작업했는지 확인
- [ ] `AGENTS.md`의 프로젝트 환경, 코드 작성 규칙, 커밋 & PR 규칙에 맞게 작업했는지 확인
- [ ] `CLAUDE.md`와 `AGENTS.md`의 규칙이 서로 충돌하지 않는지 확인
- [ ] `.claude/skills/<name>` 스킬을 추가, 삭제, 이름 변경했다면 대응되는 `.agents/skills/<name>` wrapper도 함께 반영했는지 확인
- [ ] `.agents/skills/<name>` wrapper를 추가, 삭제, 이름 변경했다면 대응되는 `.claude/skills/<name>` source skill이 있는지 확인
- [ ] `.claude` 또는 `.agents` 둘 중 한 곳에만 스킬 변경이 있는 경우, 의도된 예외인지 확인하고 PR 미리보기에 사유 작성

## 중단 조건

- `CLAUDE.md` 또는 `AGENTS.md` 규칙 위반이 확인되면 PR 생성 전 수정
- 스킬이 한쪽에만 추가된 상태이고 명확한 예외 사유가 없으면 PR 생성 전 수정
