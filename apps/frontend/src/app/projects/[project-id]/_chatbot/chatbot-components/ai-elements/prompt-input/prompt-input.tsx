'use client';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/prompt-input/input-group';
import { ChatbotContextUsage } from '@/app/projects/[project-id]/_chatbot/chatbot-components/ChatbotContextUsage';
import { cn } from '@/lib/utils';
import { CornerDownLeftIcon, Loader2Icon, SquareIcon } from 'lucide-react';
import type { ChatMode } from 'api-types';

export type ChatStatus = 'idle' | 'submitting' | 'streaming' | 'submitted';
import {
  type ChangeEvent,
  Children,
  type ComponentProps,
  createContext,
  type FormEvent,
  type FormEventHandler,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type PropsWithChildren,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// ============================================================================
// Provider Context & Types
// ============================================================================

export type TextInputContext = {
  value: string;
  setInput: (v: string) => void;
  clear: () => void;
};

export type PromptInputControllerProps = {
  textInput: TextInputContext;
};

const PromptInputController = createContext<PromptInputControllerProps | null>(null);

export const usePromptInputController = () => {
  const ctx = useContext(PromptInputController);
  if (!ctx) {
    throw new Error('Wrap your component inside <PromptInputProvider> to use usePromptInputController().');
  }
  return ctx;
};

// Optional variants (do NOT throw). Useful for dual-mode components.
const useOptionalPromptInputController = () => useContext(PromptInputController);

export type PromptInputProviderProps = PropsWithChildren<{
  initialInput?: string;
}>;

/**
 * Optional global provider that lifts PromptInput state outside of PromptInput.
 * If you don't use it, PromptInput stays fully self-managed.
 */
export function PromptInputProvider({ initialInput: initialTextInput = '', children }: PromptInputProviderProps) {
  // ----- textInput state
  const [textInput, setTextInput] = useState(initialTextInput);
  const clearInput = useCallback(() => setTextInput(''), []);

  const controller = useMemo<PromptInputControllerProps>(
    () => ({
      textInput: {
        value: textInput,
        setInput: setTextInput,
        clear: clearInput,
      },
    }),
    [textInput, clearInput],
  );

  return <PromptInputController.Provider value={controller}>{children}</PromptInputController.Provider>;
}

// ============================================================================
// Component Context & Hooks
// ============================================================================

export type PromptInputMessage = {
  text: string;
};

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onError'> & {
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export const PromptInput = ({ className, onSubmit, children, ...props }: PromptInputProps) => {
  const controller = useOptionalPromptInputController();
  const usingProvider = !!controller;

  const anchorRef = useRef<HTMLSpanElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const root = anchorRef.current?.closest('form');
    if (root instanceof HTMLFormElement) {
      formRef.current = root;
    }
  }, []);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const text = usingProvider
      ? controller.textInput.value
      : (() => {
          const formData = new FormData(form);
          return (formData.get('message') as string) || '';
        })();

    if (!usingProvider) {
      form.reset();
    }

    try {
      const result = onSubmit({ text }, event);

      if (result instanceof Promise) {
        result
          .then(() => {
            if (usingProvider) {
              controller.textInput.clear();
            }
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        if (usingProvider) {
          controller.textInput.clear();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <span aria-hidden="true" className="hidden" ref={anchorRef} />
      <form className={cn('w-full', className)} onSubmit={handleSubmit} {...props}>
        <InputGroup className="overflow-hidden">{children}</InputGroup>
      </form>
    </>
  );
};

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputBody = ({ className, ...props }: PromptInputBodyProps) => (
  <div className={cn('contents', className)} {...props} />
);

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>;

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = 'What would you like to know?',
  ...props
}: PromptInputTextareaProps) => {
  const controller = useOptionalPromptInputController();
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      if (isComposing || e.nativeEvent.isComposing) {
        return;
      }
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();

      // Check if the submit button is disabled before submitting
      const form = e.currentTarget.form;
      const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (submitButton?.disabled) {
        return;
      }

      form?.requestSubmit();
    }
  };

  const controlledProps = controller
    ? {
        value: controller.textInput.value,
        onChange: (e: ChangeEvent<HTMLTextAreaElement>) => {
          controller.textInput.setInput(e.currentTarget.value);
          onChange?.(e);
        },
      }
    : {
        onChange,
      };

  return (
    <InputGroupTextarea
      className={cn('field-sizing-content max-h-48 min-h-16', className)}
      name="message"
      onCompositionEnd={() => setIsComposing(false)}
      onCompositionStart={() => setIsComposing(true)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
      {...controlledProps}
    />
  );
};

