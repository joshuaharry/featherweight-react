import "@testing-library/jest-dom";
import {
  render,
  removeChildren,
  createElement as h,
  viewHooks,
  withHooks,
} from "./simple-react";

beforeEach(() => {
  document.body.innerHTML = `<div id="app"></div>`;
});

const getRoot = (): HTMLDivElement => {
  const app = <HTMLDivElement>document.getElementById("app");
  if (app === null) {
    throw new Error("CANNOT FIND APP ROOT");
  }
  return app;
};

describe("Our hook state", () => {
  test("We can view our current hook state for debugging purposes", () => {
    expect(viewHooks()).toEqual({ hooks: [], hookCounter: null });
  });
  test("We can safely modify the results of viewHooks without changing what it returns", () => {
    const hooks = viewHooks();
    hooks.hookCounter = 5;
    expect(hooks).toEqual({ hooks: [], hookCounter: 5 });
    expect(viewHooks()).toEqual({ hooks: [], hookCounter: null });
  });
  test("We can run functions using withHooks that help manage the hook state.", () => {
    withHooks(
      (_, __) => {
        expect(viewHooks()).toEqual({ hooks: [], hookCounter: 0 });
      },
      "hello",
      getRoot()
    );
    expect(viewHooks()).toEqual({ hooks: [], hookCounter: null });
  });
  test("Our withHooks method is exception safe", () => {
    expect(() => {
      withHooks(
        (_, __) => {
          throw new Error("SOMETHING BAD HAPPENED!");
        },
        "hello",
        getRoot()
      );
    }).toThrow();
    expect(viewHooks()).toEqual({ hooks: [], hookCounter: null });
  });
  test("Our withHooks method always clears the DomNode passed", () => {
    const el = document.createElement("p");
    getRoot().appendChild(el);
    expect(document.body.innerHTML).toBe(`<div id="app"><p></p></div>`);
    expect(() => {
      withHooks(
        (_, __) => {
          throw new Error("SOMETHING BAD HAPPENED!");
        },
        "hello",
        getRoot()
      );
    }).toThrow();
    expect(viewHooks()).toEqual({ hooks: [], hookCounter: null });
    expect(document.body.innerHTML).toBe(`<div id="app"></div>`);
  });
});

describe("Removing children from a DOM node", () => {
  test("Works when the DOM node is empty", () => {
    document.body.innerHTML = `<div id="app"></div>`;
    const app = getRoot();
    removeChildren(app);
    expect(document.body.innerHTML).toBe(`<div id="app"></div>`);
  });
  test("Works when the DOM node has one child.", () => {
    document.body.innerHTML = `<div id="app"><p>Hello!</p></div>`;
    const app = getRoot();
    removeChildren(app);
    expect(document.body.innerHTML).toBe(`<div id="app"></div>`);
  });
  test("Works when the DOM node has many children.", () => {
    document.body.innerHTML = `<div id="app"><p>Hello!</p><p>This has many children.</p></div>`;
    const app = getRoot();
    removeChildren(app);
    expect(document.body.innerHTML).toBe(`<div id="app"></div>`);
  });
  test("Works even if the DOM node has recursive children.", () => {
    document.body.innerHTML = `<div id="app"><p>This is a child.</p><p>This is another child.</p><div><p>Much recursing.</p><p>Such wow.</p></div></div>`;
    const app = getRoot();
    removeChildren(app);
    expect(document.body.innerHTML).toBe(`<div id="app"></div>`);
  });
});

describe("Creating DOM elements", () => {
  test("Works when all properties are specified", () => {
    const node = h("p", { classname: "pink" }, "Hello!");
    expect(node).toEqual({
      tagName: "p",
      props: { classname: "pink" },
      children: "Hello!",
    });
  });
  test("Works when elements get left unspecified", () => {
    const node = h("p");
    expect(node).toEqual({
      tagName: "p",
      props: {},
      children: "",
    });
  });
  test("Works when the props include an event handler", () => {
    const onChange = (_: Event) => {};
    const node = h("p", { onchange: onChange });
    expect(node.props["onchange"]).toBe(onChange);
  });
  test("Works when you nest the elements", () => {
    const node = h("div", null, [
      h("p", null, "Hello, world!"),
      h("p", null, "This is a DOM object!"),
    ]);
    expect(node).toEqual({
      tagName: "div",
      props: {},
      children: [
        {
          tagName: "p",
          props: {},
          children: "Hello, world!",
        },
        {
          tagName: "p",
          props: {},
          children: "This is a DOM object!",
        },
      ],
    });
  });
});

describe("Rendering to the Virtual DOM", () => {
  test("We can find the root of our application.", () => {
    expect(() => getRoot()).not.toThrow();
  });
  /* eslint-disable no-console */
  test("We explode if we try to render something funny to the DOM", () => {
    const originalError = console.error;
    console.error = jest.fn();
    // @ts-expect-error
    expect(() => render(5, getRoot())).toThrow("UNEXPECTED");
    expect(console.error).toHaveBeenCalledWith(5);
    console.error = originalError;
  });
  /* eslint-enable no-console */
  test("We can render a string to the DOM.", () => {
    render("Hello!", getRoot());
    expect(document.body.innerHTML).toBe(`<div id="app">Hello!</div>`);
  });
  test("We can render a VDOM object to the DOM.", () => {
    render(h("p", null, ""), getRoot());
    expect(document.body.innerHTML).toBe(`<div id="app"><p></p></div>`);
  });
  test("We can render the contents of a VDOM object properly.", () => {
    render(h("p", null, "Hello!"), getRoot());
    expect(document.body.innerHTML).toBe(`<div id="app"><p>Hello!</p></div>`);
  });
  test("We can add attributes to a virtual dom object.", () => {
    render(h("p", { classname: "purple", id: "my-par" }, ""), getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><p classname="purple" id="my-par"></p></div>`
    );
  });
  test("We can recursively render VDOM children.", () => {
    render(
      h("div", null, [
        h("p", null, "Hello, world!"),
        h("p", { classname: "green" }, "Welcome to a very simple React!"),
      ]),
      getRoot()
    );
    expect(document.body.innerHTML).toBe(
      `<div id="app"><div><p>Hello, world!</p><p classname="green">Welcome to a very simple React!</p></div></div>`
    );
  });
  test("Each time we call render, it updates with the latest information.", () => {
    render(h("p", null, "Hello!"), getRoot());
    render(h("p", null, "Hello, world!"), getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><p>Hello, world!</p></div>`
    );
  });
});
