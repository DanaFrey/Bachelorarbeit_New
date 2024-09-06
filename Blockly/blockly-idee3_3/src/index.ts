/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { blocks } from './blocks/text';
import { forBlock } from './generators/javascript';
import { javascriptGenerator } from 'blockly/javascript';
import { save, load } from './serialization';
import { toolbox } from './toolbox';
import './index.css';
import { block } from 'blockly/core/tooltip';
import { string } from 'blockly/core/utils';

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode')?.firstChild;
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');
const ws = blocklyDiv && Blockly.inject(blocklyDiv, { toolbox });
let currentBlockColour: number = 0;

function lightenColour(id: string) {
  if (ws) {
    let currentColour = ws.getBlockById(id)?.getHue();
    if (currentColour) currentBlockColour = currentColour

    let block = ws.getBlockById(id);
    let colour: string = "#000000";
    let hue = block?.getHue();

    if (hue) colour = Blockly.utils.colour.hsvToHex(hue, 0.5, 230);
    if (block) block.setColour(colour);
  }
}

function resetColour(id: string) {
  if (ws) {
    const block = ws.getBlockById(id);
    if (block) block.setColour(currentBlockColour);
  }
}

const runCode = async () => {
  javascriptGenerator.STATEMENT_PREFIX = 'lightenColour(%1);\n';
  javascriptGenerator.STATEMENT_SUFFIX = 'resetColour(%1);\n';
  javascriptGenerator.addReservedWords('lightenColour');
  javascriptGenerator.addReservedWords('resetColour');
  const code = javascriptGenerator.workspaceToCode(ws);
  if (codeDiv) codeDiv.textContent = code;

  if (outputDiv) outputDiv.innerHTML = '';

  try {
    await eval(`(async () => {${code}})()`);
  } catch (error) {
    console.error('Error in generated code:', error);
  }
};

if (ws) {
  // Load the initial state from storage and run the code.
  load(ws);
  runCode();

  // Every time the workspace changes state, save the changes to storage.
  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    // UI events are things like scrolling, zooming, etc.
    // No need to save after one of these.
    if (e.isUiEvent) return;
    save(ws);
  });


  // Whenever the workspace changes meaningfully, run the code again.
  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    // Don't run the code when the workspace finishes loading; we're
    // already running it once when the application starts.
    // Don't run the code during drags; we might have invalid state.
    if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING ||
      ws.isDragging()) {
      return;
    }
    runCode();
  });
}
