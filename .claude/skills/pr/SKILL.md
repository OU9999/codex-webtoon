---
description: "PR 생성 - 변경사항 분석 후 자동 생성"
allowed-tools: ["Bash", "Read", "Grep", "AskUserQuestion"]
---

# PR 생성 Skill

현재 브랜치의 변경사항을 분석하여 PR을 생성합니다.

## 실행 순서

### 1. 변경 내용 분석

먼저 PR 생성 가능 상태인지 확인하세요:

```bash
git status --short
git branch --show-current
git fetch origin main --prune
```

**중단 조건:**

- working tree가 깨끗하지 않으면 중단하고, 커밋 또는 스태시 후 다시 실행하도록 안내
- 현재 브랜치가 `main`이면 중단
- `git fetch origin main --prune` 실패 시 원격 기준 검사가 불완전하다는 점을 사용자에게 알리고 진행 여부 확인
- 기준 브랜치 대비 커밋이 0개이면 PR 생성할 변경사항이 없으므로 중단

기준 브랜치는 `origin/main`을 우선 사용하고, 불가능한 경우에만 로컬 `main`을 사용하세요:

```bash
git log --oneline origin/main..HEAD
git log --name-status --find-renames --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff --name-status --find-renames origin/main...HEAD
```

`origin/main`을 사용할 수 없는 경우:

```bash
git log --oneline main..HEAD
git log --name-status --find-renames --oneline main..HEAD
git diff --stat main...HEAD
git diff --name-status --find-renames main...HEAD
```

**주의:** `git diff main..HEAD` 또는 `git diff origin/main..HEAD`는 사용하지 마세요!

- `A..B` 형태의 `git diff`는 PR 기준 diff가 아니라 A와 B의 직접 비교입니다.
- base 브랜치에만 있는 변경사항이 이 브랜치에서 삭제된 것처럼 보일 수 있습니다.
- 실제 PR diff 확인은 반드시 `origin/main...HEAD`처럼 triple-dot을 사용하세요.
- 커밋 기반 변경 파일 확인은 `git log --name-status --find-renames origin/main..HEAD`를 사용하세요.

### 2. 사전 검사 체크리스트

PR 제목과 본문을 만들기 전에 `.claude/skills/pr/check-list.md`를 읽고 체크리스트를 작성하세요.

체크리스트에서 중단 조건에 해당하는 항목이 있으면 PR 생성 전 먼저 수정하세요.

### 3. PR 제목 생성

변경 내용을 분석하여 다음 형식으로 제목을 생성하세요:

- `feat: 새로운 기능 설명` - 새 기능 추가
- `fix: 버그 수정 설명` - 버그 수정
- `refactor: 리팩토링 설명` - 코드 리팩토링
- `style: 스타일 변경 설명` - UI/스타일 변경
- `chore: 작업 설명` - 설정, 빌드 등
- `docs: 문서 변경 설명` - 문서 수정
- `agent: 에이전트, 클로드, ai 관련 설정` - 에이전트 설정

### 4. PR 본문 생성

다음 형식으로 PR 본문을 생성하세요:

```markdown
## 요약

- 주요 변경사항 1
- 주요 변경사항 2

### 변경사항 1 제목

- 세부 설명

### 변경사항 2 제목

- 세부 설명
```

**본문 작성 규칙:**

1. 요약 항목은 주요 변경사항 단위로 그룹화
2. 로직의 핵심 흐름만 간단히 설명
3. 함수명, 변수명 등 구체적인 코드 명칭은 포함하지 않음
4. 파일 경로나 파일 이름은 포함하지 않음
5. 각 설명은 1~2문장으로 간결하게 작성
6. "~함", "~추가", "~구현" 같은 간결한 문체 사용

### 5. 라벨 결정

제목의 prefix에 따라 라벨을 결정하세요:

| Prefix     | Label         | 설명            |
| ---------- | ------------- | --------------- |
| feat       | feat          | 새로운 기능     |
| fix        | fix           | 코드 수정       |
| fix (버그) | bug           | 버그 수정       |
| refactor   | refactoring   | 코드 리팩토링   |
| perf       | performance   | 성능 개선       |
| docs       | documentation | 문서 작업       |
| test       | test          | 테스트          |
| chore      | development   | 개발 환경 구성  |
| ci         | CI/CD         | 파이프라인      |
| deps       | dependencies  | 의존성 업데이트 |
| security   | security      | 보안 관련       |
| remove     | remove        | 기능 제거       |
| agent      | agent         | 에이전트 설정   |

### 6. PR 내용 확인 (필수)

PR을 생성하기 전에 **반드시** 사용자에게 다음 내용을 보여주고 확인을 받으세요:

```
PR 미리보기
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

제목: [생성한 제목]

본문:
[생성한 본문 내용]

라벨: [결정한 라벨들]
Base: main

사전 검사:
- CLAUDE.md 준수: [확인/수정 필요/해당 없음]
- AGENTS.md 준수: [확인/수정 필요/해당 없음]
- Claude/Codex 스킬 동기화: [확인/수정 필요/해당 없음]
- 예외 사유: [없음 또는 사유]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

AskUserQuestion 도구를 사용하여 확인을 받으세요.

**중요:** 사용자가 승인하기 전까지 절대로 PR을 생성하지 마세요.

### 7. PR 생성

사용자가 승인한 경우에만 gh CLI를 사용하여 PR을 생성하세요:

```bash
gh pr create \
  --title "feat: 기능 설명" \
  --body "$(cat <<'EOF'
## 요약

- 내용

EOF
)" \
  --assignee @me \
  --label "라벨" \
  --base main
```

**중요:** body는 반드시 HEREDOC을 사용하세요.

### 8. 결과 출력

PR 생성 후 URL을 사용자에게 알려주세요.
