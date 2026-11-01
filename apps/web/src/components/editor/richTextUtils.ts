export interface EditorDocNode {
  type: string;
  attrs?: Record<string, any>;
  content?: EditorDocNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  text?: string;
}

export interface EditorDocJson {
  type: 'doc';
  content: EditorDocNode[];
}

export type AiActionType =
  | 'improve'
  | 'rewrite'
  | 'fix_grammar'
  | 'fix_spelling'
  | 'make_professional'
  | 'make_concise'
  | 'expand'
  | 'summarize'
  | 'translate'
  | 'change_tone'
  | 'custom';

export interface AiActionOption {
  id: AiActionType;
  label: string;
  description: string;
}

export const AI_ACTION_OPTIONS: AiActionOption[] = [
  { id: 'improve', label: 'Improve Writing', description: 'Enhance clarity and clinical flow' },
  { id: 'rewrite', label: 'Rewrite', description: 'Rephrase selected text cleanly' },
  { id: 'fix_grammar', label: 'Fix Grammar', description: 'Correct grammar and punctuation' },
  { id: 'fix_spelling', label: 'Fix Spelling', description: 'Correct medical and general spelling' },
  { id: 'make_professional', label: 'Make Professional', description: 'Use formal diagnostic terminology' },
  { id: 'make_concise', label: 'Make Concise', description: 'Remove redundancy and tighten phrasing' },
  { id: 'expand', label: 'Expand Text', description: 'Elaborate with clinical context' },
  { id: 'summarize', label: 'Summarize', description: 'Condense into a brief summary' },
  { id: 'translate', label: 'Translate (EN / BN)', description: 'Add bilingual Bengali/English phrasing' },
  { id: 'change_tone', label: 'Change Tone', description: 'Adjust to clinical, urgent, or patient-friendly' },
  { id: 'custom', label: 'Custom AI Instruction', description: 'Provide your own custom instruction' },
];

export const SPECIAL_CHARACTERS = [
  { char: '±', label: 'Plus-Minus (±)' },
  { char: '°C', label: 'Degrees Celsius (°C)' },
  { char: 'µg/dL', label: 'Micrograms per dL (µg/dL)' },
  { char: 'mmol/L', label: 'Millimoles per L (mmol/L)' },
  { char: 'mg/dL', label: 'Milligrams per dL (mg/dL)' },
  { char: '≤', label: 'Less than or equal (≤)' },
  { char: '≥', label: 'Greater than or equal (≥)' },
  { char: '×', label: 'Multiplication (×)' },
  { char: '÷', label: 'Division (÷)' },
  { char: 'α', label: 'Alpha (α)' },
  { char: 'β', label: 'Beta (β)' },
  { char: 'γ', label: 'Gamma (γ)' },
  { char: 'Δ', label: 'Delta (Δ)' },
  { char: '→', label: 'Right Arrow (→)' },
  { char: '↑', label: 'Up Arrow / Elevated (↑)' },
  { char: '↓', label: 'Down Arrow / Reduced (↓)' },
  { char: '✓', label: 'Checkmark (✓)' },
];

export function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes HTML content to prevent XSS, unsafe tags, inline JS handlers, and unsafe URLs.
 */
