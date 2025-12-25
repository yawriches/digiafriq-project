import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  onClose
}) => {
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 w-96 rounded-lg border p-4 shadow-lg transition-all duration-300',
        variant === 'destructive'
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-green-200 bg-green-50 text-green-900'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {variant === 'destructive' ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-semibold text-sm mb-1">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onClose(id)}
          className="flex-shrink-0 h-6 w-6 p-0 hover:bg-transparent"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }>;
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={onClose}
        />
      ))}
    </div>
  );
};
