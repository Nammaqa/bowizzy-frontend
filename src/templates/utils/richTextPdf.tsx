import React from 'react';
import DOMPurify from 'dompurify';
import { View, Text } from '@react-pdf/renderer';
import { parseInlineSegments, splitIntoRichTextBlocks } from './richTextHtml';

export interface PdfRichBulletsOptions {
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  marginTop?: number;
  boldFontFamily?: string;
  regularFontFamily?: string;
  textAlign?: 'left' | 'right' | 'center' | 'justify';
  bulletColor?: string;
  // Some fields (e.g. Technical Summary) should always render as points,
  // even when the user typed continuous prose with no <ul>/<li> markup.
  forceBullets?: boolean;
}

/**
 * Renders a description/roles field as bullets (or a plain paragraph, if the
 * source HTML has no list markup), preserving any bold text the user applied
 * in the rich-text editor instead of flattening everything to plain text.
 */
export function renderPdfRichBullets(html: string | undefined, opts: PdfRichBulletsOptions = {}) {
  if (!html) return null;

  const {
    fontSize = 10,
    color = '#444',
    lineHeight = 1.4,
    marginTop = 4,
    boldFontFamily,
    regularFontFamily,
    textAlign = 'justify',
    bulletColor = color,
    forceBullets = false,
  } = opts;

  const sanitized = DOMPurify.sanitize(html || '');
  const blocks = splitIntoRichTextBlocks(sanitized);
  if (blocks.length === 0) return null;

  const renderRuns = (blockHtml: string) =>
    parseInlineSegments(blockHtml).map((segment, idx) => (
      <Text
        key={idx}
        style={segment.bold && boldFontFamily ? { fontFamily: boldFontFamily } : regularFontFamily ? { fontFamily: regularFontFamily } : undefined}
      >
        {segment.text}
      </Text>
    ));

  const isBulleted = forceBullets || blocks[0].bullet;

  if (isBulleted) {
    return (
      <View style={{ marginTop, width: '100%' }}>
        {blocks.map((block, idx) => (
          <View key={idx} style={{ flexDirection: 'row', marginTop: idx > 0 ? 2 : 0, alignItems: 'flex-start', width: '100%' }}>
            <Text style={{ width: 12, flexShrink: 0, color: bulletColor, fontSize }}>•</Text>
            <Text style={{ flex: 1, color, fontSize, lineHeight, textAlign }}>{renderRuns(block.html)}</Text>
          </View>
        ))}
      </View>
    );
  }

  // Plain prose: fold every line's segments into one flat run list instead
  // of stacking each line in its own View with a top margin — a separate
  // View per line adds its own margin on top of the paragraph's lineHeight,
  // which reads as double-spaced text. The '\n' is spliced into the first
  // run's own text (not inserted as a separate sibling node) so react-pdf
  // treats it as a normal forced line break within one Text block.
  const flatRuns: { text: string; bold: boolean }[] = [];
  blocks.forEach((block, blockIdx) => {
    parseInlineSegments(block.html).forEach((segment, segIdx) => {
      const prefix = blockIdx > 0 && segIdx === 0 ? '\n' : '';
      flatRuns.push({ text: prefix + segment.text, bold: segment.bold });
    });
  });

  return (
    <View style={{ marginTop, width: '100%' }}>
      <Text style={{ color, fontSize, lineHeight, textAlign }}>
        {flatRuns.map((run, idx) => (
          <Text
            key={idx}
            style={run.bold && boldFontFamily ? { fontFamily: boldFontFamily } : regularFontFamily ? { fontFamily: regularFontFamily } : undefined}
          >
            {run.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}
