# 🚀 data-drag

> **Lightweight, beautifully coded, well-documented drag-and-drop library with Web Component support**

[![npm version](https://img.shields.io/npm/v/data-drag.svg)](https://www.npmjs.com/package/data-drag)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**data-drag** makes complex drag-and-drop interactions simple by using declarative HTML attributes. Built for modern web development with first-class Shadow DOM support, it's perfect for teaching, learning, and building powerful interfaces.

---

## 🎓 Theory: Understanding Drag and Drop

Before diving into code, let's understand the fundamentals of drag-and-drop interfaces:

### What is Drag and Drop?

Drag and drop is a **direct manipulation** interface pattern where users:
1. **Press** on an element (grab it)
2. **Move** their cursor while pressed (drag it)
3. **Release** over a target location (drop it)

This mimics real-world object manipulation, making interfaces more intuitive.

### The Challenges

Building drag-and-drop systems involves solving several problems:

**1. Visual Feedback** - Users need to see what they're dragging
- Solution: A "mirror" element follows the cursor

**2. Drop Targets** - Where can items be dropped?
- Solution: Designated container elements with rules

**3. Copy vs. Move** - Should dragging duplicate or relocate?
- Solution: Configurable behavior per element

**4. Boundaries** - What if we have Web Components with Shadow DOM?
- Solution: Cross-boundary coordination (our special feature!)

**5. Access Control** - Not everything should go everywhere
- Solution: Apache-style allow/deny rules

**data-drag** solves all these problems with simple HTML attributes!

---

## ✨ Features

- 🎯 **Zero Dependencies** - Pure JavaScript, no framework required
- 📦 **Tiny Size** - ~8KB minified, ~3KB gzipped
- 🌐 **Shadow DOM Support** - Works across Web Component boundaries
- 🎨 **Highly Configurable** - JSON-based attribute configuration
- 📋 **Copy Mode** - Duplicate items or move them
- 🔒 **Access Control** - Apache-style allow/deny rules
- 🎭 **Adoption System** - Auto-configure dropped items
- ⚡ **Smooth Animations** - FLIP technique for 60fps performance
- 📚 **Educational** - Extensively commented source code
- 🧪 **TypeScript Ready** - Full type definitions included

---

## 📦 Installation

### NPM
```bash
npm install data-drag
```

### CDN
```html
<script type="module">
  import { DataDrag } from 'https://cdn.jsdelivr.net/npm/data-drag/index.js';
</script>
```

### Direct Download
Download `index.js` from [GitHub](https://github.com/catpea/data-drag)

---

## 🚀 Quick Start

### 1. Basic Sortable List

The simplest example - a sortable to-do list:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    [data-drag-parent] {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      min-height: 100px;
    }

    [data-drag] {
      padding: 12px;
      margin: 8px 0;
      background: white;
      border-radius: 4px;
      cursor: move;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <ul data-drag-parent='{}'>
    <li data-drag='{"sort":true}'>📝 Learn HTML</li>
    <li data-drag='{"sort":true}'>🎨 Learn CSS</li>
    <li data-drag='{"sort":true}'>⚡ Learn JavaScript</li>
    <li data-drag='{"sort":true}'>🚀 Build Amazing Things!</li>
  </ul>

  <script type="module">
    import { DataDrag } from './node_modules/data-drag/index.js';
    // That's it! Already working! 🎉
  </script>
</body>
</html>
```

**Try it:** Drag items to reorder them!

---

## 📖 Core Concepts

### 1. The Two Attributes

**`data-drag`** - Marks an element as draggable
```html
<li data-drag='{"sort":true, "copy":false}'>I can be dragged!</li>
```

**`data-drag-parent`** - Marks a container that accepts draggable items
```html
<ul data-drag-parent='{"adopted":{"class":"item"}}'>
  <!-- Draggable items go here -->
</ul>
```

### 2. Configuration Options

#### For Draggable Items (`data-drag`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sort` | boolean | `true` | Allow sorting within the same container |
| `copy` | boolean | `false` | Create copies when dragging to other containers |
| `direction` | string | `'vertical'` | Layout direction: `'vertical'` or `'horizontal'` |
| `handle` | string | `null` | CSS selector for drag handle |
| `animation` | number | `150` | Animation duration in milliseconds |

#### For Containers (`data-drag-parent`)

| Option | Type | Description |
|--------|------|-------------|
| `adopted` | object | Attributes to apply to dropped items |
| `access` | object | Access control rules (allow/deny) |

---

## 🎯 Complete Examples

### Example 1: Kanban Board (Copy Mode)

Create a template palette where items can be copied but not reordered:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 20px;
      background: #f0f0f0;
    }

    .board {
      display: grid;
      grid-template-columns: 200px 1fr 1fr 1fr;
      gap: 16px;
    }

    .column {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .column h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #666;
    }

    [data-drag-parent] {
      min-height: 200px;
      padding: 8px;
      background: #f8f8f8;
      border-radius: 4px;
    }

    [data-drag] {
      padding: 12px;
      margin: 6px 0;
      border-radius: 4px;
      cursor: move;
      user-select: none;
    }

    .templates [data-drag] {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .backlog [data-drag],
    .progress [data-drag],
    .done [data-drag] {
      background: white;
      border: 2px solid #e0e0e0;
      color: #333;
    }
  </style>
</head>
<body>
  <h1>📋 Kanban Board</h1>

  <div class="board">
    <!-- Template Palette (copy-only, no sorting) -->
    <div class="column templates">
      <h3>🎨 Templates</h3>
      <div data-drag-parent='{}'>
        <div data-drag='{"copy":true, "sort":false}'>📄 Task</div>
        <div data-drag='{"copy":true, "sort":false}'>🐛 Bug</div>
        <div data-drag='{"copy":true, "sort":false}'>✨ Feature</div>
        <div data-drag='{"copy":true, "sort":false}'>📝 Note</div>
      </div>
    </div>

    <!-- Backlog (adopts configuration) -->
    <div class="column backlog">
      <h3>📥 Backlog</h3>
      <div data-drag-parent='{
        "adopted": {
          "data-drag": {"sort":true, "copy":false},
          "class": "task-item"
        }
      }'>
        <div data-drag='{"sort":true}'>Fix login bug</div>
      </div>
    </div>

    <!-- In Progress -->
    <div class="column progress">
      <h3>⏳ In Progress</h3>
      <div data-drag-parent='{
        "adopted": {
          "data-drag": {"sort":true, "copy":false}
        }
      }'>
        <div data-drag='{"sort":true}'>Build navbar</div>
      </div>
    </div>

    <!-- Done -->
    <div class="column done">
      <h3>✅ Done</h3>
      <div data-drag-parent='{
        "adopted": {
          "data-drag": {"sort":true, "copy":false}
        }
      }'>
        <div data-drag='{"sort":true}'>Setup project</div>
      </div>
    </div>
  </div>

  <script type="module">
    import { DataDrag } from './node_modules/data-drag/index.js';

    // Listen for events
    document.addEventListener('datadrag:drop', (e) => {
      console.log('Item dropped:', e.detail);

      // Update timestamps, save to database, etc.
      if (e.detail.isCopy) {
        console.log('This was a copy!');
      }
    });
  </script>
</body>
</html>
```

### Example 2: Access Control

Restrict which containers can accept items from specific sources:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .container {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      padding: 20px;
    }

    .list {
      padding: 16px;
      border-radius: 8px;
      min-height: 200px;
    }

    .list h3 {
      margin: 0 0 12px 0;
    }

    .toolbox {
      background: #ffe5e5;
      border: 2px solid #ff6b6b;
    }

    .library {
      background: #e5f5ff;
      border: 2px solid #4dabf7;
    }

    .workspace {
      background: #e5ffe5;
      border: 2px solid #51cf66;
    }

    [data-drag] {
      padding: 10px;
      margin: 6px 0;
      background: white;
      border-radius: 4px;
      cursor: move;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Source 1: Toolbox -->
    <div class="list toolbox">
      <h3>🔧 Toolbox</h3>
      <div data-drag-parent='{}'>
        <div data-drag='{"copy":true, "sort":false}'>Hammer</div>
        <div data-drag='{"copy":true, "sort":false}'>Wrench</div>
      </div>
    </div>

    <!-- Source 2: Library -->
    <div class="list library">
      <h3>📚 Library</h3>
      <div data-drag-parent='{}'>
        <div data-drag='{"copy":true, "sort":false}'>Book A</div>
        <div data-drag='{"copy":true, "sort":false}'>Book B</div>
      </div>
    </div>

    <!-- Target: Only accepts from Library -->
    <div class="list workspace">
      <h3>📖 Reading List</h3>
      <p style="font-size: 12px; color: #666;">
        Only accepts books from library!<br>
        Try dragging tools - they'll be rejected.
      </p>
      <div data-drag-parent='{
        "adopted": {"data-drag": {"sort":true}},
        "access": {
          "order": ["allow", "deny"],
          "allow": [".library"],
          "deny": []
        }
      }'>
        <div data-drag='{"sort":true}'>Existing Book</div>
      </div>
    </div>
  </div>

  <script type="module">
    import { DataDrag } from './node_modules/data-drag/index.js';
  </script>
</body>
</html>
```

### Example 3: Drag Handles

Only allow dragging by a specific handle element:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    [data-drag] {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      margin: 8px 0;
      background: white;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .handle {
      cursor: move;
      padding: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      font-size: 18px;
    }

    .content {
      flex: 1;
    }

    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      background: #4dabf7;
      color: white;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div data-drag-parent='{}'>
    <div data-drag='{"handle":".handle"}'>
      <span class="handle">⋮⋮</span>
      <div class="content">
        <strong>Task with Handle</strong>
        <p>Try clicking the handle vs clicking the button</p>
      </div>
      <button onclick="alert('Button clicked!')">Click Me</button>
    </div>

    <div data-drag='{"handle":".handle"}'>
      <span class="handle">⋮⋮</span>
      <div class="content">
        <strong>Another Task</strong>
        <p>Only the handle (⋮⋮) triggers dragging</p>
      </div>
      <button onclick="alert('Works!')">Action</button>
    </div>
  </div>

  <script type="module">
    import { DataDrag } from './node_modules/data-drag/index.js';
  </script>
</body>
</html>
```

### Example 4: Web Components with Shadow DOM

**data-drag** works seamlessly across Shadow DOM boundaries:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      padding: 20px;
      font-family: system-ui, sans-serif;
    }
  </style>
</head>
<body>
  <h1>🌐 Web Components Demo</h1>

  <task-list title="Component A"></task-list>
  <task-list title="Component B"></task-list>

  <p style="margin-top: 20px; color: #666;">
    ✨ Drag items between components - they have separate Shadow DOMs!
  </p>

  <script type="module">
    import { DataDrag } from './node_modules/data-drag/index.js';

    class TaskList extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }

      connectedCallback() {
        const title = this.getAttribute('title') || 'Tasks';

        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              margin: 20px 0;
            }

            .container {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            h2 {
              margin: 0 0 16px 0;
              color: #333;
            }

            [data-drag-parent] {
              min-height: 100px;
              padding: 12px;
              background: #f8f8f8;
              border-radius: 6px;
            }

            [data-drag] {
              padding: 12px;
              margin: 8px 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 4px;
              cursor: move;
            }
          </style>

          <div class="container">
            <h2>${title}</h2>
            <div data-drag-parent='{"adopted":{"data-drag":{"sort":true}}}'>
              <div data-drag='{"sort":true}'>Task 1</div>
              <div data-drag='{"sort":true}'>Task 2</div>
              <div data-drag='{"sort":true}'>Task 3</div>
            </div>
          </div>
        `;

        // Initialize DataDrag for this shadow root
        this.dataDrag = new DataDrag(this.shadowRoot);

        // Listen to events
        this.shadowRoot.addEventListener('datadrag:drop', (e) => {
          console.log(`${title} received drop:`, e.detail);
        });
      }

      disconnectedCallback() {
        if (this.dataDrag) {
          this.dataDrag.destroy();
        }
      }
    }

    customElements.define('task-list', TaskList);
  </script>
