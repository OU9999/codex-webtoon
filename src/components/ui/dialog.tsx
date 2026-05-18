import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type * as React from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) => {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-[#16335c]/28 backdrop-blur-[2px]',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
};

const DialogContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => {
  const { t } = useTranslation();

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid max-h-[min(90vh,860px)] w-[min(96vw,1120px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[6px] border border-rim bg-elevated shadow-[0_18px_70px_rgb(22_51_92/0.22)] outline-none',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-3 right-3 grid size-7 place-items-center rounded-[4px] text-fg-muted transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none">
          <X className="size-4" />
          <span className="sr-only">{t('common.close')}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
};

const DialogHeader = ({
  className,
  ...props
}: React.ComponentProps<'header'>) => {
  return (
    <header
      data-slot="dialog-header"
      className={cn(
        'grid gap-1 border-b border-rim-subtle p-4 pr-12',
        className,
      )}
      {...props}
    />
  );
};

const DialogFooter = ({
  className,
  ...props
}: React.ComponentProps<'footer'>) => {
  return (
    <footer
      data-slot="dialog-footer"
      className={cn(
        'flex items-center justify-end gap-2 border-t border-rim-subtle bg-panel/50 p-3',
        className,
      )}
      {...props}
    />
  );
};

const DialogTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-[15px] font-black text-foreground', className)}
      {...props}
    />
  );
};

const DialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-[11px] leading-relaxed text-fg-muted', className)}
      {...props}
    />
  );
};

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
