import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    toast: ({
      title,
      description,
      variant
    }: {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }) => {
      const message = title || '';
      const descriptionText = description || '';
      const fullMessage = descriptionText ? `${message}\n${descriptionText}` : message;

      if (variant === 'destructive') {
        sonnerToast.error(title, {
          description: descriptionText,
        });
      } else {
        sonnerToast(title, {
          description: descriptionText,
        });
      }
    },
  };
}
