/**
 * Default configuration options for data-drag elements
 * These are the baseline settings that can be overridden per element
 * @type {Object}
 */
const defaults = {
  direction: 'vertical',  // 'vertical' or 'horizontal' layout
  copy: false,           // Create copies when dragging to other containers
  sort: true,            // Allow sorting within the container
  handle: null,          // CSS selector for drag handle (null = entire element)
  animation: 150         // Animation duration in milliseconds
};

/**
 * Access Control System - Apache-style allow/deny rules
 * Controls which containers can accept items from which sources
 *
 * @class Access
 * @example
 * const access = new Access({
 *   order: ['deny', 'allow'],
 *   allow: ['.library'],
 *   deny: ['.toolbox']
 * });
 */
class Access {
  /**
   * Create an access control instance
   * @param {Object} config - Access configuration object
   * @param {Array<string>} config.order - Evaluation order: ['allow', 'deny'] or ['deny', 'allow']
   * @param {Array<string>} config.allow - CSS selectors to allow (use '*' for all)
   * @param {Array<string>} config.deny - CSS selectors to deny
   */
  constructor(config = {}) {
    this.order = config.order || ['allow', 'deny'];
    this.allow = config.allow || ['*'];
    this.deny = config.deny || [];
  }

  /**
   * Determine if an item can be accepted from a source parent
   * Uses Apache-style allow/deny logic based on order precedence
   *
   * @param {HTMLElement} item - The item being dragged
   * @param {HTMLElement} sourceParent - The parent container it's coming from
   * @returns {boolean} True if the item can be accepted
   */
  canAccept(item, sourceParent) {
    // No source means item is being created, always allow
    if (!sourceParent) return true;

    // Check if source matches our allow/deny patterns
    const sourceMatchesAllow = this.matches(sourceParent, this.allow);
    const sourceMatchesDeny = this.matches(sourceParent, this.deny);

    // Order matters: process deny or allow first based on configuration
    const isDenyFirst = (this.order[0] === 'deny');

    if (isDenyFirst) {
      // Deny rules evaluated first (most restrictive)
      if (sourceMatchesDeny) return false;
      if (sourceMatchesAllow) return true;
      return false;
    } else {
      // Allow rules evaluated first (most permissive)
      const isAllowedAndNotDenied = (sourceMatchesAllow && !sourceMatchesDeny);
      return isAllowedAndNotDenied;
    }
  }

  /**
   * Check if an element matches any pattern in a list
   *
   * @param {HTMLElement} element - Element to test
   * @param {Array<string>} patterns - Array of CSS selector patterns
   * @returns {boolean} True if element matches any pattern
   */
  matches(element, patterns) {
    // Wildcard matches everything
    const hasWildcard = patterns.includes('*');
    if (hasWildcard) return true;

    // Test each pattern against the element
    return patterns.some(pattern => {
      try {
        return element.matches(pattern);
      } catch (e) {
        console.warn('Invalid selector pattern:', pattern);
        return false;
      }
    });
  }
}

/**
 * DataDrag - Drag and drop sortable lists with cross-shadow-root support
 *
 * Features:
 * - Drag and drop between containers
 * - Copy mode for duplicating items
 * - Access control (allow/deny rules)
 * - Adoption system (auto-configure dropped items)
 * - Shadow DOM support
 * - Smooth animations
 *
 * @class DataDrag
 * @example
 * // Auto-initialized for document
 *
 * // For web components with shadow DOM
 * const dataDrag = new DataDrag(shadowRoot);
 */
class DataDrag {
  /**
   * Global registry of all DataDrag instances
   * Used to coordinate cross-shadow-root dragging
   * @static
   * @type {Set<DataDrag>}
   */
  static instances = new Set();

  /**
   * Shared drag state across all instances
   * Enables dragging between different shadow roots
   * @static
   * @type {Object|null}
   */
  static globalDragState = null;

  /**
   * Create a new DataDrag instance for a root element
   *
   * @param {Document|ShadowRoot} root - The root element to attach event listeners to
   */
  constructor(root = document) {
    this.root = root;
    this.dragState = null;

    // Bind methods to preserve 'this' context
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    // Register event listener for this root
    this.root.addEventListener('mousedown', this.handleMouseDown, true);

    // Add to global registry for cross-root coordination
    DataDrag.instances.add(this);
  }

