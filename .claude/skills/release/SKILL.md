---
name: release
description: npm 릴리스 운영. develop을 실질 메인 브랜치로 두고 release 브랜치에 선택 커밋을 cherry-pick한 뒤, 수동 트리거로 검증·publish·tag를 진행할 때 사용한다. 브랜치 전략, npm publish, release tag, GitHub 공개/메타데이터, 수동 GitHub Actions 배포 흐름을 정리하거나 실행할 때 사용한다.
---

# Release

## 원칙

- `develop`을 실질적인 메인 브랜치로 본다.
- `release`는 npm 배포 후보 커밋만 모으는 장기 브랜치로 본다.
- 배포는 자동 push 트리거가 아니라 명시 수동 실행으로만 진행한다.
- npm에 publish된 커밋과 `vX.Y.Z` git tag는 반드시 같아야 한다.
- `pnpm`을 사용한다. `npm` CLI는 인증 확인, registry 조회처럼 npm 계정/registry 작업에만 사용한다.
- 실제 `publish`, tag 생성, 원격 push, GitHub repo public 전환은 사용자 명시 승인 없이 실행하지 않는다.

## 먼저 확인

작업 시작 시 다음을 확인한다.

```bash
git status --short
git branch --show-current
git remote -v
git tag --list 'v*'
PATH=/opt/homebrew/bin:$PATH pnpm -v
PATH=/opt/homebrew/bin:$PATH npm whoami
```

`git status --short`가 비어 있지 않으면 변경 파일을 읽고, 릴리스 작업과 무관한 변경을 건드리지 않는다. 브랜치 이동, cherry-pick, publish 전에 dirty worktree의 처리 방침을 분명히 한다.

## 릴리스 브랜치 구성

사용자가 배포할 커밋을 지정하지 않았으면 `develop`과 `release`의 차이를 먼저 보여주고, 배포할 커밋 후보를 제안한다.

```bash
git fetch origin
git log --oneline --decorate release..develop
```

선택된 커밋만 `release`에 반영한다.

```bash
git checkout release
git cherry-pick <commit-sha>
```

merge commit cherry-pick, 충돌 해결, version bump, release-only 수정은 위험도가 높다. 필요한 이유와 결과 파일을 설명한 뒤 진행한다.

## 배포 전 메타데이터

첫 공개 배포 전에는 GitHub repo 공개 여부와 npm 페이지 메타데이터를 확인한다.

- `package.json`의 `name`, `version`, `description`, `license`, `bin`, `files`
- 가능하면 `repository`, `bugs`, `homepage`
- README의 사용자 실행 예시가 `npx webtoon-panel-studio@latest` 기준인지
- 공개 repo 전환을 먼저 할지, npm publish 후 공개할지

repo가 private이어도 npm publish는 가능하다. 다만 공개 패키지라면 publish 전에 repo를 public으로 전환하고 메타데이터를 넣는 흐름을 우선 제안한다.

## 검증

`release` 브랜치 HEAD에서 실행한다.

```bash
PATH=/opt/homebrew/bin:$PATH pnpm prepublishOnly
PATH=/opt/homebrew/bin:$PATH pnpm audit --prod
PATH=/opt/homebrew/bin:$PATH pnpm publish --dry-run --no-git-checks --access public
```

필요하면 tarball 설치 스모크까지 수행한다.

```bash
PACK_DIR=$(mktemp -d /tmp/wps-pack.XXXXXX)
PATH=/opt/homebrew/bin:$PATH pnpm pack --pack-destination "$PACK_DIR"
```

tarball 설치 스모크에서는 임시 프로젝트와 임시 config/projects 경로를 사용한다. 사용자의 실제 설정이나 프로젝트 데이터를 건드리지 않는다.

## npm Registry 확인

버전 충돌을 확인한다.

```bash
PACKAGE_NAME=$(PATH=/opt/homebrew/bin:$PATH node -p "require('./package.json').name")
PACKAGE_VERSION=$(PATH=/opt/homebrew/bin:$PATH node -p "require('./package.json').version")
PATH=/opt/homebrew/bin:$PATH npm view "$PACKAGE_NAME" versions --json
git tag --list "v$PACKAGE_VERSION"
```

첫 publish 전 `npm view`가 `E404`이면 해당 공개 패키지가 아직 없다는 1차 신호다. 기존 패키지가 있으면 현재 `package.json` 버전이 registry에 이미 존재하지 않는지 확인한다.

## 실제 Publish

사용자가 명시 승인한 경우에만 실행한다.

```bash
PATH=/opt/homebrew/bin:$PATH pnpm publish --access public
```

2FA OTP가 필요하면 사용자가 직접 입력하게 한다. 비밀번호, OTP, recovery code를 채팅으로 요청하지 않는다.

publish 성공 후 같은 커밋에 annotated tag를 만든다.

```bash
PACKAGE_VERSION=$(PATH=/opt/homebrew/bin:$PATH node -p "require('./package.json').version")
git tag -a "v$PACKAGE_VERSION" -m "Release v$PACKAGE_VERSION"
git push origin release "v$PACKAGE_VERSION"
```

tag는 publish 성공 후에 생성한다. publish가 실패하면 tag를 만들지 않는다.

## GitHub Actions 기준

수동 배포 워크플로우만 제안한다.

```yaml
on:
  workflow_dispatch:
```

`release` push만으로 자동 publish되는 설정은 만들지 않는다.

```yaml
on:
  push:
    branches: [release]
```

위 형태는 사용자가 명시적으로 자동 배포를 원할 때만 사용한다.

## 마무리 기록

릴리스 작업을 끝내면 다음을 요약한다.

- publish 여부와 배포 버전
- publish된 commit SHA와 tag
- 실행한 검증 명령과 결과
- 남은 수동 작업

작업 청크 종료 시 진행 기록이 필요하면 `progress-log` 스킬을 사용해 `.progress/YYMMDD/<topic>.md`에 남긴다.