export function sanitizeEditorHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml) return '';
  const input = String(rawHtml);
  if (!input.trim()) return '';

  return input
    .replace(
      /<\s*(script|style|iframe|object|embed|applet|meta|link|base|form|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      ''
    )
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|applet|meta|link|base|form)\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(
      /\b(href|src|xlink:href|action|formaction)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      (_match, attr, dQuoted, sQuoted, unquoted) => {
        const val = String(dQuoted ?? sQuoted ?? unquoted ?? '').trim();
        const normalized = val.replace(/[\s\x00-\x1f]+/g, '').toLowerCase();
        if (
          normalized.startsWith('javascript:') ||
          normalized.startsWith('vbscript:') ||
          (normalized.startsWith('data:') &&
            !normalized.startsWith('data:image/png;base64,') &&
            !normalized.startsWith('data:image/jpeg;base64,') &&
            !normalized.startsWith('data:image/jpg;base64,') &&
            !normalized.startsWith('data:image/gif;base64,') &&
            !normalized.startsWith('data:image/webp;base64,'))
        ) {
          return `${attr}="#"`;
        }
        return `${attr}="${val.replace(/"/g, '&quot;')}"`;
      }
    )
    .replace(
      /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
      (_match, dStyle, sStyle) => {
        const styleVal = String(dStyle ?? sStyle ?? '');
        if (/expression\s*\(|javascript\s*:|vbscript\s*:|url\s*\(\s*['"]?\s*javascript:/i.test(styleVal)) {
          return '';
        }
        return `style="${styleVal.replace(/"/g, '&quot;')}"`;
      }
    )
    .trim();
}

/**
 * Validates a URL for hyperlink insertion. Blocks javascript:, data:, vbscript:, etc.
 */
export function validateSafeUrl(rawUrl: string): string | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;

  const compact = trimmed.replace(/[\s\x00-\x1f]+/g, '').toLowerCase();
  if (
    compact.startsWith('javascript:') ||
    compact.startsWith('vbscript:') ||
    compact.startsWith('data:') ||
    compact.startsWith('file:')
  ) {
    return null;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  // Default bare domain to https://
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return null;
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

export function validateImageFile(file: { type?: string; size?: number } | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: 'No image file selected' };
  }
  if (!file.type || !ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Unsupported image format. Allowed formats: PNG, JPEG, WEBP, GIF.',
    };
  }
  if (typeof file.size === 'number' && file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'Image size exceeds the 2 MB limit.',
    };
  }
  return { valid: true };
}

/**
 * Converts a Tiptap-compatible JSON document node tree into safe HTML.
 */
export function docJsonToHtml(doc: EditorDocJson | EditorDocNode | null | undefined): string {
  if (!doc) return '';

  const renderNode = (node: EditorDocNode): string => {
    if (node.type === 'text') {
      let textHtml = escapeHtml(node.text || '');
      if (Array.isArray(node.marks)) {
        for (const mark of node.marks) {
          if (mark.type === 'bold' || mark.type === 'strong') {
            textHtml = `<strong>${textHtml}</strong>`;
          } else if (mark.type === 'italic' || mark.type === 'em') {
            textHtml = `<em>${textHtml}</em>`;
          } else if (mark.type === 'underline') {
            textHtml = `<u>${textHtml}</u>`;
          } else if (mark.type === 'strike') {
            textHtml = `<s>${textHtml}</s>`;
          } else if (mark.type === 'code') {
            textHtml = `<code>${textHtml}</code>`;
          } else if (mark.type === 'link' && mark.attrs?.href) {
            const safeHref = validateSafeUrl(String(mark.attrs.href));
            if (safeHref) {
              textHtml = `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${textHtml}</a>`;
            }
          }
        }
      }
      return textHtml;
    }

    const childrenHtml = Array.isArray(node.content) ? node.content.map(renderNode).join('') : '';

    switch (node.type) {
      case 'doc':
        return childrenHtml;
      case 'paragraph':
        return `<p>${childrenHtml}</p>`;
      case 'heading': {
        const level = [1, 2, 3].includes(Number(node.attrs?.level)) ? Number(node.attrs?.level) : 2;
        return `<h${level}>${childrenHtml}</h${level}>`;
      }
      case 'bulletList':
        return `<ul>${childrenHtml}</ul>`;
      case 'orderedList':
        return `<ol>${childrenHtml}</ol>`;
      case 'listItem':
        return `<li>${childrenHtml}</li>`;
      case 'taskList':
        return `<ul data-type="taskList">${childrenHtml}</ul>`;
      case 'taskItem': {
        const checked = Boolean(node.attrs?.checked);
        return `<li data-type="taskItem" data-checked="${checked}"><input type="checkbox" ${checked ? 'checked' : ''} /><span>${childrenHtml}</span></li>`;
      }
      case 'blockquote':
        return `<blockquote>${childrenHtml}</blockquote>`;
      case 'codeBlock':
        return `<pre><code>${childrenHtml}</code></pre>`;
      case 'horizontalRule':
        return '<hr />';
      case 'hardBreak':
        return '<br />';
      default:
        return childrenHtml;
    }
  };

  return sanitizeEditorHtml(renderNode(doc as EditorDocNode));
}

/**
 * Normalizes initial value (plain text, HTML, or JSON string) into clean HTML
 * while maintaining full backward compatibility with existing plain-text remarks.
 */
