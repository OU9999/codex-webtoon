import { WEBTOON_CANVAS_WIDTH } from '@shared/project-state';

const CANVAS_WIDTH = WEBTOON_CANVAS_WIDTH;
const CANVAS_CONNECTOR_HEIGHT = 56;
const DYNAMIC_STYLE_ELEMENT_ID = 'webtoon-panel-studio-dynamic-styles';
const MAX_REFERENCE_IMAGES = 4;

const defaultCommonPrompt = [
  '현대 한국 로맨스 웹툰, 부드러운 선화, 세미 리얼 캐릭터, 따뜻하지만 선명한 색감.',
  '캐릭터: 민지, 20대 초반 여성, 짧은 흑발 단발, 베이지 니트, 차분하지만 예민한 표정.',
  '공통 금지사항: 이미지 안에 읽을 수 있는 텍스트, 말풍선, 워터마크를 만들지 말 것.',
].join('\n');

export {
  CANVAS_CONNECTOR_HEIGHT,
  CANVAS_WIDTH,
  defaultCommonPrompt,
  DYNAMIC_STYLE_ELEMENT_ID,
  MAX_REFERENCE_IMAGES,
};
