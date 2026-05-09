import { useEffect, useRef } from 'react';
import { DYNAMIC_STYLE_ELEMENT_ID } from '../_lib/constants';
import { buildDynamicStyles } from '../_lib/dynamic-styles';
import type { StudioState } from '../_lib/types';

const useDynamicStyles = (state: StudioState): void => {
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const dynamicStyles = buildDynamicStyles(state);

  /**
   * Synchronizes dynamic panel and bubble layout CSS without using JSX inline style props.
   */
  useEffect(() => {
    if (!styleElementRef.current) {
      const existingElement = document.getElementById(DYNAMIC_STYLE_ELEMENT_ID);
      if (existingElement instanceof HTMLStyleElement) {
        styleElementRef.current = existingElement;
      } else {
        const styleElement = document.createElement('style');
        styleElement.id = DYNAMIC_STYLE_ELEMENT_ID;
        document.head.appendChild(styleElement);
        styleElementRef.current = styleElement;
      }
    }

    styleElementRef.current.textContent = dynamicStyles;
  }, [dynamicStyles]);
};

export { useDynamicStyles };