export type PromptInputHeaderProps = Omit<ComponentProps<typeof InputGroupAddon>, 'align'>;

export const PromptInputHeader = ({ className, ...props }: PromptInputHeaderProps) => (
  <InputGroupAddon align="block-end" className={cn('order-first flex-wrap gap-1', className)} {...props} />
);

export type PromptInputFooterProps = Omit<ComponentProps<typeof InputGroupAddon>, 'align'>;

const isChatMode = (value: unknown): value is ChatMode =>
  value === 'fast' || value === 'normal' || value === 'smart' || value === 'pro';

export const PromptInputFooter = ({ className, children, ...props }: PromptInputFooterProps) => {
  const childArray = Children.toArray(children).filter((child) => (typeof child === 'string' ? child.trim() : true));

  if (childArray.length < 2) {
    return (
      <InputGroupAddon align="block-end" className={cn('justify-between gap-1', className)} {...props}>
        {children}
      </InputGroupAddon>
    );
  }

  const submitButton = childArray.at(-1);
  const tools = childArray.slice(0, -1);
  const mode = tools.find((tool) => {
    if (!isValidElement(tool)) {
      return false;
    }

    const toolMode = (tool.props as { mode?: unknown }).mode;
    return isChatMode(toolMode);
  });
  const selectedMode = isValidElement(mode) ? ((mode.props as { mode?: unknown }).mode as ChatMode) : undefined;

  return (
    <InputGroupAddon align="block-end" className={cn('justify-between gap-1', className)} {...props}>
      <PromptInputTools className="gap-2">
        {tools}
        <ChatbotContextUsage mode={selectedMode} />
      </PromptInputTools>
      {submitButton}
    </InputGroupAddon>
  );
};

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({ className, ...props }: PromptInputToolsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props} />
);

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton>;

export const PromptInputButton = ({ variant = 'ghost', className, size, ...props }: PromptInputButtonProps) => {
  const newSize = size ?? (Children.count(props.children) > 1 ? 'sm' : 'icon-sm');

  return <InputGroupButton className={cn(className)} size={newSize} type="button" variant={variant} {...props} />;
};

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
  onStop?: () => void | Promise<void>;
  isStopping?: boolean;
};

export const PromptInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon-sm',
  status,
  onStop,
  isStopping = false,
  children,
  onClick,
  disabled,
  ...props
}: PromptInputSubmitProps) => {
  const isStreaming = status === 'streaming';
  const isSubmitted = status === 'submitted';
  let Icon = <CornerDownLeftIcon className="size-4" />;

  if (isSubmitted || (isStreaming && isStopping)) {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (isStreaming) {
    Icon = <SquareIcon className="size-4" />;
  }

  const handleClick: NonNullable<ComponentProps<typeof InputGroupButton>['onClick']> = (event) => {
    if (isStreaming) {
      event.preventDefault();
      if (onStop) {
        void onStop();
        return;
      }
    }

    onClick?.(event);
  };

  return (
    <InputGroupButton
      aria-label={isStreaming ? 'Stop response' : 'Submit'}
      className={cn(className)}
      size={size}
      type={isStreaming ? 'button' : 'submit'}
      variant={variant}
      disabled={disabled || (isStreaming && isStopping)}
      onClick={handleClick}
      {...props}
    >
      {children ?? Icon}
    </InputGroupButton>
  );
};
