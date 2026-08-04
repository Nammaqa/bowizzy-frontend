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

  const isBulleted = blocks[0].bullet;

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

  return (
    <View style={{ marginTop, width: '100%' }}>
      {blocks.map((block, idx) => (
        <View key={idx} style={{ marginTop: idx > 0 ? 6 : 0, width: '100%' }}>
          <Text style={{ color, fontSize, lineHeight, textAlign }}>{renderRuns(block.html)}</Text>
        </View>
      ))}
    </View>
  );
}
