import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css = name => readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8');

test('Hubs: padding interno compacto e margens externas maiores, sem perder disposição horizontal', () => {
  const modern = css('demo-hub.css');
  const traditional = css('traditional-hub.css');
  // Base v1.5: padding no interior dos cards continua igual.
  assert.match(modern, /\.hub-metric\{[^\n]*padding:13px 11px;/);
  assert.match(modern, /\.hub-content-grid>\.card\{padding:10px;/);
  assert.match(modern, /\.hub-quick-grid a\{[^\n]*padding:6px 2px/);
  assert.match(traditional, /\.th-card\{[^\n]*padding:12px;/);
  assert.match(traditional, /\.th-metric\{[^\n]*padding:11px 13px/);
  // A distribuição horizontal da tela principal não foi convertida para pilhas.
  assert.match(modern, /\.hub-metrics\{display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(modern, /\.hub-content-grid\{display:grid;grid-template-columns:1\.30fr 1\.22fr \.91fr \.91fr/);
  assert.match(traditional, /\.th-top-grid\{display:grid;grid-template-columns:1\.18fr 1\.34fr \.98fr \.89fr/);
  // Espaçamento nas relações ENTRE containers, sem substituir seus paddings.
  assert.match(modern, /\.hub-content-grid \{ gap: 16px; \}/);
  assert.match(modern, /\.hub-actions \{ margin-top: 25px; \}/);
  assert.match(modern, /\.hub-categories \{ margin-top: 25px; \}/);
  assert.match(traditional, /\.th-content,\.th-top-grid,\.th-bottom-grid \{ gap: 19px; \}/);
  assert.match(modern, /@media \(max-width:650px\)/);
});
