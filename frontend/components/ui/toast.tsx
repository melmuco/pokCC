'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-lg border text-sm object-fit bg-background p-3 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border-border',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

export function Toast({ className, variant, action, children, ...props }: ToastProps) {
  return (
    <div
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {children}
      {action}
      <button
        className="absolute right-2 top-2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => {}}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ToastViewport() {
  return (
    <div className="fixed bottom-0 z-50 flex w-full flex-col items-end p-4">
      <ToastProvider>
        <div id="toast-container" />
      </ToastProvider>
    </div>
  );
}
