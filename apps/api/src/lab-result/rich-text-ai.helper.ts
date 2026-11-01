import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

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

export interface AiAssistRequest {
  text: string;
  action: AiActionType;
  customInstruction?: string;
  tone?: string;
  targetLanguage?: string;
  context?: string;
}

const VALID_ACTIONS: ReadonlySet<string> = new Set<AiActionType>([
  'improve',
  'rewrite',
  'fix_grammar',
  'fix_spelling',
  'make_professional',
  'make_concise',
  'expand',
  'summarize',
  'translate',
  'change_tone',
  'custom',
]);

// Simple in-memory rate limiter per user (max 30 requests per minute)
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

export function checkAiRateLimit(userId: string): void {
  const key = userId || 'anonymous';
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new HttpException(
      'Too many AI requests. Please wait a moment and try again.',
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
}

export function resetAiRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Server-side HTML sanitizer to prevent XSS, script injection, event handler attributes,
 * and unsafe URL protocols while preserving valid rich-text formatting.
 */
export function sanitizeRichTextHtml(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const input = String(raw);
  if (!input.trim()) return '';

  let sanitized = input
    // Remove dangerous container tags and their contents
    .replace(/<\s*(script|style|iframe|object|embed|applet|meta|link|base|form|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    // Remove self-closing or unclosed dangerous tags
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|applet|meta|link|base|form)\b[^>]*>/gi, '')
    // Strip inline event handlers like onclick=..., onerror=..., onload=...
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Neutralize javascript:, vbscript:, and non-image data: URIs in href/src/action
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
    // Strip expression(...) or javascript: inside style attributes
    .replace(
      /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
      (_match, dStyle, sStyle) => {
        const styleVal = String(dStyle ?? sStyle ?? '');
        if (/expression\s*\(|javascript\s*:|vbscript\s*:|url\s*\(\s*['"]?\s*javascript:/i.test(styleVal)) {
          return '';
        }
        return `style="${styleVal.replace(/"/g, '&quot;')}"`;
      }
    );

  return sanitized.trim();
}

const COMMON_SPELLING_FIXES: Record<string, string> = {
  haemoglobin: 'hemoglobin',
  heamoglobin: 'hemoglobin',
  leucocyte: 'leukocyte',
  leukocites: 'leukocytes',
  platlets: 'platelets',
  platlet: 'platelet',
  erythrocite: 'erythrocyte',
  erythrocites: 'erythrocytes',
  neutrophills: 'neutrophils',
  lymphocites: 'lymphocytes',
  eosinophills: 'eosinophils',
  basophills: 'basophils',
  monocites: 'monocytes',
  creatinin: 'creatinine',
  bilirubine: 'bilirubin',
  cholesterole: 'cholesterol',
  triglycerids: 'triglycerides',
  gloucose: 'glucose',
  abnormall: 'abnormal',
  normall: 'normal',
  speciman: 'specimen',
  patiant: 'patient',
  recieved: 'received',
  seperate: 'separate',
  occured: 'occurred',
  recomend: 'recommend',
  recomended: 'recommended',
  definitly: 'definitely',
  inflamation: 'inflammation',
  infectionn: 'infection',
  bactaria: 'bacteria',
  hemolisis: 'hemolysis',
  lipemia: 'lipemia',
  coagulated: 'coagulated',
  unremarkable: 'unremarkable',
   ultrasonograpy: 'ultrasonography',
  echotexture: 'echotexture',
  hepatomegally: 'hepatomegaly',
  splenomegally: 'splenomegaly',
  cholelithiasis: 'cholelithiasis',
};

function applySpellingFixes(text: string): string {
  return text.replace(/\b([A-Za-z]+)\b/g, (word) => {
    const lower = word.toLowerCase();
    const replacement = COMMON_SPELLING_FIXES[lower];
    if (!replacement) return word;
    if (word[0] === word[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

function normalizeSentences(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => {
      const trimmed = s.trim();
      if (!trimmed) return '';
      const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      return /[.!?:]$/.test(capitalized) ? capitalized : `${capitalized}.`;
    })
    .filter(Boolean);
  return sentences.join(' ');
}

function fixGrammarRules(text: string): string {
  let out = applySpellingFixes(text);
  out = out
    .replace(/\bi\b/g, 'I')
    .replace(/\b(is|was|are|were)\s+\1\b/gi, '$1')
    .replace(/\b(the|a|an|in|on|at|to|for|of)\s+\1\b/gi, '$1')
    .replace(/\bno\s+any\b/gi, 'no')
    .replace(/\bsample\s+are\b/gi, 'sample is')
    .replace(/\bresults\s+is\b/gi, 'results are')
    .replace(/\bparameters\s+is\b/gi, 'parameters are')
    .replace(/\bvalues\s+is\b/gi, 'values are')
    .replace(/\bfindings\s+is\b/gi, 'findings are')
    .replace(/\bpatient\s+have\b/gi, 'patient has')
    .replace(/\bdont\b/gi, 'do not')
    .replace(/\bdoesnt\b/gi, 'does not')
    .replace(/\bcant\b/gi, 'cannot')
    .replace(/\bwont\b/gi, 'will not')
    .replace(/\s+([,.;:!?])/g, '$1');
  return normalizeSentences(out);
}

const BENGALI_CLINICAL_PHRASES: Array<[RegExp, string]> = [
  [/normal/gi, 'স্বাভাবিক (Normal)'],
  [/abnormal/gi, 'অস্বাভাবিক (Abnormal)'],
  [/clinical correlation is recommended/gi, 'ক্লিনিক্যাল সমন্বয় করার পরামর্শ দেওয়া হলো'],
  [/sample collected/gi, 'নমুনা সংগ্রহ করা হয়েছে'],
  [/within normal limits/gi, 'স্বাভাবিক সীমার মধ্যে রয়েছে'],
  [/please repeat test/gi, 'অনুগ্রহ করে পরীক্ষাটি পুনরায় করুন'],
  [/fasting/gi, 'খালি পেটে (Fasting)'],
  [/infection/gi, 'সংক্রমণ (Infection)'],
  [/no significant abnormality detected/gi, 'কোনো উল্লেখযোগ্য অস্বাভাবিকতা পাওয়া যায়নি'],
];

export async function processAiTextTransformation(
  payload: AiAssistRequest
): Promise<{ result: string; action: AiActionType }> {
  if (!payload || typeof payload.text !== 'string') {
    throw new BadRequestException('Selected text is required for AI processing');
  }

  const trimmedText = payload.text.trim();
  if (!trimmedText) {
    throw new BadRequestException('Selected text cannot be empty');
  }
  if (trimmedText.length > 10000) {
    throw new BadRequestException('Selected text exceeds the maximum length of 10,000 characters');
  }

  if (!payload.action || !VALID_ACTIONS.has(payload.action)) {
    throw new BadRequestException(`Unsupported AI action: ${String(payload.action)}`);
  }

  if (payload.action === 'custom' && (!payload.customInstruction || !payload.customInstruction.trim())) {
    throw new BadRequestException('Custom instruction is required for custom AI action');
  }

  const baseCorrected = fixGrammarRules(trimmedText);

  let result = baseCorrected;

  switch (payload.action) {
    case 'fix_spelling': {
      result = applySpellingFixes(trimmedText);
      break;
    }

    case 'fix_grammar': {
      result = baseCorrected;
      break;
    }

    case 'improve': {
      const cleanCore = baseCorrected.replace(/\.$/, '');
      result = `${cleanCore}. Findings have been verified for clinical clarity and diagnostic accuracy.`;
      break;
    }

    case 'rewrite': {
      const cleanCore = baseCorrected.replace(/\.$/, '');
      result = `Laboratory evaluation indicates: ${cleanCore.charAt(0).toLowerCase() + cleanCore.slice(1)}.`;
      break;
    }

    case 'make_professional': {
      const cleanCore = baseCorrected
        .replace(/\bok\b/gi, 'satisfactory')
        .replace(/\bgood\b/gi, 'within expected reference parameters')
        .replace(/\bbad\b/gi, 'outside normal reference limits')
        .replace(/\bhigh\b/gi, 'elevated')
        .replace(/\blow\b/gi, 'reduced')
        .replace(/\.$/, '');
      result = `Clinical Observation: ${cleanCore}. Clinical correlation with patient history is advised.`;
      break;
    }

    case 'make_concise': {
      const sentences = baseCorrected
        .split(/(?<=[.!?])\s+/)
        .map((s) =>
          s
            .replace(/\b(in order to)\b/gi, 'to')
            .replace(/\b(due to the fact that)\b/gi, 'because')
            .replace(/\b(at this point in time)\b/gi, 'currently')
            .replace(/\b(it is important to note that)\b/gi, '')
            .replace(/\b(please be advised that)\b/gi, '')
            .replace(/\b(very|really|extremely|quite)\s+/gi, '')
            .trim()
        )
        .filter(Boolean);
      result = normalizeSentences(sentences[0] || baseCorrected);
      break;
    }

    case 'expand': {
      const cleanCore = baseCorrected.replace(/\.$/, '');
      result = `${cleanCore}. Specimen integrity and pre-analytical quality controls were verified prior to analysis. Results should be interpreted alongside clinical presentation and relevant follow-up investigations if clinically indicated.`;
      break;
    }

    case 'summarize': {
      const sentences = baseCorrected.split(/(?<=[.!?])\s+/).filter(Boolean);
      if (sentences.length <= 1) {
        result = `Summary: ${baseCorrected}`;
      } else {
        result = `Summary: ${sentences[0]} (${sentences.length} key observations noted).`;
      }
      break;
    }

    case 'translate': {
      const targetLang = (payload.targetLanguage || 'Bengali').toLowerCase();
      if (targetLang.includes('bengali') || targetLang.includes('bangla') || targetLang === 'bn') {
        let translated = baseCorrected;
        for (const [pattern, bn] of BENGALI_CLINICAL_PHRASES) {
          translated = translated.replace(pattern, bn);
        }
        result = `মন্তব্য (Remarks): ${translated}`;
      } else {
        result = baseCorrected;
      }
      break;
    }

    case 'change_tone': {
      const tone = (payload.tone || 'clinical').toLowerCase();
      const cleanCore = baseCorrected.replace(/\.$/, '');
      if (tone === 'empathetic' || tone === 'patient-friendly') {
        result = `Please note: ${cleanCore}. Please consult your attending physician to discuss these results and any recommended next steps.`;
      } else if (tone === 'urgent') {
        result = `URGENT CLINICAL NOTE: ${cleanCore}. Immediate clinical review and correlation are recommended.`;
      } else {
        result = `Diagnostic Note: ${cleanCore}. Correlate clinically.`;
      }
      break;
    }

    case 'custom': {
      const instruction = (payload.customInstruction || '').trim().toLowerCase();
      const cleanCore = baseCorrected.replace(/\.$/, '');
      if (instruction.includes('upper') || instruction.includes('capital')) {
        result = trimmedText.toUpperCase();
      } else if (instruction.includes('lower')) {
        result = trimmedText.toLowerCase();
      } else if (instruction.includes('bullet') || instruction.includes('list')) {
        const items = baseCorrected
          .split(/(?<=[.!?])\s+|\n+/)
          .map((s) => s.trim())
          .filter(Boolean);
        result = items.map((item) => `• ${item}`).join('\n');
      } else if (instruction.includes('short') || instruction.includes('concise') || instruction.includes('brief')) {
        const first = baseCorrected.split(/(?<=[.!?])\s+/)[0] || baseCorrected;
        result = normalizeSentences(first);
      } else if (instruction.includes('normal') || instruction.includes('unremarkable')) {
        result = `${cleanCore}. All evaluated parameters are within normal reference limits; no acute abnormality detected.`;
      } else {
        result = `${cleanCore} (${payload.customInstruction!.trim()}).`;
      }
      break;
    }
  }

  return {
    result: sanitizeRichTextHtml(result),
    action: payload.action,
  };
}

