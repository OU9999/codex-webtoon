# 제3자 고지

[EN](./third-party-notices.md) | **KR**

이 문서는 라이선스 또는 제품 지위 측면에서 중요한 제3자 런타임 구성요소를
고지합니다. 정보 제공 목적이며 법률 자문이 아닙니다.

## openai-oauth

- 패키지: `openai-oauth`
- 선언된 의존성: `^1.0.2`; 현재 lockfile 해석 버전은 `1.0.2`
- 업스트림: <https://github.com/EvanZhouDev/openai-oauth>
- 라이선스: AGPL-3.0-only
  (<https://spdx.org/licenses/AGPL-3.0-only.html>)
- codex-webtoon에서의 역할: 이미지 생성 요청에 사용하는 로컬 OAuth 프록시
- 지위: 제3자 프로젝트이며 OpenAI 공식 제품, SDK, API endpoint 또는 지원되는
  OpenAI 공식 API 경로가 아님

이미지 생성을 사용할 때 codex-webtoon은 prompt 텍스트와 선택된 reference image
data를 localhost의 `openai-oauth`로 보냅니다. 이 proxy는 사용자의 Codex OAuth
세션을 사용해 외부 모델 서비스로 요청을 전달합니다. 프로젝트 JSON 파일,
candidate metadata, 생성 이미지, export 파일은 사용자의 로컬 디스크에
저장됩니다.

## codex-webtoon 라이선스

codex-webtoon은 MIT License로 배포됩니다. [LICENSE](../LICENSE)를 참조하세요.
이 프로젝트 라이선스는 제3자 의존성의 라이선스를 대체하거나 재라이선스하지
않습니다.
