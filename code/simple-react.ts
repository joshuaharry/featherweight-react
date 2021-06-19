declare global {
  namespace JSX {
    interface IntrinsicElements {
      [name: string]: any;
    }
  }
}

export const removeChildren = (domNode: HTMLElement): void => {
  while (domNode.firstChild) {
    domNode.removeChild(domNode.firstChild);
  }
};

export type Component<T> = (args: T) => DomObject<T>;

type Children = Array<DomObject | string>;

export interface DomObject<T = unknown> {
  tagName: string;
  props: T;
  children: Children;
}

export const createElement = <T>(
  tagName: string | Component<T>,
  props: T,
  ...children: Children
): DomObject<any> => {
  if (typeof tagName === "string") {
    return {
      tagName,
      props: props || {},
      children: children || "",
    };
  }
  return tagName(props);
};

type RenderFunction<T> = (tree: T, domNode: HTMLElement) => void;

type VirtualDom = DomObject | string | Component<null>;

interface StateCall<T = any> {
  hookType: "useState";
  state: T;
}

interface EffectCall {
  hookType: "useEffect";
  dependencies: Array<any>;
  effect: () => void | Promise<void>;
}

type InternalHook = StateCall | EffectCall;

interface HookState {
  hooks: InternalHook[];
  counter: number | null;
  rerender: () => void;
}

const HOOK_STATE: HookState = {
  hooks: [],
  counter: null,
  rerender() {},
};

export const resetHooks = () => {
  HOOK_STATE.hooks = [];
  HOOK_STATE.counter = null;
  HOOK_STATE.rerender = () => {};
};

export const withHooks = <T>(
  fn: RenderFunction<T>,
  tree: T,
  domNode: HTMLElement
): void => {
  removeChildren(domNode);
  HOOK_STATE.counter = 0;
  HOOK_STATE.rerender = () =>
    render(tree as unknown as Component<null>, domNode);
  try {
    fn(tree, domNode);
  } finally {
    HOOK_STATE.counter = null;
  }
};

const throwOnBadChild: RenderFunction<any> = (badChild) => {
  // eslint-disable-next-line no-console
  console.error(badChild);
  throw new Error("UNEXPECTED ELEMENT IN TREE");
};

const renderString: RenderFunction<string> = (tree, domNode) => {
  domNode.textContent += tree;
};

const assignProps = <T>(props: T | null, domNode: HTMLElement) => {
  if (!props) return;
  Object.entries(props).forEach(([key, value]) => {
    if (typeof value === "string") {
      domNode.setAttribute(key, value);
    } else {
      // @ts-ignore
      domNode[key] = value;
    }
  });
};

const renderChildren = (children: Children, domNode: HTMLElement) => {
  if (Array.isArray(children)) {
    children.forEach((child) => render(child, domNode));
  } else {
    render(children, domNode);
  }
};

const renderObject: RenderFunction<DomObject> = (tree, domNode) => {
  const element = document.createElement(tree.tagName);
  domNode.appendChild(element);
  assignProps(tree.props, element);
  renderChildren(tree.children, element);
};

const paintDomToScreen: RenderFunction<VirtualDom> = (tree, domNode) => {
  switch (typeof tree) {
    case "string": {
      return renderString(tree, domNode);
    }
    case "object": {
      return renderObject(tree, domNode);
    }
    case "function": {
      return render(tree(null), domNode);
    }
    default: {
      return throwOnBadChild(tree, domNode);
    }
  }
};

export const render: RenderFunction<VirtualDom> = (tree, domNode) => {
  if (HOOK_STATE.counter === null) {
    return withHooks(paintDomToScreen, tree, domNode);
  }
  return paintDomToScreen(tree, domNode);
};

export const useState = <T>(initialState: T): [T, (newState: T) => void] => {
  if (HOOK_STATE.counter === null) {
    throw new Error("You must use a hook inside a component!");
  }
  const { hooks, counter, rerender } = HOOK_STATE;
  const setState = (newState: T): void => {
    hooks[counter] = { hookType: "useState", state: newState };
    rerender();
  };
  if (hooks[counter] === undefined) {
    hooks.push({ hookType: "useState", state: initialState });
  }
  const { state } = hooks[counter] as StateCall;
  HOOK_STATE.counter += 1;
  return [state, setState];
};

if (!globalThis.process) {
  // eslint-disable-next-line no-console
  console.log("Hello, Simple React!");
}
