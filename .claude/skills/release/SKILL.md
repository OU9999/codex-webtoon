---
name: release
description: npm 릴리스 운영. release 브랜치 선택 커밋 반영, 수동 검증, publish, tag, GitHub 메타데이터 정리
---

# Release

## 원칙

- `develop`은 실질 메인 브랜치 기준
- `release`는 npm 배포 후보 커밋만 모으는 장기 브랜치 기준
- 자동 push 트리거 대신 명시 수동 배포
- npm publish 커밋과 `vX.Y.Z` git tag 일치 필수
- `pnpm` 사용
- `npm` CLI는 인증 확인, registry 조회 같은 npm 계정/registry 작업에만 사용
- 사용자 명시 승인 없는 실제 `publish`, tag 생성, 원격 push, GitHub repo public 전환 금지

## 먼저 확인

작업 시작 시 다음 확인.

```bash
git status --short
git branch --show-current
git remote -v
git tag --list 'v*'
PATH=/opt/homebrew/bin:$PATH pnpm -v
PATH=/opt/homebrew/bin:$PATH npm whoami
```

`git status --short`가 비어 있지 않으면 변경 파일 확인. 릴리스 작업과 무관한 변경은 제외. 브랜치 이동, cherry-pick, publish 전 dirty worktree 처리 방침 명확화.

## 릴리스 브랜치 구성

배포 커밋 미지정 시 `develop`과 `release` 차이 제시 후 배포 커밋 후보 제안.

```bash
git fetch origin
git log --oneline --decorate release..develop
```

선택된 커밋만 `release`에 반영.

```bash
git checkout release
git cherry-pick <commit-sha>
```

merge commit cherry-pick, 충돌 해결, version bump, release-only 수정은 높은 위험도. 필요한 이유와 결과 파일 설명 후 진행.

## 배포 전 메타데이터

첫 공개 배포 전 GitHub repo 공개 여부와 npm 페이지 메타데이터 확인.

- `package.json`의 `name`, `version`, `description`, `license`, `bin`, `files`
- 가능하면 `repository`, `bugs`, `homepage`
- README의 사용자 실행 예시가 `pnpm dlx codex-webtoon` 기준인지
- 공개 repo 전환을 먼저 할지, npm publish 후 공개할지

private repo에서도 npm publish 가능. 공개 패키지는 publish 전 repo public 전환과 메타데이터 입력 흐름 우선 제안.

## 검증

`release` 브랜치 HEAD에서 실행.

```bash
PATH=/opt/homebrew/bin:$PATH pnpm prepublishOnly
PATH=/opt/homebrew/bin:$PATH pnpm audit --prod
PATH=/opt/homebrew/bin:$PATH pnpm publish --dry-run --no-git-checks --access public
```

필요 시 tarball 설치 스모크까지 수행.

```bash
PACK_DIR=$(mktemp -d /tmp/codex-webtoon-pack.XXXXXX)
PATH=/opt/homebrew/bin:$PATH pnpm pack --pack-destination "$PACK_DIR"
```

tarball 설치 스모크에서는 임시 프로젝트와 임시 config/projects 경로 사용. 사용자 실제 설정이나 프로젝트 데이터 변경 금지.

## npm Registry 확인

버전 충돌 확인.

```bash
PACKAGE_NAME=$(PATH=/opt/homebrew/bin:$PATH node -p "require('./package.json').name")
PACKAGE_VERSION=$(PATH=/opt/homebrew/bin:$PATH node -p "require('./package.json').version")
PATH=/opt/homebrew/bin:$PATH npm view "$PACKAGE_NAME" versions --json
git tag --list "v$PACKAGE_VERSION"
```

첫 publish 전 `npm view`의 `E404`는 공개 패키지 부재 1차 신호. 기존 패키지가 있으면 현재 `package.json` 버전의 registry 중복 여부 확인.

## 실제 Publish

사용자 명시 승인 시에만 실행.

```bash
PATH=/opt/homebrew/bin:$PATH pnpm publish --access public
```

2FA OTP 필요 시 사용자 직접 입력. 비밀번호, OTP, recovery code 채팅 요청 금지.

publish 성공 후 같은 커밋에 annotated tag 생성.

```bash
PACKAGE_VERSION=$(PATH=/opt/homebrew/bin:$PATH node -p "require('./package.json').version")
git tag -a "v$PACKAGE_VERSION" -m "Release v$PACKAGE_VERSION"
git push origin release "v$PACKAGE_VERSION"
```

tag는 publish 성공 후 생성. publish 실패 시 tag 생성 금지.

## GitHub Actions 기준

수동 배포 워크플로우만 제안.

```yaml
on:
  workflow_dispatch:
```

`release` push만으로 자동 publish되는 설정 작성 금지.

```yaml
on:
  push:
    branches: [release]
```

위 형태는 사용자 명시적 자동 배포 요청 시에만 사용.

## 마무리 기록

릴리스 작업 종료 후 다음 요약.

- publish 여부와 배포 버전
- publish된 commit SHA와 tag
- 실행한 검증 명령과 결과
- 남은 수동 작업

작업 청크 종료 시 진행 기록이 필요하면 `progress-log` 스킬로 `.progress/YYMMDD/<topic>.md` 기록.
