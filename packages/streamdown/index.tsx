'use client';

import type { ComponentProps } from 'react';
import { memo, useId, useMemo } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { BundledTheme } from 'shiki';
import 'katex/dist/katex.min.css';
import hardenReactMarkdownImport from 'harden-react-markdown';
import { components as defaultComponents, createComponents } from './lib/components';
import { parseMarkdownIntoBlocks } from './lib/parse-blocks';
import { parseIncompleteMarkdown } from './lib/parse-incomplete-markdown';
import { cn } from './lib/utils';

type HardenReactMarkdownProps = Options & {
  defaultOrigin?: string;
  allowedLinkPrefixes?: string[];
  allowedImagePrefixes?: string[];
};

// Handle both ESM and CJS imports
const hardenReactMarkdown =
  (hardenReactMarkdownImport as any).default || hardenReactMarkdownImport;

// Create a hardened version of ReactMarkdown
const HardenedMarkdown: ReturnType<typeof hardenReactMarkdown> =
  hardenReactMarkdown(ReactMarkdown);

export type StreamdownProps = HardenReactMarkdownProps & {
  parseIncompleteMarkdown?: boolean;
  className?: string;
  theme?: BundledTheme;
};

type BlockProps = HardenReactMarkdownProps & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
};

const Block = memo(
  ({ content, shouldParseIncompleteMarkdown, ...props }: BlockProps) => {
    const parsedContent = useMemo(
      () =>
        typeof content === 'string' && shouldParseIncompleteMarkdown
          ? parseIncompleteMarkdown(content.trim())
          : content,
      [content, shouldParseIncompleteMarkdown]
    );

    return <HardenedMarkdown {...props}>{parsedContent}</HardenedMarkdown>;
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

export const Streamdown = memo(
  ({
    children,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    components,
    rehypePlugins,
    remarkPlugins,
    className,
    theme = 'github-light',
    ...props
  }: StreamdownProps) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const generatedId = useId();
    const blocks = useMemo(
      () =>
        parseMarkdownIntoBlocks(typeof children === 'string' ? children : ''),
      [children]
    );

    const themedComponents = useMemo(() => createComponents(theme), [theme]);

    return (
      <div className={cn('space-y-4', className)} {...props}>
        {blocks.map((block, index) => (
          <Block
            allowedImagePrefixes={allowedImagePrefixes ?? ['*']}
            allowedLinkPrefixes={allowedLinkPrefixes ?? ['*']}
            components={{
              ...themedComponents,
              ...components,
            }}
            content={block}
            defaultOrigin={defaultOrigin}
            // biome-ignore lint/suspicious/noArrayIndexKey: "required"
            key={`${generatedId}-block_${index}`}
            rehypePlugins={[rehypeKatex, ...(rehypePlugins ?? [])]}
            remarkPlugins={[remarkGfm, remarkMath, ...(remarkPlugins ?? [])]}
            shouldParseIncompleteMarkdown={shouldParseIncompleteMarkdown}
          />
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
Streamdown.displayName = 'Streamdown';

export default Streamdown;
export { createComponents } from './lib/components';
export { CodeBlock, CodeBlockCopyButton, highlightCode } from './lib/code-block';
