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

type Children = Array<DomObject | string | number>;

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

type VirtualDom = DomObject | string | number | Component<null>;

interface StateCall<T = any> {
  hookType: "useState";
  state: T;
}

interface EffectCall {
  hookType: "useEffect";
  dependencies: Array<any> | undefined;
  effect: () => void;
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

const renderNumber: RenderFunction<number> = (tree, domNode) => {
  domNode.textContent += tree.toString();
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

const renderChildren = (children: Children, domNode: HTMLElement) =>
  children.forEach((child) => render(child, domNode));

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
    case "number": {
      return renderNumber(tree, domNode);
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

export const makeStateMachine = () => {
  function* makeStateGenerator() {
    while (true) {
      yield [
        { state: true, hookType: "useState" },
        { state: false, hookType: "useState" },
      ];
      yield [
        { state: true, hookType: "useState" },
        { state: true, hookType: "useState" },
      ];
      yield [
        { state: false, hookType: "useState" },
        { state: true, hookType: "useState" },
      ];
      yield [
        { state: false, hookType: "useState" },
        { state: false, hookType: "useState" },
      ];
    }
  }
  const stateGenerator = makeStateGenerator();
  const stateMachine = {
    state: stateGenerator.next().value,
    updateState: () => {
      stateMachine.state = stateGenerator.next().value;
    },
  };
  return stateMachine;
};

const makeLastUniqueState = () => {
  let lastState: StateCall[] = [];
  const lastUniqueState = (
    hooks: StateCall[] = HOOK_STATE.hooks as StateCall[]
  ) => {
    for (let i = 0; i < hooks.length; i += 1) {
      if (hooks[i]?.state !== lastState[i]?.state) {
        // WARNING: Make sure you *clone* HOOK_STATE.hooks here! If you
        // do the naive assignment, lastState will *point* to HOOK_STATE.hooks
        // and you'll never see anything interesting.
        lastState = [...hooks];
        return {
          changed: true,
          state: lastState,
        };
      }
    }
    return { changed: false, state: lastState };
  };
  return lastUniqueState;
};

const stateMachine = makeStateMachine();

export const lastUniqueState = makeLastUniqueState();

const check = () => {
  const reactState = lastUniqueState();
  if (reactState.changed) {
    for (let i = 0; i < reactState.state.length; i += 1) {
      // TypeScript is confused about generators, but this is fine.
      // @ts-ignore
      if (reactState.state[i].state !== stateMachine.state[i].state) {
        throw new Error("STATE MACHINE FAILURE");
      }
    }
    stateMachine.updateState();
  }
};

export const render: RenderFunction<VirtualDom> = (tree, domNode) => {
  check();
  if (HOOK_STATE.counter === null) {
    return withHooks(paintDomToScreen, tree, domNode);
  }
  return paintDomToScreen(tree, domNode);
};

const handleEffect = (
  effect: EffectCall,
  newDependencies: Array<any> | undefined
): void => {
  if (!Array.isArray(newDependencies)) return effect.effect();
  const shouldRunEffect = newDependencies.some(
    (dependency, index) => dependency !== effect?.dependencies?.[index]
  );
  if (shouldRunEffect) return effect.effect();
  return undefined;
};

export const useEffect = (
  effectFn: () => void | Promise<void>,
  deps?: Array<any>
): void => {
  if (HOOK_STATE.counter === null) {
    throw new Error("You must use a hook inside a component!");
  }
  const { hooks, counter } = HOOK_STATE;
  HOOK_STATE.counter += 1;
  if (hooks[counter] === undefined) {
    hooks.push({ hookType: "useEffect", effect: effectFn, dependencies: deps });
    effectFn();
    return;
  }
  const effect = hooks[counter] as EffectCall;
  handleEffect(effect, deps);
  effect.dependencies = deps;
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