export function normalizeInitialContentToHtml(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  if (!raw.trim()) return '';

  const trimmed = raw.trim();

  // Check if value is a serialized Tiptap JSON document
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.type === 'doc' && Array.isArray(parsed.content)) {
        return docJsonToHtml(parsed);
      }
    } catch {
      // Fall through to HTML / plain-text handling
    }
  }

  // Check if it already contains HTML tags
  if (/<(p|div|h[1-6]|ul|ol|li|table|blockquote|pre|code|strong|b|em|i|u|s|span|br|hr|a|img)\b/i.test(trimmed)) {
    return sanitizeEditorHtml(raw);
  }

  // Plain-text fallback: convert paragraphs and line breaks cleanly into HTML
  const paragraphs = raw.split(/\n{2,}/);
  return paragraphs
    .map((para) => {
      const lines = para.split(/\r?\n/).map(escapeHtml).join('<br />');
      return `<p>${lines}</p>`;
    })
    .join('');
}

/**
 * Extracts plain text from rich HTML or plain text string.
 */
export function extractPlainText(htmlOrText: string | null | undefined): string {
  if (!htmlOrText) return '';
  const sanitized = sanitizeEditorHtml(htmlOrText);
  return sanitized
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|h[1-6]|li|tr|blockquote|pre)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Checks whether rich-text HTML is effectively empty (unless it contains an image, table, or divider).
 */
export function isRichTextEmpty(htmlOrText: string | null | undefined): boolean {
  if (!htmlOrText || !String(htmlOrText).trim()) return true;
  if (/<(img|table|hr)\b/i.test(htmlOrText)) return false;
  return extractPlainText(htmlOrText).length === 0;
}

/**
 * Converts HTML into a structured Tiptap-compatible JSON AST (`{ type: 'doc', content: [...] }`).
 */
export function htmlToDocJson(html: string | null | undefined): EditorDocJson {
  const sanitized = sanitizeEditorHtml(html);
  if (!sanitized) {
    return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
  }

  const blockRegex = /<(h[1-3]|p|blockquote|pre|ul|ol|hr)\b[^>]*>([\s\S]*?)<\/\1>|<(hr)\s*\/?>/gi;
  const content: EditorDocNode[] = [];
  let matched = false;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(sanitized)) !== null) {
    matched = true;
    const tag = (match[1] || match[3] || '').toLowerCase();
    const inner = match[2] || '';

    if (tag === 'hr') {
      content.push({ type: 'horizontalRule' });
    } else if (tag.startsWith('h')) {
      const level = Number(tag.charAt(1)) || 2;
      const text = extractPlainText(inner);
      content.push({
        type: 'heading',
        attrs: { level },
        content: text ? [{ type: 'text', text }] : [],
      });
    } else if (tag === 'blockquote') {
      const text = extractPlainText(inner);
      content.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: text ? [{ type: 'text', text }] : [],
          },
        ],
      });
    } else if (tag === 'pre') {
      const text = extractPlainText(inner);
      content.push({
        type: 'codeBlock',
        content: text ? [{ type: 'text', text }] : [],
      });
    } else if (tag === 'ul' || tag === 'ol') {
      const isTaskList = /data-type=["']taskList["']/i.test(match[0]);
      const liRegex = /<li\b([^>]*)>([\s\S]*?)<\/li>/gi;
      const items: EditorDocNode[] = [];
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(inner)) !== null) {
        const liAttrs = liMatch[1] || '';
        const liText = extractPlainText(liMatch[2] || '');
        if (isTaskList) {
          const checked = /data-checked=["']true["']|checked/i.test(liAttrs);
          items.push({
            type: 'taskItem',
            attrs: { checked },
            content: [
              {
                type: 'paragraph',
                content: liText ? [{ type: 'text', text: liText }] : [],
              },
            ],
          });
        } else {
          items.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: liText ? [{ type: 'text', text: liText }] : [],
              },
            ],
          });
        }
      }
      content.push({
        type: isTaskList ? 'taskList' : tag === 'ol' ? 'orderedList' : 'bulletList',
        content: items,
      });
    } else {
      const text = extractPlainText(inner);
      content.push({
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
      });
    }
  }

  if (!matched) {
    const plain = extractPlainText(sanitized);
    content.push({
      type: 'paragraph',
      content: plain ? [{ type: 'text', text: plain }] : [],
    });
  }

  return {
    type: 'doc',
    content,
  };
}

