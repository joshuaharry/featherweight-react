export const removeChildren = (domNode: HTMLElement): void => {
  while (domNode.firstChild) {
    domNode.removeChild(domNode.firstChild);
  }
};

type Props = Record<string, string | ((e: Event) => void)>;

export type Component<T = any> = (args: T) => DomObject;

type Children = DomObject[] | string;

interface DomObject {
  tagName: string;
  props: Props;
  children: Children;
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

const renderString: RenderFunction<string> = (tree, domNode) => {
  domNode.innerHTML = tree;
};

const assignProps = (props: Props, domNode: HTMLElement) => {
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
  tagName: string | Component,
  props?: Props | null,
  children?: DomObject[] | string
): DomObject => {
  if (typeof tagName === "string") {
    return {
      tagName,
      props: props || {},
      children: children || "",
    };
  }
  return tagName(props);
};

if (!globalThis.process) {
  // eslint-disable-next-line no-console
  console.log("Hello, Simple React!");
}
