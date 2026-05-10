---
name: progress-log
description: 작업 진행 상황을 .progress/날짜/주제.md 로 기록합니다. 작업 청크 종료 시점에 사용합니다.
---

# Progress Log

이 Codex 스킬은 `.claude/skills/progress-log/SKILL.md`를 감싸는 래퍼이며, 실제 기준 워크플로우는 해당 파일에 있습니다.

호출되면 다음 순서로 동작합니다.
1. 먼저 `.claude/skills/progress-log/SKILL.md`를 읽습니다.
2. 인자($ARGUMENTS)가 있으면 주제 슬러그로 사용하고, 없으면 대화 컨텍스트에서 핵심 주제를 1-3 단어 kebab-case로 추론합니다.
3. `date +%y%m%d`로 날짜를 구해 `.progress/YYMMDD/<주제>.md` 경로를 결정합니다.
4. 파일이 이미 존재하면 Edit으로 갱신, 없으면 Write로 신규 생성합니다.
5. 이 저장소의 `AGENTS.md` 규칙을 따르고 패키지 매니저는 `pnpm`을 사용합니다.
