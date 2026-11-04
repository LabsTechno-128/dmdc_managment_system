import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Indent,
  Outdent,
  Quote,
  FileCode,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Undo2,
  Redo2,
  Eraser,
  Sparkles,
  Palette,
  Highlighter,
  Omega,
  Loader2,
  Check,
  CornerDownRight,
  X,
  RotateCcw,
  Type,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  AI_ACTION_OPTIONS,
  SPECIAL_CHARACTERS,
  sanitizeEditorHtml,
  normalizeInitialContentToHtml,
  extractPlainText,
  isRichTextEmpty,
  htmlToDocJson,
  validateSafeUrl,
  validateImageFile,
  escapeHtml,
  type AiActionType,
  type EditorDocJson,
} from './richTextUtils';

export interface RichTextEditorProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (html: string, json: EditorDocJson, plainText: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  minHeight?: number | string;
  maxHeight?: number | string;
  enableAI?: boolean;
  className?: string;
}

const TEXT_COLORS = [
  { label: 'Default', color: '#0f172a' },
  { label: 'Red (Critical)', color: '#dc2626' },
  { label: 'Orange (Warning)', color: '#ea580c' },
  { label: 'Green (Normal)', color: '#16a34a' },
  { label: 'Blue (Clinical)', color: '#2563eb' },
  { label: 'Purple', color: '#7c3aed' },
  { label: 'Slate', color: '#64748b' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', color: 'transparent' },
  { label: 'Yellow', color: '#fef08a' },
  { label: 'Green', color: '#bbf7d0' },
  { label: 'Blue', color: '#bfdbfe' },
  { label: 'Red / Pink', color: '#fecaca' },
  { label: 'Purple', color: '#e9d5ff' },
];

const FONT_FAMILIES = [
  { label: 'Default (Inter)', value: 'Inter, system-ui, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe UI, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Garamond', value: 'Garamond, Baskerville, serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Consolas', value: 'Consolas, Monaco, monospace' },
  { label: 'Kalpurush / Bengali', value: "'Noto Sans Bengali', Kalpurush, sans-serif" },
];

const FONT_SIZES = [
  { label: '10px (XS)', size: '1', px: '10px' },
  { label: '12px (Small)', size: '2', px: '12px' },
  { label: '14px (Normal)', size: '3', px: '14px' },
  { label: '16px (Medium)', size: '4', px: '16px' },
  { label: '18px (Large)', size: '5', px: '18px' },
  { label: '24px (XL)', size: '6', px: '24px' },
  { label: '32px (XXL)', size: '7', px: '32px' },
];

const LINE_SPACINGS = [
  { label: '1.0', value: '1' },
  { label: '1.25', value: '1.25' },
  { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2' },
];

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  blockTag: string;
  fontFamily: string;
  fontSize: string;
  align: 'left' | 'center' | 'right' | 'justify';
  unorderedList: boolean;
  orderedList: boolean;
}

export interface ActiveTableContext {
  table: HTMLTableElement;
  row: HTMLTableRowElement;
  cell: HTMLTableCellElement;
  rowIndex: number;
  colIndex: number;
  totalRows: number;
  totalCols: number;
  isHeader: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  id,
  value,
  defaultValue = '',
  onChange,
  onBlur,
  placeholder = 'Type the report or any additional notes here...',
  disabled = false,
  readOnly = false,
  required = false,
  error,
  minHeight = 180,
  maxHeight = 420,
  enableAI = true,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastEmittedValueRef = useRef<string>('');

  const initialHtml = normalizeInitialContentToHtml(value !== undefined ? value : defaultValue);
  const [history, setHistory] = useState<string[]>([initialHtml]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isEmpty, setIsEmpty] = useState<boolean>(() => isRichTextEmpty(initialHtml));
  const [lineSpacing, setLineSpacing] = useState<string>('1.5');
  const [defaultFontFamily, setDefaultFontFamily] = useState<string>(FONT_FAMILIES[0].value);

  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    blockTag: 'p',
    fontFamily: FONT_FAMILIES[0].value,
    fontSize: '3',
    align: 'left',
    unorderedList: false,
    orderedList: false,
  });

  // Popover / Dialog states
  const [openMenu, setOpenMenu] = useState<
    'color' | 'highlight' | 'special' | 'link' | 'image' | 'spacing' | 'table' | null
  >(null);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageError, setImageError] = useState('');

  // Table Editing State
  const [activeTableContext, setActiveTableContext] = useState<ActiveTableContext | null>(null);
  const [customTableRows, setCustomTableRows] = useState<number>(3);
  const [customTableCols, setCustomTableCols] = useState<number>(3);

  // Selection & AI Menu states
  const [selectedText, setSelectedText] = useState('');
  const [bubblePosition, setBubblePosition] = useState<{ top: number; left: number } | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiPreviewResult, setAiPreviewResult] = useState<string | null>(null);
  const [aiPreviewAction, setAiPreviewAction] = useState<string>('');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<'clinical' | 'empathetic' | 'urgent'>('clinical');
  const [selectedLang, setSelectedLang] = useState<'Bengali' | 'English'>('Bengali');

  const isInteractive = !disabled && !readOnly;

  // Initialize editor DOM content on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
      lastEmittedValueRef.current = value !== undefined ? value : initialHtml;
      setIsEmpty(isRichTextEmpty(initialHtml));
    }
  }, []);

  // Sync external controlled `value` updates without clobbering active typing cursor
  useEffect(() => {
    if (value === undefined || !editorRef.current) return;
    if (value === lastEmittedValueRef.current) return;

    const normalized = normalizeInitialContentToHtml(value);
    if (editorRef.current.innerHTML !== normalized) {
      editorRef.current.innerHTML = normalized;
      lastEmittedValueRef.current = value;
      setIsEmpty(isRichTextEmpty(normalized));
    }
  }, [value]);

  // Close toolbar popovers on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setBubblePosition(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const pushHistory = useCallback((html: string) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      if (sliced[sliced.length - 1] === html) return prev;
      const next = [...sliced, html].slice(-50);
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [historyIndex]);

  const emitChange = useCallback(
    (recordHistory = true) => {
      if (!editorRef.current) return;
      const rawHtml = editorRef.current.innerHTML;
      const sanitized = sanitizeEditorHtml(rawHtml);
      const empty = isRichTextEmpty(sanitized);
      setIsEmpty(empty);

      const finalOutput = empty ? '' : sanitized;
      lastEmittedValueRef.current = finalOutput;

      if (recordHistory) {
        pushHistory(finalOutput);
      }

      if (onChange) {
        const docJson = htmlToDocJson(finalOutput);
        const plainText = extractPlainText(finalOutput);
        onChange(finalOutput, docJson, plainText);
      }
    },
    [onChange, pushHistory]
  );

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (!savedRangeRef.current || !editorRef.current) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    editorRef.current.focus();
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
    return true;
  }, []);

  const updateToolbarAndSelectionState = useCallback(() => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      if (!isAiPanelOpen) {
        setBubblePosition(null);
      }
      setActiveTableContext(null);
      return;
    }

    savedRangeRef.current = range.cloneRange();
    const text = sel.toString().trim();
    setSelectedText(text);

    if (text.length > 0 && isInteractive) {
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (rect && containerRect && (rect.width > 0 || rect.height > 0)) {
        setBubblePosition({
          top: Math.max(8, rect.top - containerRect.top - 42),
          left: Math.min(
            Math.max(12, rect.left - containerRect.left),
            Math.max(12, containerRect.width - 240)
          ),
        });
      } else {
        setBubblePosition({ top: 44, left: 16 });
      }
    } else if (!isAiPanelOpen) {
      setBubblePosition(null);
    }

    // Detect active formatting commands
    let node: Node | null = range.startContainer;
    let bold = false;
    let italic = false;
    let underline = false;
    let strike = false;
    let blockTag = 'p';
    let detectedFontFamily = '';
    let detectedFontSize = '';
    let unorderedList = false;
    let orderedList = false;
    let align: ActiveFormats['align'] = 'left';

    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === 'strong' || tag === 'b' || el.style.fontWeight === 'bold' || Number(el.style.fontWeight) >= 600) {
          bold = true;
        }
        if (tag === 'em' || tag === 'i' || el.style.fontStyle === 'italic') {
          italic = true;
        }
        if (tag === 'u' || el.style.textDecoration.includes('underline')) {
          underline = true;
        }
        if (tag === 's' || tag === 'strike' || tag === 'del' || el.style.textDecoration.includes('line-through')) {
          strike = true;
        }
        if (['h1', 'h2', 'h3', 'blockquote', 'pre', 'p'].includes(tag) && blockTag === 'p') {
          blockTag = tag;
        }
        if (!detectedFontFamily) {
          const faceAttr = el.getAttribute('face') || el.style.fontFamily;
          if (faceAttr) {
            const matched = FONT_FAMILIES.find((ff) =>
              ff.value.toLowerCase().includes(faceAttr.replace(/['"]/g, '').split(',')[0].trim().toLowerCase())
            );
            if (matched) detectedFontFamily = matched.value;
          }
        }
        if (!detectedFontSize && tag === 'font') {
          const sizeAttr = el.getAttribute('size');
          if (sizeAttr) detectedFontSize = sizeAttr;
        }
        if (tag === 'ul') unorderedList = true;
        if (tag === 'ol') orderedList = true;
        if (el.style.textAlign && ['left', 'center', 'right', 'justify'].includes(el.style.textAlign)) {
          align = el.style.textAlign as ActiveFormats['align'];
        }
      }
      node = node.parentNode;
    }

    setActiveFormats((prev) => ({
      bold,
      italic,
      underline,
      strike,
      blockTag,
      fontFamily: detectedFontFamily || prev.fontFamily || defaultFontFamily,
      fontSize: detectedFontSize || prev.fontSize || '3',
      align,
      unorderedList,
      orderedList,
    }));

    // Detect active table cell & context
    let activeTableCell: HTMLTableCellElement | null = null;
    let nodeCell: Node | null = range.startContainer;
    while (nodeCell && nodeCell !== editorRef.current) {
      if (nodeCell.nodeType === Node.ELEMENT_NODE) {
        const tag = (nodeCell as HTMLElement).tagName.toLowerCase();
        if (tag === 'td' || tag === 'th') {
          activeTableCell = nodeCell as HTMLTableCellElement;
          break;
        }
      }
      nodeCell = nodeCell.parentNode;
    }

    if (activeTableCell && activeTableCell.closest('table')) {
      const table = activeTableCell.closest('table')!;
      const row = (activeTableCell.closest('tr') || activeTableCell.parentElement) as HTMLTableRowElement | null;
      if (row && table.contains(row)) {
        const rowIndex = row.rowIndex;
        const colIndex = activeTableCell.cellIndex;
        const totalRows = table.rows.length;
        let totalCols = 0;
        for (let r = 0; r < table.rows.length; r++) {
          if (table.rows[r].cells.length > totalCols) {
            totalCols = table.rows[r].cells.length;
          }
        }
        setActiveTableContext({
          table,
          row,
          cell: activeTableCell,
          rowIndex,
          colIndex,
          totalRows,
          totalCols,
          isHeader: activeTableCell.tagName.toLowerCase() === 'th' || Boolean(activeTableCell.closest('thead')),
        });
      } else {
        setActiveTableContext(null);
      }
    } else {
      setActiveTableContext(null);
    }
  }, [isAiPanelOpen, isInteractive, defaultFontFamily]);

  // Synchronize selection and table context on global selection changes when editor is active
  useEffect(() => {
    const handleDocSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
      if (editorRef.current.contains(sel.anchorNode)) {
        updateToolbarAndSelectionState();
      }
    };
    document.addEventListener('selectionchange', handleDocSelectionChange);
    return () => document.removeEventListener('selectionchange', handleDocSelectionChange);
  }, [updateToolbarAndSelectionState]);

  const execEditorCommand = (command: string, commandValue?: string) => {
    if (!isInteractive || !editorRef.current) return;
    restoreSelection();
    editorRef.current.focus();
    try {
      document.execCommand(command, false, commandValue);
    } catch {
      // Fallback handled below if needed
    }
    emitChange(true);
    updateToolbarAndSelectionState();
  };

  const handleFontFamilyChange = (fontValue: string) => {
    if (!isInteractive || !editorRef.current) return;
    setDefaultFontFamily(fontValue);
    setActiveFormats((prev) => ({ ...prev, fontFamily: fontValue }));
    const restored = restoreSelection();
    editorRef.current.focus();

    const sel = window.getSelection();
    const hasHighlight =
      restored && sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;

    if (hasHighlight) {
      try {
        document.execCommand('fontName', false, fontValue);
      } catch {
        // Fallback if needed
      }
    } else if (isRichTextEmpty(editorRef.current.innerHTML)) {
      editorRef.current.innerHTML = `<p style="font-family: ${fontValue};"><br></p>`;
      const p = editorRef.current.querySelector('p');
      if (p && sel) {
        const range = document.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      }
    } else {
      // Apply to current block or whole editor when no specific word is highlighted
      let appliedToBlock = false;
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.getRangeAt(0).startContainer;
        while (node && node !== editorRef.current) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            ['P', 'H1', 'H2', 'H3', 'LI', 'BLOCKQUOTE', 'DIV', 'TD', 'TH'].includes(
              (node as HTMLElement).tagName
            )
          ) {
            (node as HTMLElement).style.fontFamily = fontValue;
            appliedToBlock = true;
            break;
          }
          node = node.parentNode;
        }
      }
      if (!appliedToBlock) {
        try {
          document.execCommand('fontName', false, fontValue);
        } catch {
          // Ignore
        }
      }
    }

    emitChange(true);
    updateToolbarAndSelectionState();
  };

  const handleFontSizeChange = (sizeValue: string) => {
    if (!isInteractive || !editorRef.current) return;
    setActiveFormats((prev) => ({ ...prev, fontSize: sizeValue }));
    execEditorCommand('fontSize', sizeValue);
  };

  const insertHtmlAtCursor = (htmlSnippet: string) => {
    if (!isInteractive || !editorRef.current) return;
    restoreSelection();
    editorRef.current.focus();

    const safeSnippet = sanitizeEditorHtml(htmlSnippet);
    let inserted = false;
    try {
      inserted = document.execCommand('insertHTML', false, safeSnippet);
    } catch {
      inserted = false;
    }

    if (!inserted) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const temp = document.createElement('div');
        temp.innerHTML = safeSnippet;
        const frag = document.createDocumentFragment();
        let lastNode: Node | null = null;
        while (temp.firstChild) {
          lastNode = frag.appendChild(temp.firstChild);
        }
        range.insertNode(frag);
        if (lastNode) {
          const nextRange = document.createRange();
          nextRange.setStartAfter(lastNode);
          nextRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(nextRange);
        }
      } else {
        editorRef.current.innerHTML += safeSnippet;
      }
    }

    emitChange(true);
    updateToolbarAndSelectionState();
  };

  const handleHeadingOrBlock = (tag: 'P' | 'H1' | 'H2' | 'H3' | 'BLOCKQUOTE' | 'PRE') => {
    if (!isInteractive || !editorRef.current) return;
    restoreSelection();
    editorRef.current.focus();
    try {
      document.execCommand('formatBlock', false, tag);
    } catch {
      insertHtmlAtCursor(`<${tag.toLowerCase()}>${escapeHtml(selectedText || 'Text')}</${tag.toLowerCase()}>`);
      return;
    }
    emitChange(true);
    updateToolbarAndSelectionState();
  };

  const handleInlineCode = () => {
    if (!isInteractive) return;
    const text = selectedText || 'code';
    insertHtmlAtCursor(
      `<code class="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded font-mono text-xs">${escapeHtml(text)}</code>`
    );
  };

  const handleInsertTaskList = () => {
    if (!isInteractive) return;
    const label = selectedText || 'Checklist item';
    insertHtmlAtCursor(
      `<ul data-type="taskList" class="list-none pl-1 my-1"><li data-type="taskItem" data-checked="false" class="flex items-center gap-2 my-1"><input type="checkbox" class="rounded border-slate-300 text-blue-600" /><span>${escapeHtml(label)}</span></li></ul>`
    );
  };

  // Table Manipulation Helpers
  const focusTableCell = (targetCell: HTMLElement, collapseToEnd = false) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    if (!sel) return;

    if (!targetCell.hasChildNodes() || targetCell.innerHTML === '') {
      targetCell.innerHTML = '<br>';
    }

    if (collapseToEnd) {
      range.selectNodeContents(targetCell);
      range.collapse(false);
    } else {
      range.selectNodeContents(targetCell);
      range.collapse(true);
    }

    sel.removeAllRanges();
    sel.addRange(range);
    savedRangeRef.current = range.cloneRange();
    updateToolbarAndSelectionState();
  };

  const getActiveTableElements = () => {
    if (!editorRef.current) return null;
    const sel = window.getSelection();
    let cell: HTMLTableCellElement | null = activeTableContext?.cell || null;

    if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as HTMLElement).tagName.toLowerCase();
          if (tag === 'td' || tag === 'th') {
            cell = node as HTMLTableCellElement;
            break;
          }
        }
        node = node.parentNode;
      }
    }

    if (!cell || !cell.closest('table')) return null;
    const row = cell.closest('tr');
    const table = cell.closest('table');
    if (!row || !table || !editorRef.current.contains(table)) return null;

    return { table, row, cell };
  };

  const handleInsertTableCustom = (rowsCount = 3, colsCount = 3) => {
    if (!isInteractive || !editorRef.current) return;
    const numRows = Math.max(1, Math.min(20, rowsCount));
    const numCols = Math.max(1, Math.min(15, colsCount));

    let headerCells = '';
    for (let c = 0; c < numCols; c++) {
      headerCells += `<th class="border border-slate-300 px-2.5 py-1.5 text-left font-semibold bg-slate-100">Header ${c + 1}</th>`;
    }
    const theadHtml = `<thead><tr class="bg-slate-100">${headerCells}</tr></thead>`;

    let tbodyRows = '';
    const bodyRowCount = numRows > 1 ? numRows - 1 : 1;
    for (let r = 0; r < bodyRowCount; r++) {
      let cells = '';
      for (let c = 0; c < numCols; c++) {
        cells += `<td class="border border-slate-300 px-2.5 py-1.5"><br></td>`;
      }
      tbodyRows += `<tr>${cells}</tr>`;
    }
    const tbodyHtml = `<tbody>${tbodyRows}</tbody>`;

    const tableHtml = `
      <table class="w-full border-collapse border border-slate-300 my-2 text-xs">
        ${theadHtml}
        ${tbodyHtml}
      </table>
      <p><br></p>
    `;

    insertHtmlAtCursor(tableHtml);
    setOpenMenu(null);
  };

  const handleAddRow = (position: 'above' | 'below') => {
    if (!isInteractive) return;
    const elements = getActiveTableElements();
    if (!elements) return;
    const { table, row } = elements;

    let colCount = row.cells.length;
    for (let i = 0; i < table.rows.length; i++) {
      if (table.rows[i].cells.length > colCount) {
        colCount = table.rows[i].cells.length;
      }
    }

    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const cell = document.createElement('td');
      cell.className = 'border border-slate-300 px-2.5 py-1.5';
      cell.innerHTML = '<br>';
      newRow.appendChild(cell);
    }

    if (position === 'above') {
      row.parentElement?.insertBefore(newRow, row);
    } else {
      if (row.parentElement?.tagName.toLowerCase() === 'thead') {
        const tbody = table.querySelector('tbody');
        if (tbody) {
          tbody.insertBefore(newRow, tbody.firstChild);
        } else {
          row.parentElement?.insertAdjacentElement('afterend', newRow);
        }
      } else {
        row.insertAdjacentElement('afterend', newRow);
      }
    }

    emitChange(true);
    if (newRow.cells.length > 0) {
      focusTableCell(newRow.cells[0]);
    }
  };

  const handleAddColumn = (position: 'before' | 'after') => {
    if (!isInteractive) return;
    const elements = getActiveTableElements();
    if (!elements) return;
    const { table, row, cell } = elements;

    const colIndex = cell.cellIndex;
    let targetFocusedCell: HTMLElement | null = null;

    const allRows = Array.from(table.rows);
    allRows.forEach((r) => {
      const isHeaderRow = r.parentElement?.tagName.toLowerCase() === 'thead' || r.querySelector('th') !== null;
      const newCell = document.createElement(isHeaderRow ? 'th' : 'td');
      if (isHeaderRow) {
        newCell.className = 'border border-slate-300 px-2.5 py-1.5 text-left font-semibold bg-slate-100';
        newCell.textContent = 'Header';
      } else {
        newCell.className = 'border border-slate-300 px-2.5 py-1.5';
        newCell.innerHTML = '<br>';
      }

      const refCell = r.cells[colIndex] || r.cells[r.cells.length - 1];
      if (refCell) {
        if (position === 'before') {
          refCell.parentElement?.insertBefore(newCell, refCell);
        } else {
          refCell.insertAdjacentElement('afterend', newCell);
        }
      } else {
        r.appendChild(newCell);
      }

      if (r === row) {
        targetFocusedCell = newCell;
      }
    });

    emitChange(true);
    if (targetFocusedCell) {
      focusTableCell(targetFocusedCell);
    }
  };

  const handleDeleteRow = () => {
    if (!isInteractive) return;
    const elements = getActiveTableElements();
    if (!elements) return;
    const { table, row, cell } = elements;

    if (table.rows.length <= 1) {
      handleDeleteTable();
      return;
    }

    const rowIndex = row.rowIndex;
    const colIndex = cell.cellIndex;
    const parentContainer = row.parentElement;

    let nextRowToFocus: HTMLTableRowElement | null = null;
    if (rowIndex + 1 < table.rows.length) {
      nextRowToFocus = table.rows[rowIndex + 1];
    } else if (rowIndex - 1 >= 0) {
      nextRowToFocus = table.rows[rowIndex - 1];
    }

    row.remove();

    if (parentContainer && parentContainer.children.length === 0 && parentContainer !== table) {
      parentContainer.remove();
    }

    emitChange(true);

    if (nextRowToFocus && nextRowToFocus.cells.length > 0) {
      const nextCell = nextRowToFocus.cells[Math.min(colIndex, nextRowToFocus.cells.length - 1)];
      if (nextCell) {
        focusTableCell(nextCell);
      }
    } else {
      setActiveTableContext(null);
    }
  };

  const handleDeleteColumn = () => {
    if (!isInteractive) return;
    const elements = getActiveTableElements();
    if (!elements) return;
    const { table, row, cell } = elements;

    const colIndex = cell.cellIndex;
    const allRows = Array.from(table.rows);

    const maxCols = Math.max(...allRows.map((r) => r.cells.length));
    if (maxCols <= 1) {
      handleDeleteTable();
      return;
    }

    allRows.forEach((r) => {
      if (colIndex < r.cells.length) {
        r.cells[colIndex].remove();
      }
    });

    const remainingCols = Math.max(...Array.from(table.rows).map((r) => r.cells.length), 0);
    if (remainingCols === 0) {
      handleDeleteTable();
      return;
    }

    emitChange(true);

    const targetCol = Math.min(colIndex, row.cells.length - 1);
    if (targetCol >= 0 && row.cells[targetCol]) {
      focusTableCell(row.cells[targetCol]);
    } else if (row.cells.length > 0) {
      focusTableCell(row.cells[0]);
    }
  };

  const handleDeleteTable = () => {
    if (!isInteractive) return;
    const elements = getActiveTableElements();
    if (!elements) return;
    const { table } = elements;

    const p = document.createElement('p');
    p.innerHTML = '<br>';
    table.parentElement?.insertBefore(p, table);
    table.remove();

    setActiveTableContext(null);
    emitChange(true);
    focusTableCell(p);
  };

  const handleSelectTable = () => {
    const elements = getActiveTableElements();
    if (!elements || !editorRef.current) return;
    const { table } = elements;

    editorRef.current.focus();
    const range = document.createRange();
    range.selectNode(table);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
      setSelectedText(sel.toString().trim());
    }
  };

  const handleInsertLink = () => {
    setLinkError('');
    const validUrl = validateSafeUrl(linkUrlInput);
    if (!validUrl) {
      setLinkError('Please enter a valid http://, https://, mailto:, or tel: URL.');
      return;
    }
    const label = linkTextInput.trim() || selectedText || validUrl;
    insertHtmlAtCursor(
      `<a href="${escapeHtml(validUrl)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${escapeHtml(label)}</a>`
    );
    setLinkUrlInput('');
    setLinkTextInput('');
    setOpenMenu(null);
  };

  const handleInsertImageUrl = () => {
    setImageError('');
    const validUrl = validateSafeUrl(imageUrlInput);
    if (!validUrl || (!validUrl.startsWith('http://') && !validUrl.startsWith('https://'))) {
      setImageError('Please enter a valid https:// image URL.');
      return;
    }
    insertHtmlAtCursor(
      `<img src="${escapeHtml(validUrl)}" alt="Clinical attachment" class="max-w-full h-auto rounded-lg my-2 border border-slate-200" />`
    );
    setImageUrlInput('');
    setOpenMenu(null);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image file');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) {
        insertHtmlAtCursor(
          `<img src="${dataUrl}" alt="${escapeHtml(file.name)}" class="max-w-full h-auto rounded-lg my-2 border border-slate-200" />`
        );
        setOpenMenu(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUndo = () => {
    if (!isInteractive || historyIndex <= 0 || !editorRef.current) return;
    const nextIdx = historyIndex - 1;
    const prevHtml = history[nextIdx];
    setHistoryIndex(nextIdx);
    editorRef.current.innerHTML = prevHtml;
    emitChange(false);
  };

  const handleRedo = () => {
    if (!isInteractive || historyIndex >= history.length - 1 || !editorRef.current) return;
    const nextIdx = historyIndex + 1;
    const nextHtml = history[nextIdx];
    setHistoryIndex(nextIdx);
    editorRef.current.innerHTML = nextHtml;
    emitChange(false);
  };

  const handleSelectAll = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
      setSelectedText(sel.toString().trim());
    }
  };

  const handleResetEditor = () => {
    if (!isInteractive || !editorRef.current) return;
    editorRef.current.innerHTML = '';
    setSelectedText('');
    setBubblePosition(null);
    setIsAiPanelOpen(false);
    setAiPreviewResult(null);
    emitChange(true);
  };

  // Paste handler to sanitize pasted HTML / plain text and prevent XSS
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!isInteractive) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');

    if (htmlData && htmlData.trim()) {
      insertHtmlAtCursor(sanitizeEditorHtml(htmlData));
    } else if (textData) {
      const safeLines = textData.split(/\r?\n/).map(escapeHtml).join('<br />');
      insertHtmlAtCursor(safeLines);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;

    // Handle Tab key inside tables (Navigate cells or auto-expand rows)
    if (e.key === 'Tab') {
      const elements = getActiveTableElements();
      if (elements) {
        e.preventDefault();
        const { table, row, cell } = elements;
        const allRows = Array.from(table.rows);
        const currentRowIdx = allRows.indexOf(row);
        const currentCells = Array.from(row.cells);
        const currentCellIdx = currentCells.indexOf(cell);

        if (e.shiftKey) {
          // Navigate backward
          if (currentCellIdx > 0) {
            focusTableCell(currentCells[currentCellIdx - 1]);
          } else if (currentRowIdx > 0) {
            const prevRow = allRows[currentRowIdx - 1];
            if (prevRow.cells.length > 0) {
              focusTableCell(prevRow.cells[prevRow.cells.length - 1]);
            }
          }
        } else {
          // Navigate forward
          if (currentCellIdx < currentCells.length - 1) {
            focusTableCell(currentCells[currentCellIdx + 1]);
          } else if (currentRowIdx < allRows.length - 1) {
            const nextRow = allRows[currentRowIdx + 1];
            if (nextRow.cells.length > 0) {
              focusTableCell(nextRow.cells[0]);
            }
          } else {
            // At last cell of table -> dynamically add new row below
            handleAddRow('below');
          }
        }
        return;
      }
    }

    const isMod = e.ctrlKey || e.metaKey;

    if (isMod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
      return;
    }

    if (isMod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
      return;
    }

    if (isMod && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      execEditorCommand('bold');
      return;
    }

    if (isMod && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      execEditorCommand('italic');
      return;
    }

    if (isMod && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      execEditorCommand('underline');
      return;
    }

    if (isMod && e.shiftKey && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      execEditorCommand('strikeThrough');
      return;
    }

    if (isMod && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      handleInlineCode();
    }
  };

  // AI Workflow Execution
  const runAiAction = async (action: AiActionType) => {
    const targetText =
      selectedText.trim() ||
      (editorRef.current ? extractPlainText(editorRef.current.innerHTML) : '');

    if (!targetText) {
      setAiError('Please select text or type content in the editor before running AI Assist.');
      return;
    }

    if (action === 'custom' && !customAiPrompt.trim()) {
      setAiError('Please enter a custom instruction first.');
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiPreviewResult(null);
    setAiPreviewAction(
      AI_ACTION_OPTIONS.find((a) => a.id === action)?.label || 'AI Suggestion'
    );

    try {
      const response = await api.post('/lab-result/ai/assist', {
        text: targetText,
        action,
        customInstruction: action === 'custom' ? customAiPrompt.trim() : undefined,
        tone: action === 'change_tone' ? selectedTone : undefined,
        targetLanguage: action === 'translate' ? selectedLang : undefined,
      });

      const generated =
        response?.data?.result ||
        response?.data?.data?.result ||
        (typeof response?.data === 'string' ? response.data : '');

      if (!generated) {
        throw new Error('No AI response returned from server');
      }

      setAiPreviewResult(sanitizeEditorHtml(generated));
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        'Failed to process AI request. Please try again.';
      setAiError(Array.isArray(msg) ? msg.join('. ') : String(msg));
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAiReplace = () => {
    if (!aiPreviewResult || !editorRef.current) return;
    const restored = restoreSelection();

    if (restored && savedRangeRef.current && !savedRangeRef.current.collapsed) {
      savedRangeRef.current.deleteContents();
      const span = document.createElement('span');
      span.innerHTML = sanitizeEditorHtml(aiPreviewResult);
      const frag = document.createDocumentFragment();
      while (span.firstChild) {
        frag.appendChild(span.firstChild);
      }
      savedRangeRef.current.insertNode(frag);
    } else {
      editorRef.current.innerHTML = normalizeInitialContentToHtml(aiPreviewResult);
    }

    setAiPreviewResult(null);
    setIsAiPanelOpen(false);
    setBubblePosition(null);
    emitChange(true);
  };

  const handleAcceptAiInsertBelow = () => {
    if (!aiPreviewResult || !editorRef.current) return;
    const restored = restoreSelection();

    if (restored && savedRangeRef.current) {
      const range = savedRangeRef.current.cloneRange();
      range.collapse(false);
      const wrapper = document.createElement('p');
      wrapper.innerHTML = sanitizeEditorHtml(aiPreviewResult);
      range.insertNode(wrapper);
    } else {
      editorRef.current.innerHTML += `<p>${sanitizeEditorHtml(aiPreviewResult)}</p>`;
    }

    setAiPreviewResult(null);
    setIsAiPanelOpen(false);
    setBubblePosition(null);
    emitChange(true);
  };

  const plainCharCount = editorRef.current
    ? extractPlainText(editorRef.current.innerHTML).length
    : 0;

  return (
    <div
      ref={containerRef}
      id={id}
      data-testid="rich-text-editor-container"
      className={`relative rounded-xl border bg-white shadow-xs transition-all ${
        error
          ? 'border-red-400 ring-1 ring-red-400/30'
          : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15'
      } ${disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Top Formatting Toolbar */}
      <div
        role="toolbar"
        aria-label="Rich Text Formatting Toolbar"
        className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/90 px-2 py-1.5 rounded-t-xl"
      >
        {/* Undo / Redo */}
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          disabled={!isInteractive || historyIndex <= 0}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleUndo}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 disabled:opacity-35 cursor-pointer"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          disabled={!isInteractive || historyIndex >= history.length - 1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleRedo}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 disabled:opacity-35 cursor-pointer"
        >
          <Redo2 size={14} />
        </button>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Paragraph / Headings */}
        <button
          type="button"
          title="Paragraph"
          aria-label="Paragraph"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleHeadingOrBlock('P')}
          className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeFormats.blockTag === 'p'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Pilcrow size={14} />
        </button>
        <button
          type="button"
          title="Heading 1"
          aria-label="Heading 1"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleHeadingOrBlock('H1')}
          className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeFormats.blockTag === 'h1'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Heading1 size={14} />
        </button>
        <button
          type="button"
          title="Heading 2"
          aria-label="Heading 2"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleHeadingOrBlock('H2')}
          className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeFormats.blockTag === 'h2'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Heading2 size={14} />
        </button>
        <button
          type="button"
          title="Heading 3"
          aria-label="Heading 3"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleHeadingOrBlock('H3')}
          className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeFormats.blockTag === 'h3'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Heading3 size={14} />
        </button>

        {/* Font Family Selector */}
        <select
          aria-label="Font Family"
          title="Font Family"
          disabled={!isInteractive}
          value={activeFormats.fontFamily}
          onMouseDown={() => saveSelection()}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          style={{ fontFamily: activeFormats.fontFamily }}
          className="mx-0.5 px-1.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[138px] cursor-pointer"
        >
          {FONT_FAMILIES.map((ff) => (
            <option key={ff.label} value={ff.value} style={{ fontFamily: ff.value }}>
              {ff.label}
            </option>
          ))}
        </select>

        {/* Font Size Selector */}
        <select
          aria-label="Font Size"
          title="Font Size"
          disabled={!isInteractive}
          value={activeFormats.fontSize}
          onMouseDown={() => saveSelection()}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="mx-0.5 px-1.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          {FONT_SIZES.map((fs) => (
            <option key={fs.size} value={fs.size}>
              {fs.label}
            </option>
          ))}
        </select>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Text Formatting: Bold, Italic, Underline, Strikethrough, Inline Code */}
        <button
          type="button"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('bold')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.bold
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('italic')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.italic
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          title="Underline (Ctrl+U)"
          aria-label="Underline"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('underline')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.underline
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Underline size={14} />
        </button>
        <button
          type="button"
          title="Strikethrough (Ctrl+Shift+X)"
          aria-label="Strikethrough"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('strikeThrough')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.strike
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Strikethrough size={14} />
        </button>
        <button
          type="button"
          title="Inline Code (Ctrl+E)"
          aria-label="Inline Code"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInlineCode}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <Code size={14} />
        </button>

        {/* Text Color & Highlight Popovers */}
        <div className="relative">
          <button
            type="button"
            title="Text Color"
            aria-label="Text Color"
            disabled={!isInteractive}
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => setOpenMenu(openMenu === 'color' ? null : 'color')}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
          >
            <Palette size={14} />
          </button>
          {openMenu === 'color' && (
            <div className="absolute left-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1.5">
              {TEXT_COLORS.map((tc) => (
                <button
                  key={tc.color}
                  type="button"
                  title={tc.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    execEditorCommand('foreColor', tc.color);
                    setOpenMenu(null);
                  }}
                  className="w-5 h-5 rounded-full border border-slate-300 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: tc.color }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            title="Highlight Color"
            aria-label="Highlight Color"
            disabled={!isInteractive}
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => setOpenMenu(openMenu === 'highlight' ? null : 'highlight')}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
          >
            <Highlighter size={14} />
          </button>
          {openMenu === 'highlight' && (
            <div className="absolute left-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1.5">
              {HIGHLIGHT_COLORS.map((hc) => (
                <button
                  key={hc.label}
                  type="button"
                  title={hc.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    execEditorCommand('hiliteColor', hc.color);
                    setOpenMenu(null);
                  }}
                  className="w-5 h-5 rounded-full border border-slate-300 cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: hc.color === 'transparent' ? '#ffffff' : hc.color,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Alignment & Line Spacing */}
        <button
          type="button"
          title="Align Left"
          aria-label="Align Left"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('justifyLeft')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.align === 'left'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          title="Align Center"
          aria-label="Align Center"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('justifyCenter')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.align === 'center'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          title="Align Right"
          aria-label="Align Right"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('justifyRight')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.align === 'right'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <AlignRight size={14} />
        </button>
        <button
          type="button"
          title="Justify"
          aria-label="Justify"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('justifyFull')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.align === 'justify'
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <AlignJustify size={14} />
        </button>

        {/* Line Spacing */}
        <div className="relative">
          <button
            type="button"
            title="Line Spacing"
            aria-label="Line Spacing"
            disabled={!isInteractive}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenMenu(openMenu === 'spacing' ? null : 'spacing')}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
          >
            <ArrowUpDown size={14} />
          </button>
          {openMenu === 'spacing' && (
            <div className="absolute left-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 min-w-[90px]">
              {LINE_SPACINGS.map((ls) => (
                <button
                  key={ls.value}
                  type="button"
                  onClick={() => {
                    setLineSpacing(ls.value);
                    setOpenMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1 text-xs rounded-lg ${
                    lineSpacing === ls.value
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Line {ls.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Lists: Bullet, Numbered, Task, Indent, Outdent */}
        <button
          type="button"
          title="Bullet List"
          aria-label="Bullet List"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('insertUnorderedList')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.unorderedList
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          title="Numbered List"
          aria-label="Numbered List"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('insertOrderedList')}
          className={`p-1.5 rounded-lg cursor-pointer ${
            activeFormats.orderedList
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          title="Task / Checklist"
          aria-label="Task List"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertTaskList}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <CheckSquare size={14} />
        </button>
        <button
          type="button"
          title="Indent Nested List"
          aria-label="Indent"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('indent')}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <Indent size={14} />
        </button>
        <button
          type="button"
          title="Outdent List"
          aria-label="Outdent"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('outdent')}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <Outdent size={14} />
        </button>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Insert Elements: Link, Image, Table, Blockquote, Code Block, Horizontal Rule, Special Chars */}
        <div className="relative">
          <button
            type="button"
            title="Insert Hyperlink"
            aria-label="Insert Link"
            disabled={!isInteractive}
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => {
              setLinkError('');
              setLinkTextInput(selectedText);
              setOpenMenu(openMenu === 'link' ? null : 'link');
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
          >
            <LinkIcon size={14} />
          </button>
          {openMenu === 'link' && (
            <div className="absolute left-0 top-full mt-1 z-40 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700">Insert Hyperlink</div>
              <input
                type="text"
                placeholder="Label (optional)"
                value={linkTextInput}
                onChange={(e) => setLinkTextInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrlInput}
                onChange={(e) => setLinkUrlInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {linkError && <p className="text-[11px] text-red-600">{linkError}</p>}
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="px-2.5 py-1 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Add Link
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            title="Insert Image"
            aria-label="Insert Image"
            disabled={!isInteractive}
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => {
              setImageError('');
              setOpenMenu(openMenu === 'image' ? null : 'image');
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
          >
            <ImageIcon size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageFileUpload}
            className="hidden"
          />
          {openMenu === 'image' && (
            <div className="absolute left-0 top-full mt-1 z-40 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700">Insert Image</div>
              <input
                type="url"
                placeholder="https://example.com/image.png"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {imageError && <p className="text-[11px] text-red-600">{imageError}</p>}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={handleInsertImageUrl}
                  className="px-2.5 py-1 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Insert URL
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            title="Table Tools & Presets"
            aria-label="Table Menu"
            disabled={!isInteractive}
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => setOpenMenu(openMenu === 'table' ? null : 'table')}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              activeTableContext || openMenu === 'table'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <TableIcon size={14} />
          </button>

          {openMenu === 'table' && (
            <div className="absolute left-0 top-full mt-1 z-40 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-3">
              {activeTableContext ? (
                // Inside an active table
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <TableIcon size={13} className="text-blue-600" />
                      Table Actions
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      R{activeTableContext.rowIndex + 1}/{activeTableContext.totalRows} · C{activeTableContext.colIndex + 1}/{activeTableContext.totalCols}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Rows
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAddRow('above')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        <ArrowUp size={12} className="text-blue-600" />
                        <span>Row Above</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAddRow('below')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        <ArrowDown size={12} className="text-blue-600" />
                        <span>Row Below</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleDeleteRow}
                      className="w-full mt-1.5 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Delete Current Row</span>
                    </button>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Columns
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAddColumn('before')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        <ArrowLeft size={12} className="text-blue-600" />
                        <span>Col Before</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAddColumn('after')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        <ArrowRight size={12} className="text-blue-600" />
                        <span>Col After</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleDeleteColumn}
                      className="w-full mt-1.5 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Delete Current Column</span>
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleSelectTable}
                      className="flex-1 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg cursor-pointer"
                    >
                      Select Table
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleDeleteTable}
                      className="flex-1 py-1 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg cursor-pointer"
                    >
                      Delete Table
                    </button>
                  </div>
                </div>
              ) : (
                // Outside a table: Insert Table UI
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TableIcon size={14} className="text-blue-600" />
                    <span>Insert Table</span>
                  </div>

                  {/* Grid Presets */}
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1.5">Quick Presets:</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsertTableCustom(2, 2)}
                        className="px-2 py-1 text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                      >
                        2 × 2 Grid
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsertTableCustom(3, 3)}
                        className="px-2 py-1 text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                      >
                        3 × 3 Grid
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsertTableCustom(4, 4)}
                        className="px-2 py-1 text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                      >
                        4 × 4 Grid
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsertTableCustom(5, 3)}
                        className="px-2 py-1 text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                      >
                        5 × 3 Clinical
                      </button>
                    </div>
                  </div>

                  {/* Custom Row x Col Inputs */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 mb-1.5">Custom Size:</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Rows</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={customTableRows}
                          onChange={(e) => setCustomTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-slate-400 font-bold mt-3">×</span>
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Columns</label>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={customTableCols}
                          onChange={(e) => setCustomTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setOpenMenu(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleInsertTableCustom(customTableRows, customTableCols)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Insert
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          title="Blockquote"
          aria-label="Blockquote"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleHeadingOrBlock('BLOCKQUOTE')}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <Quote size={14} />
        </button>
        <button
          type="button"
          title="Code Block"
          aria-label="Code Block"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleHeadingOrBlock('PRE')}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <FileCode size={14} />
        </button>
        <button
          type="button"
          title="Horizontal Divider"
          aria-label="Horizontal Rule"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('insertHorizontalRule')}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <Minus size={14} />
        </button>

        {/* Special Characters Picker */}
        <div className="relative">
          <button
            type="button"
            title="Insert Clinical / Special Symbol"
            aria-label="Special Characters"
            disabled={!isInteractive}
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => setOpenMenu(openMenu === 'special' ? null : 'special')}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
          >
            <Omega size={14} />
          </button>
          {openMenu === 'special' && (
            <div className="absolute right-0 top-full mt-1 z-40 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 grid grid-cols-4 gap-1">
              {SPECIAL_CHARACTERS.map((sc) => (
                <button
                  key={sc.char}
                  type="button"
                  title={sc.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    insertHtmlAtCursor(escapeHtml(sc.char));
                    setOpenMenu(null);
                  }}
                  className="px-1.5 py-1 text-xs font-mono font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded border border-slate-100 cursor-pointer"
                >
                  {sc.char}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="h-4 w-px bg-slate-200 mx-1" />

        {/* Clear Formatting, Select All, Reset */}
        <button
          type="button"
          title="Clear Formatting"
          aria-label="Clear Formatting"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execEditorCommand('removeFormat')}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <Eraser size={14} />
        </button>
        <button
          type="button"
          title="Select All"
          aria-label="Select All"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSelectAll}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <Type size={14} />
        </button>
        <button
          type="button"
          title="Reset Content"
          aria-label="Reset Content"
          disabled={!isInteractive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleResetEditor}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 cursor-pointer"
        >
          <RotateCcw size={14} />
        </button>

        {/* AI Assistant Trigger Button */}
        {enableAI && (
          <button
            type="button"
            title="AI Writing Assistant"
            aria-label="AI Writing Assistant"
            disabled={!isInteractive}
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => {
              setAiError('');
              setIsAiPanelOpen((prev) => !prev);
            }}
            className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isAiPanelOpen
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Sparkles size={13} />
            <span>AI Assist</span>
          </button>
        )}
      </div>

      {/* Contextual Table Ribbon Toolbar */}
      {activeTableContext && isInteractive && (
        <div
          role="toolbar"
          aria-label="Table Editing Toolbar"
          className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-blue-50/70 border-b border-blue-100 text-xs text-slate-700 animate-in fade-in duration-100"
        >
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md mr-1">
            <TableIcon size={12} className="text-blue-700" />
            <span>Table</span>
            <span className="font-mono font-normal text-blue-600 text-[10px]">
              ({activeTableContext.rowIndex + 1}/{activeTableContext.totalRows} × {activeTableContext.colIndex + 1}/{activeTableContext.totalCols})
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title="Add Row Above"
              aria-label="Add Row Above"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAddRow('above')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-blue-100/70 text-slate-700 border border-blue-200/60 shadow-2xs cursor-pointer text-[11px] font-medium"
            >
              <ArrowUp size={11} className="text-blue-600" />
              <span>Row Above</span>
            </button>
            <button
              type="button"
              title="Add Row Below"
              aria-label="Add Row Below"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAddRow('below')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-blue-100/70 text-slate-700 border border-blue-200/60 shadow-2xs cursor-pointer text-[11px] font-medium"
            >
              <ArrowDown size={11} className="text-blue-600" />
              <span>Row Below</span>
            </button>
          </div>

          <span className="h-4 w-px bg-blue-200 mx-0.5" />

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title="Add Column Before (Left)"
              aria-label="Add Column Before"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAddColumn('before')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-blue-100/70 text-slate-700 border border-blue-200/60 shadow-2xs cursor-pointer text-[11px] font-medium"
            >
              <ArrowLeft size={11} className="text-blue-600" />
              <span>Col Left</span>
            </button>
            <button
              type="button"
              title="Add Column After (Right)"
              aria-label="Add Column After"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAddColumn('after')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-blue-100/70 text-slate-700 border border-blue-200/60 shadow-2xs cursor-pointer text-[11px] font-medium"
            >
              <ArrowRight size={11} className="text-blue-600" />
              <span>Col Right</span>
            </button>
          </div>

          <span className="h-4 w-px bg-blue-200 mx-0.5" />

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title="Delete Current Row"
              aria-label="Delete Current Row"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleDeleteRow}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-red-50 text-red-600 hover:border-red-300 border border-blue-200/60 shadow-2xs cursor-pointer text-[11px] font-medium"
            >
              <Trash2 size={11} />
              <span>Del Row</span>
            </button>
            <button
              type="button"
              title="Delete Current Column"
              aria-label="Delete Current Column"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleDeleteColumn}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-red-50 text-red-600 hover:border-red-300 border border-blue-200/60 shadow-2xs cursor-pointer text-[11px] font-medium"
            >
              <Trash2 size={11} />
              <span>Del Col</span>
            </button>
            <button
              type="button"
              title="Delete Entire Table"
              aria-label="Delete Entire Table"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleDeleteTable}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white shadow-2xs cursor-pointer text-[11px] font-medium ml-1"
            >
              <Trash2 size={11} />
              <span>Del Table</span>
            </button>
          </div>
        </div>
      )}

      {/* Contextual Selection Bubble Menu */}
      {bubblePosition && isInteractive && !isAiPanelOpen && (
        <div
          role="dialog"
          aria-label="Selection Formatting Bubble Menu"
          style={{ top: bubblePosition.top, left: bubblePosition.left }}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-30 flex items-center gap-1 rounded-xl bg-slate-900 text-white px-2 py-1 shadow-xl border border-slate-700 animate-in fade-in duration-150"
        >
          <button
            type="button"
            onClick={() => execEditorCommand('bold')}
            className="p-1 hover:bg-slate-700 rounded text-xs"
            title="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            onClick={() => execEditorCommand('italic')}
            className="p-1 hover:bg-slate-700 rounded text-xs"
            title="Italic"
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            onClick={() => execEditorCommand('underline')}
            className="p-1 hover:bg-slate-700 rounded text-xs"
            title="Underline"
          >
            <Underline size={13} />
          </button>
          {enableAI && (
            <>
              <span className="h-3.5 w-px bg-slate-700 mx-0.5" />
              <button
                type="button"
                onClick={() => {
                  setAiError('');
                  setIsAiPanelOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-[11px] font-bold"
              >
                <Sparkles size={11} />
                <span>AI Actions</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* AI Contextual Action & Preview Panel */}
      {enableAI && isAiPanelOpen && isInteractive && (
        <div
          role="region"
          aria-label="AI Powered Editing Panel"
          className="border-b border-indigo-100 bg-indigo-50/50 p-3 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Sparkles size={14} className="text-indigo-600" />
              <span>AI Clinical Writing Assistant</span>
              {selectedText ? (
                <span className="text-[11px] font-normal text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Selected ({selectedText.length} chars)
                </span>
              ) : (
                <span className="text-[11px] font-normal text-slate-500">
                  Operating on full note
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Close AI Panel"
              onClick={() => {
                setIsAiPanelOpen(false);
                setAiPreviewResult(null);
                setAiError('');
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick AI Action Chips */}
          <div className="flex flex-wrap gap-1.5">
            {AI_ACTION_OPTIONS.filter((a) => a.id !== 'custom').map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={aiLoading}
                onClick={() => runAiAction(action.id)}
                title={action.description}
                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-indigo-200/80 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Tone & Language Selectors + Custom AI Instruction Input */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center pt-1">
            <select
              aria-label="AI Tone"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as any)}
              className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="clinical">Tone: Clinical</option>
              <option value="empathetic">Tone: Patient-Friendly</option>
              <option value="urgent">Tone: Urgent</option>
            </select>

            <select
              aria-label="Translation Language"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as any)}
              className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="Bengali">Translate: Bengali</option>
              <option value="English">Translate: English</option>
            </select>

            <div className="flex-1 flex gap-1.5">
              <input
                type="text"
                aria-label="Custom AI Instruction"
                placeholder="Custom AI instruction (e.g., Convert to bullet points, Make normal report)..."
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    runAiAction('custom');
                  }
                }}
                className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => runAiAction('custom')}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                Run Custom
              </button>
            </div>
          </div>

          {/* Loading State */}
          {aiLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-white/80 p-2.5 rounded-lg border border-indigo-100">
              <Loader2 size={14} className="animate-spin text-indigo-600" />
              <span>Generating AI suggestion...</span>
            </div>
          )}

          {/* Error State */}
          {aiError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {aiError}
            </div>
          )}

          {/* AI Generated Preview with Replace / Insert Below */}
          {aiPreviewResult && !aiLoading && (
            <div
              data-testid="ai-preview-card"
              className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                <span>AI Preview ({aiPreviewAction})</span>
                <span className="text-slate-400 font-normal normal-case">
                  Original text preserved until accepted
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {extractPlainText(aiPreviewResult)}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAiPreviewResult(null)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAiInsertBelow}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                >
                  <CornerDownRight size={12} />
                  <span>Insert Below</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAiReplace}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  <Check size={12} />
                  <span>Replace Selected Text</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editable Document Area */}
      <div className="relative">
        {isEmpty && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3.5 right-3.5 text-sm text-slate-400 select-none"
          >
            {placeholder}
          </div>
        )}

        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-required={required}
          aria-readonly={!isInteractive}
          aria-label={placeholder}
          contentEditable={isInteractive}
          suppressContentEditableWarning
          onInput={() => emitChange(true)}
          onBlur={() => {
            saveSelection();
            emitChange(false);
            onBlur?.();
          }}
          onKeyUp={updateToolbarAndSelectionState}
          onMouseUp={updateToolbarAndSelectionState}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
              const li = target.closest('li');
              if (li) {
                const checked = (target as HTMLInputElement).checked;
                li.setAttribute('data-checked', String(checked));
                if (checked) {
                  target.setAttribute('checked', 'checked');
                } else {
                  target.removeAttribute('checked');
                }
                emitChange(true);
              }
            }
          }}
          style={{
            minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
            lineHeight: lineSpacing,
            fontFamily: defaultFontFamily,
          }}
          className="w-full overflow-y-auto px-3.5 py-3 text-sm text-slate-800 focus:outline-none prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_hr]:my-3 [&_hr]:border-slate-200"
        />
      </div>

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-100 bg-slate-50/60 rounded-b-xl text-[11px] text-slate-400">
        <span>
          {readOnly ? 'Read-only mode' : 'Select text for formatting or AI assistance'}
        </span>
        <span className="font-mono">{plainCharCount} chars</span>
      </div>

      {error && <p className="px-3 pb-2 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};

export default RichTextEditor;