</body>
</html>
```

---

## 📡 Events

Listen to drag-and-drop events to update your application:

```javascript
// When dragging starts
document.addEventListener('datadrag:start', (e) => {
  console.log('Started dragging:', e.detail.item);
});

// When item moves between positions
document.addEventListener('datadrag:move', (e) => {
  console.log('Moved from:', e.detail.from, 'to:', e.detail.to);
});

// When item is dropped successfully
document.addEventListener('datadrag:drop', (e) => {
  const { item, from, to, isCopy } = e.detail;

  if (isCopy) {
    console.log('Created a copy!');
  }

  // Save to database, update state, etc.
  saveToDatabase(item, to);
});

// When drag is cancelled
document.addEventListener('datadrag:cancel', (e) => {
  console.log('Drag cancelled');
});

// When a copy is created
document.addEventListener('datadrag:cloned', (e) => {
  console.log('Cloned:', e.detail.copy);
});

// When adoption rules are applied
document.addEventListener('datadrag:adopted', (e) => {
  console.log('Adopted with config:', e.detail.adopted);
});
```

All events bubble and work across Shadow DOM boundaries!

---

## 🎨 Styling

**data-drag** adds these CSS classes during drag operations:

```css
/* Applied to the element being dragged */
.data-drag-dragging {
  opacity: 0.4;
  cursor: move !important;
}

