import type { ComponentProps } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PromptTextareaProps extends ComponentProps<typeof Textarea> {}

const PromptTextarea = ({ className, ...props }: PromptTextareaProps) => {
  return (
    <Textarea
      className={cn(
        className,
        'resize-y bg-background font-mono text-[10.5px] leading-[1.45] md:text-[10.5px] dark:bg-background',
      )}
      {...props}
    />
  );
};

export { PromptTextarea };
