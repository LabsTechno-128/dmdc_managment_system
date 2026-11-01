/// <reference types="jest" />
import { BadRequestException, HttpException } from '@nestjs/common';
import {
    sanitizeRichTextHtml,
    processAiTextTransformation,
    checkAiRateLimit,
    resetAiRateLimitStore,
    AiActionType,
} from './rich-text-ai.helper';

describe('RichTextAiHelper & HTML Sanitization', () => {
    beforeEach(() => {
        resetAiRateLimitStore();
    });

    describe('sanitizeRichTextHtml', () => {
        it('returns empty string when input is null, undefined, or whitespace', () => {
            expect(sanitizeRichTextHtml(undefined)).toBe('');
            expect(sanitizeRichTextHtml(null)).toBe('');
            expect(sanitizeRichTextHtml('   ')).toBe('');
        });

        it('strips <script>, <iframe>, and inline event handlers while keeping safe formatting', () => {
            const maliciousHtml =
                '<p onclick="alert(1)">Patient <strong>stable</strong></p><script>alert("xss")</script><iframe src="https://evil.com"></iframe>';
            const cleaned = sanitizeRichTextHtml(maliciousHtml);
            expect(cleaned).toContain('<p>Patient <strong>stable</strong></p>');
            expect(cleaned).not.toContain('<script');
            expect(cleaned).not.toContain('<iframe');
            expect(cleaned).not.toContain('onclick');
        });

        it('neutralizes javascript: URLs in href and src attributes', () => {
            const input = '<a href="javascript:alert(1)">Click</a><img src="javascript:evil()" />';
            const cleaned = sanitizeRichTextHtml(input);
            expect(cleaned).toContain('href="#"');
            expect(cleaned).not.toContain('javascript:');
        });

        it('preserves clinical formatting, tables, lists, and blockquotes', () => {
            const clinicalHtml =
                '<h2>USG Findings</h2><ul><li>Liver: Normal size and echotexture</li></ul><table><tr><th>Organ</th><td>Normal</td></tr></table>';
            const cleaned = sanitizeRichTextHtml(clinicalHtml);
            expect(cleaned).toBe(clinicalHtml);
        });
    });

    describe('processAiTextTransformation', () => {
        const sampleInput = 'patient has mild hepatomegaly and fatty infiltration of liver grade 1';

        const allActions: AiActionType[] = [
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
        ];

        it.each(allActions)('processes AI action "%s" and returns non-empty sanitized result', async (action) => {
            const res = await processAiTextTransformation({
                text: sampleInput,
                action,
                tone: 'clinical',
                targetLanguage: 'Bengali',
            });
            expect(res.action).toBe(action);
            expect(typeof res.result).toBe('string');
            expect(res.result.length).toBeGreaterThan(0);
        });

        it('fixes medical spelling and clinical tone in fix_spelling and make_professional', async () => {
            const res = await processAiTextTransformation({
                text: 'patiant leucocyte and haemoglobin are good',
                action: 'make_professional',
            });
            expect(res.result.toLowerCase()).toContain('patient');
            expect(res.result.toLowerCase()).toContain('leukocyte');
            expect(res.result.toLowerCase()).toContain('hemoglobin');
            expect(res.result.toLowerCase()).toContain('within expected reference parameters');
        });

        it('supports custom AI instructions (bullet list, uppercase)', async () => {
            const bulletRes = await processAiTextTransformation({
                text: 'Liver is normal in size. Gallbladder is well distended. Spleen is unremarkable.',
                action: 'custom',
                customInstruction: 'Convert into bullet list',
            });
            expect(bulletRes.result).toContain('•');

            const upperRes = await processAiTextTransformation({
                text: 'normal study',
                action: 'custom',
                customInstruction: 'Convert to uppercase',
            });
            expect(upperRes.result).toBe('NORMAL STUDY');
        });

        it('throws BadRequestException when selected text is empty', async () => {
            await expect(
                processAiTextTransformation({
                    text: '   ',
                    action: 'improve',
                })
            ).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException when custom action has no customInstruction', async () => {
            await expect(
                processAiTextTransformation({
                    text: 'Normal findings',
                    action: 'custom',
                    customInstruction: '   ',
                })
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('checkAiRateLimit', () => {
        it('allows requests under the rate limit and blocks excessive requests', () => {
            const userId = 'test-user-rate-limit-1';
            for (let i = 0; i < 30; i++) {
                expect(() => checkAiRateLimit(userId)).not.toThrow();
            }
            expect(() => checkAiRateLimit(userId)).toThrow(HttpException);
        });
    });
});
