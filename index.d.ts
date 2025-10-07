/**
 * Configuration options for draggable elements
 */
export interface DataDragOptions {
  /** Layout direction: 'vertical' or 'horizontal' */
  direction?: 'vertical' | 'horizontal';
  /** Create copies when dragging to other containers */
  copy?: boolean;
  /** Allow sorting within the container */
  sort?: boolean;
  /** CSS selector for drag handle (null = entire element) */
  handle?: string | null;
  /** Animation duration in milliseconds */
  animation?: number;
}

/**
 * Access control configuration
 */
export interface AccessConfig {
  /** Evaluation order: ['allow', 'deny'] or ['deny', 'allow'] */
  order: ['allow', 'deny'] | ['deny', 'allow'];
  /** CSS selectors to allow (use '*' for all) */
  allow: string[];
  /** CSS selectors to deny */
  deny: string[];
}

/**
 * Parent container configuration
 */
export interface ParentConfig {
  /** Attributes to apply to dropped items */
  adopted?: Record<string, any>;
  /** Access control rules */
  access?: AccessConfig;
}

/**
 * Event detail for drag events
 */
export interface DragEventDetail {
  /** The item being dragged */
  item: HTMLElement;
  /** The source container */
  parent: HTMLElement;
}

/**
 * Event detail for drop events
 */
export interface DropEventDetail {
  /** The dropped item */
  item: HTMLElement;
  /** The source container */
  from: HTMLElement;
  /** The target container */
  to: HTMLElement;
  /** Whether this was a copy operation */
  isCopy: boolean;
}

/**
 * Event detail for move events
 */
export interface MoveEventDetail {
  /** The item being moved */
  item: HTMLElement;
  /** The previous container */
  from: HTMLElement | null;
  /** The new container */
  to: HTMLElement;
  /** Reference element for insertion */
  reference: HTMLElement | null;
}

/**
 * Event detail for adoption events
 */
export interface AdoptionEventDetail {
  /** The adopted item */
  item: HTMLElement;
  /** The parent container */
  parent: HTMLElement;
  /** The adoption configuration applied */
  adopted: Record<string, any>;
}

/**
 * Event detail for cloned events
 */
export interface ClonedEventDetail {
  /** The original item */
  original: HTMLElement;
  /** The cloned copy */
  copy: HTMLElement;
}

/**
 * Access Control System - Apache-style allow/deny rules
 */
export class Access {
  order: ['allow', 'deny'] | ['deny', 'allow'];
  allow: string[];
  deny: string[];

  /**
   * Create an access control instance
   * @param config - Access configuration object
   */
  constructor(config?: AccessConfig);

  /**
   * Determine if an item can be accepted from a source parent
   * @param item - The item being dragged
   * @param sourceParent - The parent container it's coming from
   * @returns True if the item can be accepted
   */
  canAccept(item: HTMLElement, sourceParent: HTMLElement | null): boolean;

  /**
   * Check if an element matches any pattern in a list
   * @param element - Element to test
   * @param patterns - Array of CSS selector patterns
   * @returns True if element matches any pattern
   */
  matches(element: HTMLElement, patterns: string[]): boolean;
}

/**
 * DataDrag - Drag and drop sortable lists with cross-shadow-root support
 */
export class DataDrag {
  /** Global registry of all DataDrag instances */
  static instances: Set<DataDrag>;
  /** Shared drag state across all instances */
  static globalDragState: any | null;

  /**
   * Create a new DataDrag instance for a root element
   * @param root - The root element to attach event listeners to
   */
  constructor(root?: Document | ShadowRoot);

  /**
   * Parse data-drag attribute into configuration object
   * @param element - Element with data-drag attribute
   * @returns Configuration object with defaults applied
   */
  static parseOptions(element: HTMLElement): DataDragOptions;

  /**
   * Parse data-drag-parent attribute into configuration object
   * @param element - Parent element with configuration
   * @returns Configuration object or null
   */
  static parseParentOptions(element: HTMLElement): ParentConfig | null;

  /**
   * Dispatch a custom data-drag event
   * @param target - Element to dispatch event from
   * @param eventName - Name of event (without 'datadrag:' prefix)
   * @param detail - Event detail data
   */
  static dispatchEvent(target: HTMLElement, eventName: string, detail: any): void;

  /**
   * Find an element in the event's composed path that matches a selector
   * @param event - Mouse event with composed path
   * @param selector - CSS selector to match
   * @returns Matching element or null
   */
  static findInPath(event: Event, selector: string): HTMLElement | null;

  /**
   * Walk up the DOM tree to find a parent matching selector
   * @param element - Starting element
   * @param selector - CSS selector to match
   * @returns Matching parent or null
   */
  static findParentInTree(element: HTMLElement, selector: string): HTMLElement | null;

  /**
   * Find a drop parent at screen coordinates across all shadow roots
   * @param x - Screen X coordinate
   * @param y - Screen Y coordinate
   * @returns Drop parent element or null
   */
  static findDropParent(x: number, y: number): HTMLElement | null;

  /**
   * Apply adoption configuration to a dropped item
   * @param item - The dropped item element
   * @param parent - The parent container with adoption rules
   */
  static applyAdoption(item: HTMLElement, parent: HTMLElement): void;

  /**
   * Destroy this DataDrag instance
   */
  destroy(): void;
}

/**
 * Custom event types for data-drag events
 */
declare global {
  interface HTMLElementEventMap {
    'datadrag:start': CustomEvent<DragEventDetail>;
    'datadrag:move': CustomEvent<MoveEventDetail>;
    'datadrag:drop': CustomEvent<DropEventDetail>;
    'datadrag:cancel': CustomEvent<DragEventDetail>;
    'datadrag:cloned': CustomEvent<ClonedEventDetail>;
    'datadrag:adopted': CustomEvent<AdoptionEventDetail>;
  }

  interface Window {
    DataDrag: typeof DataDrag;
    DataDragAccess: typeof Access;
  }
}

export {};
