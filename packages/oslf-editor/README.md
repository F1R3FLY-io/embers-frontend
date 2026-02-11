# OSLF-editor
Operational Semantics in Logical Form editor

**[Live Demo](https://f1r3fly-io.github.io/OSLF-editor/)** | **[Installation](#installation)** | **[API Documentation](#api-documentation)** | **[Development](#development)** | **[Releases](#releasing-a-new-version-for-contributors)**

## Installation

```bash
npm install @f1r3fly.io/oslf-editor
# or
pnpm add @f1r3fly.io/oslf-editor
# or
yarn add @f1r3fly.io/oslf-editor
```

### Usage

```typescript
import { init, Events } from "@f1r3fly.io/oslf-editor";

// Create a container element in your HTML
const container = document.getElementById("editor");

// Initialize the editor
const editor = init(container);
```

## API Documentation

The OSLF Editor is built on top of Blockly and provides a visual editor for Operational Semantics in Logical Form (OSLF).

### Table of Contents

- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Events](#events)
- [Loading Custom Blocks](#loading-custom-blocks)
- [Code Generator](#code-generator)
- [Listening to Changes](#listening-to-changes)
- [Examples](#examples)
- [TypeScript Support](#typescript-support)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)

### Basic Usage

#### Vanilla JavaScript

```javascript
import { init, Events } from "@f1r3fly.io/oslf-editor";

// Create a container in your HTML
const container = document.getElementById("editor");

// Initialize the editor
const editorInstance = init(container);

// Listen for changes
window.addEventListener(Events.ON_CHANGE, (event) => {
  console.log("Workspace changed:", event.detail.state);
});
```

#### React

```tsx
import { useRef, useEffect } from "react";
import { init, Events, OSLFInstance } from "@f1r3fly.io/oslf-editor";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<OSLFInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize editor
    editorRef.current = init(containerRef.current);

    // Listen for changes
    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Workspace changed:", customEvent.detail.state);
    };

    window.addEventListener(Events.ON_CHANGE, handleChange);

    return () => {
      window.removeEventListener(Events.ON_CHANGE, handleChange);
    };
  }, []);

  return <div ref={containerRef} id="blockly"></div>;
}
```

### API Reference

#### `init(container: Element): OSLFInstance`

Initializes the OSLF editor in the specified container element.

**Parameters:**
- `container` - A DOM element that will host the Blockly workspace

**Returns:** `OSLFInstance` object with:
- `workspace` - The Blockly workspace instance
- `handlers` - Array of cleanup handlers

**Example:**
```typescript
const container = document.getElementById("editor");
const editor = init(container);
```

#### `OSLFInstance`

The object returned by `init()`:

```typescript
type OSLFInstance = {
  workspace: Blockly.Workspace;
  handlers: Array<() => void>;
};
```

### Events

The editor uses Custom Events for communication. Import the `Events` enum to access event names:

```typescript
import { Events } from "@f1r3fly.io/oslf-editor";
```

#### Event Types

##### `Events.INIT`

Dispatched **to** the container element to load custom block definitions.

**Event Name:** `"blockly:init"`

**Usage:**
```typescript
const container = document.getElementById("editor");
const editor = init(container);

const blockDefinitions = [
  {
    type: "custom_block",
    message0: "custom block %1",
    args0: [
      {
        type: "input_value",
        name: "INPUT"
      }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230
  }
];

container.dispatchEvent(
  new CustomEvent(Events.INIT, {
    detail: blockDefinitions
  })
);
```

**Event Detail:** Array of Blockly block definitions (JSON format)

##### `Events.ON_CHANGE`

Dispatched **from** `window` when the workspace changes.

**Event Name:** `"blockly:on_change"`

**Usage:**
```typescript
window.addEventListener(Events.ON_CHANGE, (event: Event) => {
  const customEvent = event as CustomEvent;
  const { state, code } = customEvent.detail;

  console.log("Workspace state:", state);
  console.log("Generated code:", code);

  // Save to localStorage
  localStorage.setItem("workspace", JSON.stringify(state));
});
```

**Event Detail:**
```typescript
{
  state: {
    blocks: {
      languageVersion: number,
      blocks: Array<BlockState>
    }
  },
  code: string  // Generated code from blocks using message0 templates
}
```

**Note:** Changes are debounced by 1 second to avoid excessive event firing.

### Loading Custom Blocks

Custom blocks are defined using [Blockly's JSON format](https://developers.google.com/blockly/guides/create-custom-blocks/define-blocks).

#### Block Definition Structure

```typescript
interface BlockDefinition {
  type: string;              // Unique block type identifier
  message0: string;          // Block text with %1, %2 placeholders
  args0?: Array<{           // Input definitions
    type: string;
    name: string;
    check?: string;
  }>;
  previousStatement?: null | string;  // Connection type above
  nextStatement?: null | string;      // Connection type below
  output?: null | string;             // Output type (for value blocks)
  colour: number;                     // Block color (HSV hue)
  tooltip?: string;                   // Hover tooltip
  helpUrl?: string;                   // Help documentation URL
}
```

#### Example: Loading Multiple Blocks

```typescript
const container = document.getElementById("editor");
const editor = init(container);

const blocks = [
  {
    type: "process",
    message0: "process %1",
    args0: [
      {
        type: "input_value",
        name: "NAME",
        check: "String"
      }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Define a process",
    helpUrl: ""
  },
  {
    type: "send",
    message0: "send %1 on %2",
    args0: [
      {
        type: "input_value",
        name: "MESSAGE"
      },
      {
        type: "input_value",
        name: "CHANNEL"
      }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Send a message on a channel"
  }
];

container.dispatchEvent(
  new CustomEvent(Events.INIT, {
    detail: blocks
  })
);
```

### Code Generator

The OSLF Editor includes a built-in code generator that converts visual blocks into text code. The generator uses each block's `message0` field as a template, replacing `%N` placeholders with the actual values from connected inputs.

#### How It Works

When you define a block like:

```json
{
  "type": "proc_input",
  "message0": "for ( %1 -> %2 ) { %3 }",
  "args0": [
    { "type": "input_value", "name": "CHANNEL", "check": "Name" },
    { "type": "field_input", "name": "VAR", "text": "x" },
    { "type": "input_statement", "name": "BODY", "check": "Proc" }
  ]
}
```

The generator produces code like: `for ( @(channel) -> x ) { ... }`

#### Automatic Code Generation

Code is automatically generated whenever the workspace changes and is included in the `ON_CHANGE` event:

```typescript
window.addEventListener(Events.ON_CHANGE, (event: Event) => {
  const { code, state } = (event as CustomEvent).detail;
  console.log("Generated code:", code);
});
```

#### Manual Code Generation

You can also generate code directly using the exported `generateCode` function:

```typescript
import { init, generateCode } from "@f1r3fly.io/oslf-editor";

const container = document.getElementById("editor");
const editor = init(container);

// Generate code from current workspace
const code = generateCode(editor.workspace);
console.log(code);
```

#### Generator API Reference

##### `generateCode(workspace): string`

Generates code from all blocks in the workspace.

```typescript
import { generateCode } from "@f1r3fly.io/oslf-editor";

const editor = init(container);
const code = generateCode(editor.workspace);
```

##### `registerBlocks(blocks): void`

Registers block definitions with the code generator. This is called automatically when you dispatch the `INIT` event, but you can call it manually if needed.

```typescript
import { registerBlocks } from "@f1r3fly.io/oslf-editor";

registerBlocks(myBlockDefinitions);
```

##### `rhoLangGenerator`

The generator instance for advanced usage:

```typescript
import { rhoLangGenerator } from "@f1r3fly.io/oslf-editor";

// Access the generator directly
const code = rhoLangGenerator.workspaceToCode(editor.workspace);
```

### Listening to Changes

The editor emits workspace changes that you can listen to for:
- Auto-saving
- Syncing with external state
- Validation
- Code generation

#### Auto-save Example

```typescript
const AUTOSAVE_KEY = "oslf-workspace";

window.addEventListener(Events.ON_CHANGE, (event: Event) => {
  const customEvent = event as CustomEvent;
  const { state } = customEvent.detail;
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
});
```

#### React State Sync Example

```tsx
const [workspaceState, setWorkspaceState] = useState(null);

useEffect(() => {
  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    setWorkspaceState(customEvent.detail.state);
  };

  window.addEventListener(Events.ON_CHANGE, handleChange);

  return () => {
    window.removeEventListener(Events.ON_CHANGE, handleChange);
  };
}, []);
```

### Examples

#### Complete React Example

```tsx
import { useRef, useState, useEffect, useCallback } from "react";
import { init, Events, OSLFInstance } from "@f1r3fly.io/oslf-editor";

function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<OSLFInstance | null>(null);
  const [blocksJson, setBlocksJson] = useState("");

  const handleChange = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    console.log("Workspace changed:", customEvent.detail.state);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize editor
    editorRef.current = init(containerRef.current);

    // Listen for changes
    window.addEventListener(Events.ON_CHANGE, handleChange);

    return () => {
      window.removeEventListener(Events.ON_CHANGE, handleChange);
    };
  }, [handleChange]);

  const loadCustomBlocks = () => {
    if (!containerRef.current || !blocksJson) return;

    try {
      const blocks = JSON.parse(blocksJson);
      containerRef.current.dispatchEvent(
        new CustomEvent(Events.INIT, {
          detail: blocks
        })
      );
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  return (
    <div>
      <div>
        <textarea
          value={blocksJson}
          onChange={(e) => setBlocksJson(e.target.value)}
          placeholder="Paste block definitions JSON..."
          rows={10}
          cols={50}
        />
        <button onClick={loadCustomBlocks}>Load Blocks</button>
      </div>
      <div ref={containerRef} id="blockly"></div>
    </div>
  );
}
```

#### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { init, Events } from "@f1r3fly.io/oslf-editor";

    document.addEventListener("DOMContentLoaded", () => {
      const container = document.getElementById("editor");

      // Initialize editor
      const editor = init(container);

      // Listen to changes
      window.addEventListener(Events.ON_CHANGE, (event) => {
        console.log("Changed:", event.detail.state);
      });

      // Load custom blocks
      const blocks = [
        {
          type: "custom_block",
          message0: "custom block",
          colour: 160
        }
      ];

      container.dispatchEvent(
        new CustomEvent(Events.INIT, {
          detail: blocks
        })
      );
    });
  </script>
</head>
<body>
  <div id="editor"></div>
</body>
</html>
```

### TypeScript Support

The package includes TypeScript type definitions. Import types and enums for full type safety:

```typescript
import {
  init,
  Events,
  OSLFInstance,
  generateCode,
  registerBlocks,
  rhoLangGenerator
} from "@f1r3fly.io/oslf-editor";

const container = document.getElementById("editor") as HTMLElement;
const editor: OSLFInstance = init(container);

// TypeScript will recognize the event names
window.addEventListener(Events.ON_CHANGE, (event: Event) => {
  const customEvent = event as CustomEvent;
  const { state, code } = customEvent.detail;

  // Type-safe event handling
  console.log("State:", state);
  console.log("Code:", code);
});

// Generate code with full type safety
const code: string = generateCode(editor.workspace);
```

### Browser Support

The editor supports all modern browsers that support ES6+ and DOM APIs:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

For older browsers, you may need to transpile the code and include polyfills.

### Troubleshooting

#### Installation errors

**`E404 Not Found` error:**
- The package scope might be incorrect (should be `@f1r3fly.io/oslf-editor`)
- Ensure you're using npm, pnpm, or yarn version that supports scoped packages
- Check that you have internet connectivity to access npm registry

#### Editor not rendering

Make sure you:
1. Imported the editor: `import { init } from "@f1r3fly.io/oslf-editor"`
2. Created a container element in your HTML: `<div id="editor"></div>`
3. Called `init()` with the container element after the DOM is ready
4. The container element exists before calling `init()`

#### Custom blocks not appearing

Ensure:
1. Block definitions are valid JSON
2. The `type` field is unique for each block
3. You dispatch the `INIT` event to the container element after calling `init()`
4. The container element reference is correct

#### Changes not firing

The change event:
- Is debounced by 1 second
- Only fires for actual workspace changes (not UI events)
- Is dispatched on `window`, not the container element
- Bubbles and can be captured globally

### Additional Resources

- [Blockly Documentation](https://developers.google.com/blockly)
- [Custom Block Definitions](https://developers.google.com/blockly/guides/create-custom-blocks/define-blocks)
- [GitHub Repository](https://github.com/F1R3FLY-io/OSLF-editor)

## Project Structure

- `/editor` - Main editor package (published to npm as `@f1r3fly.io/oslf-editor`)
- `/playground` - Development playgrounds for testing (not published)
  - `/react` - React integration using local editor link
  - `/react-npm` - Testing published npm package
  - `/vanilla` - Vanilla JS example
- `/docs` - GitHub Pages demo site

## Development

### Quick Start

```bash
# Install all dependencies
make install

# Build editor in watch mode
make dev

# Start React playground (in a separate terminal)
make playground-react-open
```

### Available Commands

#### Installation
- `make install` - Install all dependencies (editor + playgrounds + docs)
- `make install-editor` - Install editor dependencies only
- `make install-playground-react` - Install React playground dependencies
- `make install-playground-react-npm` - Install React NPM playground dependencies
- `make install-playground-vanilla` - Install Vanilla playground dependencies
- `make install-docs` - Install docs dependencies

#### Editor Commands
- `make editor-dev` - Build editor in watch mode
- `make editor-build` - Build and minify editor for production
- `make editor-test` - Run editor tests
- `make editor-clean` - Clean editor build artifacts

#### Playground Commands
- `make playground-react-dev` - Build React playground in watch mode
- `make playground-react-open` - Serve React playground locally
- `make playground-react-npm-dev` - Build React NPM playground in watch mode
- `make playground-react-npm-open` - Serve React NPM playground locally
- `make playground-vanilla-dev` - Build Vanilla playground in watch mode
- `make playground-vanilla-open` - Serve Vanilla playground locally

#### Documentation/GitHub Pages Commands
- `make docs-dev` - Build docs in watch mode
- `make docs-build` - Build docs for production
- `make docs-open` - Serve docs locally

#### Shortcut Commands
- `make dev` - Alias for `make editor-dev`
- `make build` - Alias for `make editor-build`
- `make clean` - Alias for `make editor-clean`
- `make test` - Alias for `make editor-test`

#### CI/Testing Commands
- `make install-gh-act` - Install gh act extension for local CI testing
- `make prefetch-act-image` - Download and configure gh act medium Docker image
- `make test-ci` - Run CI tests locally (simulates GitHub Actions)
- `make setup-hooks` - Install git hooks for local CI testing

#### Release Commands
- `make release-fix` - Create and push fix version release
- `make release-feature` - Create and push feature version release
- `make release-breaking` - Create and push breaking version release

## Releasing a New Version (For Contributors)

### Create a Release

Use one command to bump the version, create a tag, and push:

```bash
make release-fix       # 0.0.1 → 0.0.2 (bug fixes)
make release-feature   # 0.0.1 → 0.1.0 (new features)
make release-breaking  # 0.0.1 → 1.0.0 (breaking changes)
```

This will:
1. Bump the version in `editor/package.json`
2. Commit the version change
3. Create and push a git tag
4. Push the commit to main

### Publish to npm

After creating a release, publish it on GitHub:

1. Go to [Releases](https://github.com/F1R3FLY-io/OSLF-editor/releases/new)
2. Select the tag that was just created
3. Add release notes
4. Click "Publish release"

The GitHub Actions workflow will automatically build and publish the package to npm.

### Manual Publishing

To publish without creating a GitHub release:

```bash
make build
cd editor
pnpm publish
```

## Design

Figma design: https://www.figma.com/design/mcnjC8JQvGml8Wmm6idTJz/OSLF?node-id=124-7075&p=f&t=9kPJbhxDzvLMc0I1-0
