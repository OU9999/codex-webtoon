import type {
  ChangeEvent as ReactChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getBubbleClassName } from '@/components/studio/_lib/class-names';
import {
  getBubbleOutlineSvgPath,
  getBubbleTailPoints,
  resolveBubbleStyle,
} from '@/components/studio/_lib/bubble-style';
import type {
  Bubble,
  BubbleDragStartPayload,
  Panel,
} from '@/components/studio/_lib/types';
import { TransformHandles } from './transform-handles';

interface BubbleLayerProps {
  bubble: Bubble;
  canvasHeight: number;
  panel: Panel;
  isEditing: boolean;
  isSelected: boolean;
  onDragStart: (payload: BubbleDragStartPayload) => void;
  onEditEnd: () => void;
  onEditStart: (panelId: string, bubbleId: string) => void;
  onTextChange: (panelId: string, bubbleId: string, text: string) => void;
  isPrimarySelected: boolean;
}

interface BubbleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEditEnd: () => void;
}

const BubbleTextEditor = ({
  value,
  onChange,
  onEditEnd,
}: BubbleTextEditorProps) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleBlur = (): void => {
    onEditEnd();
  };

  const handleChange = (event: ReactChangeEvent<HTMLTextAreaElement>): void => {
    onChange(event.target.value);
  };

  const handleDoubleClick = (
    event: ReactMouseEvent<HTMLTextAreaElement>,
  ): void => {
    event.stopPropagation();
  };

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (event.key !== 'Escape') return;

    event.preventDefault();
    onEditEnd();
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLTextAreaElement>,
  ): void => {
    event.stopPropagation();
  };

  /**
   * Focuses and selects the inline text editor as soon as a bubble enters edit mode.
   */
  useEffect(() => {
    const editor = textareaRef.current;
    if (!editor) return;

    editor.focus();
    editor.select();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      aria-label={t('bubbles.transform.editText')}
      className="bubble-text-editor relative z-20 h-full w-full resize-none border-0 bg-transparent p-0 text-center leading-[1.18] [font-weight:inherit] [text-wrap:balance] [overflow-wrap:anywhere] whitespace-pre-wrap [color:inherit] caret-brand outline-none [font:inherit]"
      value={value}
      onBlur={handleBlur}
      onChange={handleChange}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    />
  );
};

const BubbleLayer = ({
  bubble,
  canvasHeight,
  panel,
  isEditing,
  isPrimarySelected,
  isSelected,
  onDragStart,
  onEditEnd,
  onEditStart,
  onTextChange,
}: BubbleLayerProps) => {
  const style = resolveBubbleStyle(bubble);
  const outlinePath = getBubbleOutlineSvgPath(bubble);
  const tailPoints = getBubbleTailPoints(bubble);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (isEditing) {
      event.stopPropagation();
      return;
    }

    onDragStart({ event, bubble, panel, mode: 'move', canvasHeight });
  };

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  const handleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (isEditing) return;

    onEditStart(panel.id, bubble.id);
  };

  const handleTextChange = (text: string): void => {
    onTextChange(panel.id, bubble.id, text);
  };

  return (
    <section
      className={cn(
        'bubble-layer',
        bubble.type,
        `shape-${style.shape}`,
        `tail-${style.tailSide}`,
        getBubbleClassName(panel, bubble),
        outlinePath && 'has-outline',
        isEditing && 'editing cursor-text',
        isSelected && 'active',
      )}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role={isEditing ? undefined : 'button'}
      tabIndex={isEditing ? -1 : 0}
    >
      {outlinePath && (
        <svg
          className="bubble-outline-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="bubble-outline-shape" d={outlinePath.path} />
          {outlinePath.decorationPath && (
            <path
              className="bubble-outline-decoration"
              d={outlinePath.decorationPath}
            />
          )}
        </svg>
      )}
      {isEditing ? (
        <BubbleTextEditor
          value={bubble.text}
          onChange={handleTextChange}
          onEditEnd={onEditEnd}
        />
      ) : (
        <span>{bubble.text}</span>
      )}
      {isSelected && !isEditing && (
        <TransformHandles
          bubble={bubble}
          canvasHeight={canvasHeight}
          panel={panel}
          hasTailTip={Boolean(tailPoints)}
          isPrimarySelected={isPrimarySelected}
          onDragStart={onDragStart}
        />
      )}
    </section>
  );
};

export { BubbleLayer };