/* Applied to the mirror element following cursor */
.data-drag-mirror {
  opacity: 0.8;
  pointer-events: none;
  position: fixed;
  z-index: 9999;
}
```

Customize them in your stylesheet:

```css
.data-drag-dragging {
  opacity: 0.6;
  transform: scale(0.95);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.data-drag-mirror {
  opacity: 0.9;
  transform: rotate(3deg);
}
```

---

## 🔧 API Reference

### DataDrag Class

```javascript
import { DataDrag } from 'data-drag';

// Create instance for document (auto-initialized)
// Already done! No need to call this.

// Create instance for shadow root
const dataDrag = new DataDrag(shadowRoot);

// Destroy instance
dataDrag.destroy();
```

### Access Class

```javascript
import { Access } from 'data-drag';

const access = new Access({
  order: ['deny', 'allow'],
  allow: ['.approved'],
  deny: ['.restricted']
});

const canAccept = access.canAccept(item, sourceParent);
```

### Static Methods

```javascript
// Parse element configuration
const config = DataDrag.parseOptions(element);

// Parse parent configuration
const parentConfig = DataDrag.parseParentOptions(parentElement);

// Apply adoption rules
DataDrag.applyAdoption(droppedItem, targetParent);
```

---

## 🎓 Educational Use


The source code is extensively documented with:
- 📝 Explanatory variables for clarity
- 💡 JSDoc comments on every method
- 🎯 Clear intent over optimization
- 🧠 Educational comments explaining "why"

Perfect for:
- Learning JavaScript patterns
- Understanding drag-and-drop mechanics
- Teaching web development
- Building educational tools

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write clear, documented code
4. Add examples for new features
5. Submit a pull request

---

## 📄 License

ISC License - see LICENSE file for details

---

## 🙏 Credits

Created with 😼 by [@catpea](https://github.com/catpea)

Part of the Linux Automator project - teaching command-line skills through interactive interfaces.

---

## 🔗 Links

- 📦 [npm package](https://www.npmjs.com/package/data-drag)
- 💻 [GitHub repository](https://github.com/catpea/data-drag)
- 🐛 [Issue tracker](https://github.com/catpea/data-drag/issues)
- 📚 [Full documentation](https://github.com/catpea/data-drag#readme)
- 🎮 [Live demo](https://catpea.github.io/data-drag/)

---

**Made with passion for education and elegant code. Happy dragging! 🚀**
