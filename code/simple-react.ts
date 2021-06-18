export const removeChildren = (domNode: HTMLElement): void => {
  while (domNode.firstChild) {
    domNode.removeChild(domNode.firstChild);
  }
};

interface DomObject {
  tagName: string;
  props: Record<string, string>;
  children: DomObject[] | string;
}

type RenderFunction<T> = (tree: T, domNode: HTMLElement) => void;

type VirtualDom = DomObject | string;

type InternalHook = object;

interface HookState {
  hooks: InternalHook[];
  hookCounter: number | null;
}

const HOOK_STATE: HookState = {
  hooks: [],
  hookCounter: null,
};

export const viewHooks = () => ({ ...HOOK_STATE });

export const withHooks = <T>(
  fn: RenderFunction<T>,
  tree: T,
  domNode: HTMLElement
): void => {
  removeChildren(domNode);
  HOOK_STATE.hookCounter = 0;
  try {
    fn(tree, domNode);
  } finally {
    HOOK_STATE.hookCounter = null;
  }
};

const throwOnBadChild: RenderFunction<any> = (badChild) => {
  // eslint-disable-next-line no-console
  console.error(badChild);
  throw new Error("UNEXPECTED ELEMENT IN TREE");
};

const renderDomString: RenderFunction<string> = (tree, domNode) => {
  // eslint-disable-next-line no-param-reassign
  domNode.innerHTML = tree;
};

const renderDomObject: RenderFunction<DomObject> = (tree, domNode) => {
  const element = document.createElement(tree.tagName);
  Object.entries(tree.props).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  domNode.appendChild(element);
  if (Array.isArray(tree.children)) {
    tree.children.forEach((child) => render(child, element));
  } else {
    render(tree.children, element);
  }
};

const paintDomToScreen: RenderFunction<VirtualDom> = (tree, domNode) => {
  switch (typeof tree) {
    case "string": {
      return renderDomString(tree, domNode);
    }
    case "object": {
      return renderDomObject(tree, domNode);
    }
    default: {
      return throwOnBadChild(tree, domNode);
    }
  }
};

export const render: RenderFunction<VirtualDom> = (tree, domNode) => {
  if (HOOK_STATE.hookCounter === null) {
    return withHooks(paintDomToScreen, tree, domNode);
  }
  return paintDomToScreen(tree, domNode);
};

export const createElement = (
  tagName: string,
  props?: Record<string, string> | null,
  children?: DomObject[] | string
): DomObject => ({
  tagName,
  props: props || {},
  children: children || "",
});

if (!globalThis.process) {
  // eslint-disable-next-line no-console
  console.log("Hello, Simple React!");
}