  /**
   * Parse data-drag attribute into configuration object
   * Handles JSON parsing with single-quote support (Bootstrap style)
   *
   * @static
   * @param {HTMLElement} element - Element with data-drag attribute
   * @returns {Object} Configuration object with defaults applied
   */
  static parseOptions(element) {
    const attr = element.getAttribute('data-drag');

    // Handle empty or "true" as default config
    const hasNoConfig = (!attr || attr === 'true');
    if (hasNoConfig) return { ...defaults };

    try {
      // Convert single quotes to double quotes for JSON parsing
      const parsed = JSON.parse(attr.replace(/'/g, '"'));
      return { ...defaults, ...parsed };
    } catch (error) {
      console.warn('Invalid data-drag options:', attr, error);
      return { ...defaults };
    }
  }

  /**
   * Parse data-drag-parent attribute into configuration object
   * Returns null if attribute doesn't exist (JSON-only, no "true" shorthand)
   *
   * @static
   * @param {HTMLElement} element - Parent element with configuration
   * @returns {Object|null} Configuration object or null
   */
  static parseParentOptions(element) {
    const attr = element.getAttribute('data-drag-parent');

    // No attribute means no configuration
    if (!attr) return null;

    try {
      // Convert single quotes to double quotes for JSON parsing
      return JSON.parse(attr.replace(/'/g, '"'));
    } catch (error) {
      console.warn('Invalid data-drag-parent options:', attr, error);
      return null;
    }
  }

  /**
   * Dispatch a custom data-drag event
   * Events bubble and cross shadow boundaries (composed: true)
   *
   * @static
   * @param {HTMLElement} target - Element to dispatch event from
   * @param {string} eventName - Name of event (without 'datadrag:' prefix)
   * @param {Object} detail - Event detail data
   */
  static dispatchEvent(target, eventName, detail) {
    if (!target) return;

    const event = new CustomEvent(`datadrag:${eventName}`, {
      detail,
      bubbles: true,      // Event bubbles up the DOM tree
      composed: true,     // Event crosses shadow DOM boundaries
      cancelable: true    // Event can be prevented by listeners
    });

    target.dispatchEvent(event);
  }

  /**
   * Find an element in the event's composed path that matches a selector
   * Works across shadow DOM boundaries by using composedPath()
   *
   * @static
   * @param {Event} event - Mouse event with composed path
   * @param {string} selector - CSS selector to match
   * @returns {HTMLElement|null} Matching element or null
   */
  static findInPath(event, selector) {
    // Get full path including shadow DOM elements
    const path = event.composedPath();

    for (const element of path) {
      const isElementNode = (element.nodeType === 1);
      const matchesSelector = isElementNode && element.matches?.(selector);

      if (matchesSelector) {
        return element;
      }
    }

    return null;
  }

  /**
   * Walk up the DOM tree to find a parent matching selector
   * Traverses through shadow DOM boundaries via .host property
   *
   * @static
   * @param {HTMLElement} element - Starting element
   * @param {string} selector - CSS selector to match
   * @returns {HTMLElement|null} Matching parent or null
   */
  static findParentInTree(element, selector) {
    let current = element;

    while (current) {
      const matchesSelector = current.matches?.(selector);
      if (matchesSelector) {
        return current;
      }

      // Try different ways to traverse up the tree
      if (current.parentElement) {
        // Normal DOM parent
        current = current.parentElement;
      }
      else if (current.parentNode?.host) {
        // Shadow DOM host (crossing shadow boundary)
        current = current.parentNode.host;
      }
      else if (current.parentNode && current.parentNode !== document) {
        // Other parent node types
        current = current.parentNode;
      }
      else {
        // Reached the top
        break;
      }
    }

    return null;
  }

  /**
   * Find a drop parent at screen coordinates across all shadow roots
   * Checks all registered DataDrag instances for valid drop targets
   *
   * @static
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {HTMLElement|null} Drop parent element or null
   */
  static findDropParent(x, y) {
    // Check each registered root for drop targets
    for (const instance of DataDrag.instances) {
      const root = instance.root;

      let element;
      const isDocumentRoot = (root === document);

      if (isDocumentRoot) {
        // Easy case: check document
        element = document.elementFromPoint(x, y);
      } else {
        // Shadow root: check if coordinates are within host bounds
        const host = root.host;
        if (host) {
          const hostRect = host.getBoundingClientRect();
          const xWithinHost = (x >= hostRect.left && x <= hostRect.right);
          const yWithinHost = (y >= hostRect.top && y <= hostRect.bottom);
          const pointWithinHost = (xWithinHost && yWithinHost);

          if (pointWithinHost) {
            element = root.elementFromPoint(x, y);
          }
        }
      }

      // If we found an element, search for data-drag parent
      if (element) {
        const parent = DataDrag.findParentInTree(element, '[data-drag-parent]');
        if (parent) return parent;
      }
    }

    return null;
  }

  /**
   * Apply adoption configuration to a dropped item
   * Sets attributes defined in parent's "adopted" config
   *
   * @static
   * @param {HTMLElement} item - The dropped item element
   * @param {HTMLElement} parent - The parent container with adoption rules
   *
   * @example
   * // Parent config: {"adopted": {"class": "item", "data-drag": {"sort": true}}}
   * // Result: item gets class="item" and data-drag='{"sort":true}'
   */
  static applyAdoption(item, parent) {
    const parentConfig = DataDrag.parseParentOptions(parent);

    const hasAdoptionRules = (parentConfig?.adopted);
    if (!hasAdoptionRules) return;

    // Apply each attribute defined in adoption config
    Object.entries(parentConfig.adopted).forEach(([attribute, value]) => {
      const valueIsObject = (typeof value === 'object');

      if (valueIsObject) {
        // Convert object to JSON with single quotes (Bootstrap style)
        const jsonValue = JSON.stringify(value).replace(/"/g, "'");
        item.setAttribute(attribute, jsonValue);
      } else {
        // Simple string/number value
        item.setAttribute(attribute, value);
      }
    });

    // Notify that adoption occurred
    DataDrag.dispatchEvent(parent, 'adopted', {
      item,
      parent,
      adopted: parentConfig.adopted
    });
  }

  /**
   * Create a visual mirror element that follows the cursor during drag
   * The mirror is a clone of the dragged item positioned at cursor coordinates
   *
   * @param {HTMLElement} element - Element to mirror
   * @returns {HTMLElement} Mirror element
   */
  createMirror(element) {
    const rect = element.getBoundingClientRect();
    const mirror = element.cloneNode(true);

    // Style the mirror to follow cursor
    mirror.classList.add('data-drag-mirror');
    mirror.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      width: ${rect.width}px;
      height: ${rect.height}px;
      left: ${rect.left}px;
      top: ${rect.top}px;
      opacity: 0.8;
      margin: 0;
    `;

    document.body.appendChild(mirror);
    return mirror;
  }

  /**
   * Find the correct position to insert the dragged element
   * Returns the element that should come after the insertion point
   *
   * @param {HTMLElement} container - Parent container
   * @param {Object} options - Configuration options
   * @param {number} clientX - Mouse X coordinate
   * @param {number} clientY - Mouse Y coordinate
   * @param {HTMLElement} dragElement - Element being dragged
   * @returns {HTMLElement|null} Reference element for insertion, or null for end
   */
  findInsertPosition(container, options, clientX, clientY, dragElement) {
    // Get all data-drag children except the dragged element and mirror
    const children = Array.from(container.children).filter(child => {
      const isDragElement = (child === dragElement);
      const isMirror = (child === DataDrag.globalDragState?.mirror);
      const isDataDrag = child.hasAttribute('data-drag');

      return !isDragElement && !isMirror && isDataDrag;
    });

    const isHorizontal = (options.direction === 'horizontal');

    // Find first child whose midpoint is after the cursor
    for (const child of children) {
      const rect = child.getBoundingClientRect();

      const midpoint = isHorizontal
        ? rect.left + rect.width / 2
        : rect.top + rect.height / 2;

      const coordinate = isHorizontal ? clientX : clientY;

      const cursorBeforeMidpoint = (coordinate < midpoint);
      if (cursorBeforeMidpoint) {
        return child;
      }
    }

    // No child found means insert at end
    return null;
  }

  /**
   * Remove all drag-related classes and styles from an element
   * Cleanup function to restore element to normal state
   *
   * @param {HTMLElement} element - Element to clean up
   */
  cleanupElement(element) {
    if (!element) return;

    element.classList.remove('data-drag-dragging');
    element.style.opacity = '';
    element.style.transition = '';
    element.style.transform = '';
  }

  /**
   * Animate element from old position to new position
   * Uses FLIP technique: measure before/after, then animate the difference
   *
   * @param {HTMLElement} element - Element to animate
   * @param {DOMRect} fromRect - Original bounding rectangle
   * @param {DOMRect} toRect - New bounding rectangle
   * @param {number} duration - Animation duration in milliseconds
   */
  animateInsertion(element, fromRect, toRect, duration) {
    const deltaX = fromRect.left - toRect.left;
    const deltaY = fromRect.top - toRect.top;

    const hasNotMoved = (deltaX === 0 && deltaY === 0);
    if (hasNotMoved) return;

    // Start at old position (transformed)
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    element.style.transition = 'none';

    // Animate to new position (no transform)
    requestAnimationFrame(() => {
      element.style.transition = `transform ${duration}ms ease`;
      element.style.transform = 'translate(0, 0)';
    });
  }

  /**
   * Handle mouse down event - start of potential drag
   * Validates drag handle, finds parent, and sets up drag state
   *
   * @param {MouseEvent} event - Mouse down event
   */
  handleMouseDown(event) {
    const isLeftClick = (event.button === 0);
    if (!isLeftClick) return;

    const alreadyDragging = (DataDrag.globalDragState !== null);
    if (alreadyDragging) return;

    // Find the data-drag item that was clicked
    const item = DataDrag.findInPath(event, '[data-drag]');
    if (!item) return;

    // Check configuration for this item
    const options = DataDrag.parseOptions(item);

    // If handle is specified, ensure click was on handle
    const requiresHandle = (options.handle !== null);
    if (requiresHandle) {
      const clickedHandle = DataDrag.findInPath(event, options.handle);
      if (!clickedHandle) return;
    }

    // Find the data-drag parent container
    const parent = DataDrag.findInPath(event, '[data-drag-parent]');
    if (!parent) return;

    // Calculate offset from item's top-left corner to cursor
    const rect = item.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // Initialize drag state
    this.dragState = {
      item,
      parent,
      options,
      offsetX,
      offsetY,
      startX: event.clientX,
      startY: event.clientY,
      mirror: null,
      copy: null,
      isDragging: false,
      sourceInstance: this
    };

    // Store in global state for cross-root coordination
    DataDrag.globalDragState = this.dragState;

    // Set up event listeners for drag operation
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);

    event.preventDefault();
  }

  /**
   * Handle mouse move event - track cursor and update drag state
   * Creates mirror on first move, checks drop targets, animates transitions
   *
   * @param {MouseEvent} event - Mouse move event
   */
  handleMouseMove(event) {
    const state = DataDrag.globalDragState;
    if (!state) return;

    // Calculate distance moved from start
    const distanceMoved = Math.hypot(
      event.clientX - state.startX,
      event.clientY - state.startY
    );

    const notYetDragging = !state.isDragging;
    if (notYetDragging) {
      // Require minimum movement before starting drag (prevents accidental drags)
      const meetsThreshold = (distanceMoved >= 5);
      if (!meetsThreshold) return;

      // Initialize drag visuals
      state.isDragging = true;
      state.mirror = this.createMirror(state.item);
      state.item.classList.add('data-drag-dragging');
      state.item.style.opacity = '0.4';

      DataDrag.dispatchEvent(state.parent, 'start', {
        item: state.item,
        parent: state.parent
      });
    }

    // Update mirror position to follow cursor
    const mirrorX = event.clientX - state.offsetX;
    const mirrorY = event.clientY - state.offsetY;
    state.mirror.style.left = `${mirrorX}px`;
    state.mirror.style.top = `${mirrorY}px`;

    // Find drop target by hiding mirror and checking element at cursor
    state.mirror.style.display = 'none';
    const dropParent = DataDrag.findDropParent(event.clientX, event.clientY);
    state.mirror.style.display = '';

    const noValidDropTarget = !dropParent;
    if (noValidDropTarget) return;

    // Check access control rules
    const parentConfig = DataDrag.parseParentOptions(dropParent);
    const hasAccessRules = (parentConfig?.access);

    if (hasAccessRules) {
      const access = new Access(parentConfig.access);
      const accessDenied = !access.canAccept(state.item, state.parent);
      if (accessDenied) return;
    }

    // Determine copy and sort behavior
    const isDifferentParent = (dropParent !== state.parent);
    const shouldCreateCopy = (state.options.copy && isDifferentParent);
    const canSortInParent = (state.options.sort || isDifferentParent);

    // Handle copy creation/removal based on current parent
    const needsNewCopy = (shouldCreateCopy && !state.copy);
    const needsRemoveCopy = (!shouldCreateCopy && state.copy);

    if (needsNewCopy) {
      state.copy = state.item.cloneNode(true);
      DataDrag.dispatchEvent(state.parent, 'cloned', {
        original: state.item,
        copy: state.copy
      });
    } else if (needsRemoveCopy) {
      state.copy.remove();
      state.copy = null;
    }

    if (!canSortInParent) return;

    // Determine which element to manipulate (copy or original)
    const activeElement = state.copy || state.item;

    // Find where to insert in the target container
    const reference = this.findInsertPosition(
      dropParent,
      state.options,
      event.clientX,
      event.clientY,
      activeElement
    );

    // Check if position has changed
    const parentChanged = (activeElement.parentElement !== dropParent);
    const positionChanged = (activeElement.nextElementSibling !== reference);
    const needsInsertion = (parentChanged || positionChanged);

    if (needsInsertion) {
      const oldParent = activeElement.parentElement;
      const oldRect = activeElement.getBoundingClientRect();

      // Insert at new position
      dropParent.insertBefore(activeElement, reference);

      // Animate the transition if configured
      const shouldAnimate = (state.options.animation);
      if (shouldAnimate) {
        const newRect = activeElement.getBoundingClientRect();
        this.animateInsertion(activeElement, oldRect, newRect, state.options.animation);
      }

      // Notify about the move
      DataDrag.dispatchEvent(dropParent, 'move', {
        item: activeElement,
        from: oldParent,
        to: dropParent,
        reference
      });
    }
  }

  /**
   * Handle mouse up event - end of drag operation
   * Applies adoption rules, dispatches events, cleans up
   *
   * @param {MouseEvent} event - Mouse up event
   */
  handleMouseUp() {
    const state = DataDrag.globalDragState;
    if (!state) return;

    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    const neverStartedDragging = !state.isDragging;
    if (neverStartedDragging) {
      // Was just a click, not a drag
      DataDrag.globalDragState = null;
      this.dragState = null;
      return;
    }

    // Determine final state
    const activeElement = state.copy || state.item;
    const finalParent = activeElement.parentElement;

    const isValidDrop = DataDrag.findParentInTree(
      finalParent,
      '[data-drag-parent]'
    );

    // Remove mirror
    if (state.mirror) {
      state.mirror.remove();
    }

    // Clean up visual states
    this.cleanupElement(state.item);
    this.cleanupElement(state.copy);

    if (isValidDrop) {
      // Apply adoption configuration from target parent
      DataDrag.applyAdoption(activeElement, finalParent);

      // Notify successful drop
      DataDrag.dispatchEvent(finalParent, 'drop', {
        item: activeElement,
        from: state.parent,
        to: finalParent,
        isCopy: !!state.copy
      });
    } else {
      // Invalid drop location - clean up copy if it exists
      if (state.copy) {
        state.copy.remove();
      }

      // Notify cancellation
      DataDrag.dispatchEvent(state.parent, 'cancel', {
        item: state.item,
        parent: state.parent
      });
    }

    // Clear drag state
    DataDrag.globalDragState = null;
    this.dragState = null;
  }

  /**
   * Destroy this DataDrag instance
   * Removes event listeners and unregisters from global registry
   */
  destroy() {
    this.root.removeEventListener('mousedown', this.handleMouseDown, true);
    DataDrag.instances.delete(this);

    const thisInstanceIsDragging = (this.dragState === DataDrag.globalDragState);
    if (thisInstanceIsDragging) {
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
      DataDrag.globalDragState = null;
    }

    this.dragState = null;
  }
}

// Auto-initialize for document scope
const globalInstance = new DataDrag(document);

// Add default styles to document
if (!document.getElementById('data-drag-styles')) {
  const style = document.createElement('style');
  style.id = 'data-drag-styles';
  style.textContent = `
    [data-drag-parent] { position: relative; }
    .data-drag-dragging { cursor: move !important; }
    .data-drag-mirror { cursor: move !important; }
  `;
  document.head.appendChild(style);
}

// Export for ES modules
export { DataDrag, Access };

// Also expose globally for non-module usage
if (typeof window !== 'undefined') {
  window.DataDrag = DataDrag;
  window.DataDragAccess = Access;
}
