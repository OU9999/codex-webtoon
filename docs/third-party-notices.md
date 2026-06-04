# Third-party Notices

**EN** | [KR](./third-party-notices.kr.md)

This notice highlights third-party runtime components with important license or
product-status implications. It is informational only and is not legal advice.

## openai-oauth

- Package: `openai-oauth`
- Declared dependency: `^1.0.2`; current lockfile resolves `1.0.2`
- Upstream: <https://github.com/EvanZhouDev/openai-oauth>
- License: AGPL-3.0-only
  (<https://spdx.org/licenses/AGPL-3.0-only.html>)
- Role in codex-webtoon: local OAuth proxy used for image generation requests
- Status: third-party project; not an official OpenAI product, SDK, API
  endpoint, or supported OpenAI API path

When image generation is used, codex-webtoon sends prompt text and any selected
reference image data to `openai-oauth` on localhost. That proxy forwards the
request to external model services using the user's Codex OAuth session.
Project JSON files, candidate metadata, generated images, and exports are
stored on the user's local disk.

## codex-webtoon license

codex-webtoon is distributed under the MIT License. See [LICENSE](../LICENSE).
This project license does not replace or relicense third-party dependencies.
