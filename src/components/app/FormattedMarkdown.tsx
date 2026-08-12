import React from "react";

interface FormattedMarkdownProps {
  content: string;
}

export function FormattedMarkdown({ content }: FormattedMarkdownProps) {
  if (!content) return null;

  // 1. Preprocess: clean up unwanted patterns like artificial "Answer:" prefixes or leading double-bolding
  let processedContent = content.trim();
  
  // Strip starting decorative patterns like "Answer:", "**Response:**", etc. if they are just wraps
  processedContent = processedContent
    .replace(/^(Answer|Response|Result):\s*/i, "")
    .replace(/^\*\*(Answer|Response|Result):\*\*\s*/i, "");

  // 2. Split by newlines to parse line-by-line
  const lines = processedContent.split("\n");
  const elements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let listKeyCounter = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      const key = `list-${elements.length}-${listKeyCounter++}`;
      if (listType === "ul") {
        elements.push(
          <ul key={key} className="my-3 list-disc pl-6 space-y-1.5 text-foreground/90">
            {currentList}
          </ul>
        );
      } else if (listType === "ol") {
        elements.push(
          <ol key={key} className="my-3 list-decimal pl-6 space-y-1.5 text-foreground/90">
            {currentList}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  // Helper to parse inline bold and code formatting safely
  const parseInline = (text: string): React.ReactNode[] => {
    // Regex matches bold (**bold** or __bold__) and inline code (`code`)
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("__") && part.endsWith("__")) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary bg-primary/10 border border-primary/20">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    
    if (line === undefined) continue;

    // Handle empty lines (paragraph breaks)
    if (line === "") {
      flushList();
      continue;
    }

    // Unordered lists (- item or * item)
    const ulMatch = line.match(/^[\-*]\s+(.*)$/);
    if (ulMatch && ulMatch[1]) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      currentList.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {parseInline(ulMatch[1])}
        </li>
      );
      continue;
    }

    // Ordered lists (1. item)
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch && olMatch[1]) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      currentList.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {parseInline(olMatch[1])}
        </li>
      );
      continue;
    }

    // If we reach a non-list item, flush any active list
    flushList();

    // Headings (# Header, ## Header, ### Header)
    const h1Match = line.match(/^#\s+(.*)$/);
    if (h1Match && h1Match[1]) {
      elements.push(
        <h1 key={`h1-${i}`} className="mt-4 mb-2 font-display text-lg font-bold text-foreground">
          {parseInline(h1Match[1])}
        </h1>
      );
      continue;
    }

    const h2Match = line.match(/^##\s+(.*)$/);
    if (h2Match && h2Match[1]) {
      elements.push(
        <h2 key={`h2-${i}`} className="mt-4 mb-2 font-display text-base font-semibold text-foreground">
          {parseInline(h2Match[1])}
        </h2>
      );
      continue;
    }

    const h3Match = line.match(/^###\s+(.*)$/);
    if (h3Match && h3Match[1]) {
      elements.push(
        <h3 key={`h3-${i}`} className="mt-3 mb-1.5 font-display text-sm font-semibold text-foreground/90">
          {parseInline(h3Match[1])}
        </h3>
      );
      continue;
    }

    // Blockquotes (> text)
    const quoteMatch = line.match(/^>\s+(.*)$/);
    if (quoteMatch && quoteMatch[1]) {
      elements.push(
        <blockquote key={`q-${i}`} className="my-3 border-l-2 border-primary/50 pl-4 py-1 italic text-muted-foreground">
          {parseInline(quoteMatch[1])}
        </blockquote>
      );
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={`p-${i}`} className="my-2 leading-relaxed text-foreground/90">
        {parseInline(line)}
      </p>
    );
  }

  // Flush any final list left open
  flushList();

  return <div className="space-y-1">{elements}</div>;
}
