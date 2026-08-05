import React from 'react';
import { View } from '@react-pdf/renderer';

/**
 * Reserves empty space at the top of continuation pages (page 2+) so wrapped
 * content doesn't start flush against the page edge, mimicking a header
 * margin on pages after the first. Renders nothing on page 1, where the
 * real header already occupies that space. Must be the first element inside
 * <Page> (or first element inside a column, for multi-column layouts) so the
 * reserved space lands above the flowing content on every page.
 */
export const ContinuationSpacer: React.FC<{ height?: number }> = ({ height = 32 }) => (
  <View fixed render={({ pageNumber }) => (pageNumber > 1 ? <View style={{ height }} /> : null)} />
);

/**
 * Keeps a sidebar column's background color running down every page in
 * two-column layouts. Only `fixed` elements repeat past the first page, so a
 * plain colored column stops after page 1 — this renders behind it on every
 * page instead. Position absolutely (outside normal flow) alongside the
 * sidebar/content columns.
 */
export const SidebarBackground: React.FC<{ width: number; color: string; left?: number }> = ({
  width,
  color,
  left = 0,
}) => <View fixed style={{ position: 'absolute', top: 0, bottom: 0, left, width, backgroundColor: color }} />;
