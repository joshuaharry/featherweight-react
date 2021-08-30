/* @jsx h */
import "@testing-library/jest-dom";
import { fireEvent } from "@testing-library/dom";
import {
  render,
  removeChildren,
  createElement as h,
  withHooks,
  Component,
  useState,
  useEffect,
  resetHooks,
  makeStateMachine,
  lastUniqueState,
} from "./simple-react";

beforeEach(() => {
  document.body.innerHTML = `<div id="app"></div>`;
  resetHooks();
});

const getById = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`COULD NOT FIND ELEMENT WITH ID '${id}' IN THE DOM`);
  }
  return el;
};

const getRoot = (): HTMLDivElement => getById("app") as HTMLDivElement;

describe("lastUniqueState", () => {
  beforeEach(() => {
    lastUniqueState([]);
  });
  test("Empty list by default", () => {
    expect(lastUniqueState([])).toEqual({
      changed: false,
      state: [],
    });
  });
  test("Works with a new state", () => {
    expect(lastUniqueState([{ state: 5, hookType: "useState" }])).toEqual({
      changed: true,
      state: [{ state: 5, hookType: "useState" }],
    });
    expect(lastUniqueState([{ state: 5, hookType: "useState" }])).toEqual({
      changed: false,
      state: [{ state: 5, hookType: "useState" }],
    });
  });
  test("Works with multiple states", () => {
    expect(
      lastUniqueState([
        { state: 5, hookType: "useState" },
        { state: 6, hookType: "useState" },
      ])
    ).toEqual({
      changed: true,
      state: [
        { state: 5, hookType: "useState" },
        { state: 6, hookType: "useState" },
      ],
    });
    Array.from({ length: 10 }).forEach(() => {
      expect(
        lastUniqueState([
          { state: 5, hookType: "useState" },
          { state: 6, hookType: "useState" },
        ])
      ).toEqual({
        changed: false,
        state: [
          { state: 5, hookType: "useState" },
          { state: 6, hookType: "useState" },
        ],
      });
    });
    expect(
      lastUniqueState([
        { state: 5, hookType: "useState" },
        { state: 7, hookType: "useState" },
      ])
    ).toEqual({
      changed: true,
      state: [
        { state: 5, hookType: "useState" },
        { state: 7, hookType: "useState" },
      ],
    });
  });
});

describe("Our state machine", () => {
  test("Can be created properly", () => {
    const stateMachine = makeStateMachine();
    expect(stateMachine.state).toEqual([
      { state: true, hookType: "useState" },
      { state: false, hookType: "useState" },
    ]);
  });
  test("Can be updated once", () => {
    const stateMachine = makeStateMachine();
    stateMachine.updateState();
    expect(stateMachine.state).toEqual([
      { state: true, hookType: "useState" },
      { state: true, hookType: "useState" },
    ]);
  });
  test("Can be updated twice", () => {
    const stateMachine = makeStateMachine();
    stateMachine.updateState();
    stateMachine.updateState();
    expect(stateMachine.state).toEqual([
      { state: false, hookType: "useState" },
      { state: true, hookType: "useState" },
    ]);
  });
  test("Can return to the start", () => {
    const stateMachine = makeStateMachine();
    for (let i = 0; i < 4; i += 1) {
      stateMachine.updateState();
    }
    expect(stateMachine.state).toEqual([
      { state: true, hookType: "useState" },
      { state: false, hookType: "useState" },
    ]);
  });
});

describe("Our hook state", () => {
  test("withHooks clears the DOM node you pass it in preparation for render", () => {
    getRoot().appendChild(document.createElement("p"));
    expect(document.body.innerHTML).toBe(`<div id="app"><p></p></div>`);
    withHooks((_, __) => {}, "hello", getRoot());
    expect(document.body.innerHTML).toBe(`<div id="app"></div>`);
  });
  test("withHooks clears the DOM node even when the inner function throws an exception", () => {
    getRoot().appendChild(document.createElement("p"));
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
    expect(document.body.innerHTML).toBe(`<div id="app"></div>`);
  });
  test("Mutations to the DOM from within withHooks succeed", () => {
    getRoot().appendChild(document.createElement("p"));
    expect(document.body.innerHTML).toBe(`<div id="app"><p></p></div>`);
    withHooks(
      (_, __) => {
        const header = document.createElement("h1");
        header.textContent = "Hello!";
        getRoot().appendChild(header);
      },
      "hello",
      getRoot()
    );
    expect(document.body.innerHTML).toBe(`<div id="app"><h1>Hello!</h1></div>`);
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
      children: ["Hello!"],
    });
  });
  test("Works even if the children are not technically specified", () => {
    const node = h("p", null);
    expect(node).toEqual({
      tagName: "p",
      props: {},
      children: [],
    });
  });
  test("Works when the props include an event handler", () => {
    const onChange = (_: Event) => {};
    const node = h("p", { onchange: onChange });
    expect(node.props.onchange).toBe(onChange);
  });
  test("Works when the chilren are numbers", () => {
    const node = h("p", null, 3);
    expect(node).toEqual({
      tagName: "p",
      props: {},
      children: [3],
    });
  });
  test("Works when you nest the elements", () => {
    const node = h(
      "div",
      null,
      h("p", null, "Hello, world!"),
      h("p", null, "This is a DOM object!")
    );
    expect(node).toEqual({
      tagName: "div",
      props: {},
      children: [
        {
          tagName: "p",
          props: {},
          children: ["Hello, world!"],
        },
        {
          tagName: "p",
          props: {},
          children: ["This is a DOM object!"],
        },
      ],
    });
  });
  test("Works with a component that does not take props", () => {
    const MyComponent = () => h("p", null);
    const el = h(MyComponent, null);
    expect(el).toEqual({
      tagName: "p",
      props: {},
      children: [],
    });
  });
  test("Works with a component that takes props", () => {
    interface ComponentProps {
      classname: string;
    }
    const MyComponent: Component<ComponentProps> = ({ classname }) =>
      h("p", { classname });
    const el = h(MyComponent, { classname: "blue" });
    expect(el).toEqual({
      tagName: "p",
      props: { classname: "blue" },
      children: [],
    });
  });
});

describe("Rendering to the Virtual DOM", () => {
  test("We can find the root of our application.", () => {
    expect(() => getRoot()).not.toThrow();
  });
  /* eslint-disable no-console */
  test("We explode if we try to render something funny to the DOM", () => {
    const sym = Symbol("stringy");
    const originalError = console.error;
    console.error = jest.fn();
    // @ts-expect-error
    expect(() => render(sym, getRoot())).toThrow("UNEXPECTED");
    expect(console.error).toHaveBeenCalledWith(sym);
    console.error = originalError;
  });
  /* eslint-enable no-console */
  test("We can render a string to the DOM.", () => {
    render("Hello!", getRoot());
    expect(document.body.innerHTML).toBe(`<div id="app">Hello!</div>`);
  });
  test("We can render a number to the DOM", () => {
    render(5, getRoot());
    expect(document.body.innerHTML).toBe(`<div id="app">5</div>`);
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
      h(
        "div",
        null,
        h("p", null, "Hello, world!"),
        h("p", { classname: "green" }, "Welcome to a very simple React!")
      ),
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
  test("We can render a component", () => {
    const MyComponent = () => h("p", null, "Hello, components!");
    render(h(MyComponent, {}), getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><p>Hello, components!</p></div>`
    );
  });
  test("We can render a component that takes props", () => {
    interface MyProps {
      classname: string;
    }
    const MyComponent: Component<MyProps> = ({ classname }) =>
      h("p", { classname }, "Hello, props!");
    render(h(MyComponent, { classname: "blue" }), getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><p classname="blue">Hello, props!</p></div>`
    );
  });
  test("We can render a big, complicated component tree", () => {
    interface AboutProps {
      firstColor: string;
      secondColor: string;
    }
    const About: Component<AboutProps> = ({ firstColor, secondColor }) => {
      return h(
        "div",
        { classname: firstColor },
        h(
          "p",
          null,
          "This system is designed to help us get started understanding the semantics of renders."
        ),
        h("p", { classname: secondColor }, `Let's get to it!`)
      );
    };
    const App = () => {
      return h(
        "div",
        null,
        h("p", { classname: "blue" }, "Hello, world!"),
        h(
          "p",
          { classname: "purple" },
          "Welcome to a very simple React clone."
        ),
        h<AboutProps>(About, { firstColor: "green", secondColor: "yellow" })
      );
    };
    render(h(App, null), getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><div><p classname="blue">Hello, world!</p><p classname="purple">Welcome to a very simple React clone.</p><div classname="green"><p>This system is designed to help us get started understanding the semantics of renders.</p><p classname="yellow">Let's get to it!</p></div></div></div>`
    );
  });
  test("We can render a component using JSX", () => {
    const App = () => <h1>Hello, world!</h1>;
    render(<App />, getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><h1>Hello, world!</h1></div>`
    );
  });
  test("We can nest JSX components as we wish", () => {
    const App = () => (
      <div>
        <h1>Hello, world!</h1>
        <h2 class="blue">We have nested JSX!</h2>
      </div>
    );
    render(<App />, getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><div><h1>Hello, world!</h1><h2 class="blue">We have nested JSX!</h2></div></div>`
    );
  });
  test("We can render numeric literals in JSX", () => {
    const App: Component<null> = () => {
      return (
        <h1>
          <p>Hello!</p>
          <p>3</p>
        </h1>
      );
    };
    render(App, getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><h1><p>Hello!</p><p>3</p></h1></div>`
    );
  });
  test("We can render functions to the DOM", () => {
    const App: Component<null> = () => (
      <div>
        <h1>Hello, world!</h1>
        <h2 class="blue">We have nested JSX!</h2>
      </div>
    );
    render(App, getRoot());
    expect(document.body.innerHTML).toBe(
      `<div id="app"><div><h1>Hello, world!</h1><h2 class="blue">We have nested JSX!</h2></div></div>`
    );
  });
});

describe("Our useState hook", () => {
  test("Lets us put a bit of state into the DOM", () => {
    const App: Component<null> = () => {
      const [name] = useState("Eva Lu Ator");
      return (
        <div>
          <h1 id="name">{name}</h1>
        </div>
      );
    };
    render(App, getRoot());
    expect(document.getElementById("name")?.textContent).toBe("Eva Lu Ator");
  });
  test("We can modify the bit of state useState gives us", () => {
    const App: Component<null> = () => {
      const [name, setName] = useState("Eva Lu Ator");
      return (
        <div>
          <h1 id="name">{name}</h1>
          <button
            id="change-name"
            onclick={() => setName("Louis Reasoner")}
            type="button"
          >
            Change the name!
          </button>
        </div>
      );
    };
    render(App, getRoot());
    const button = getById("change-name");
    fireEvent.click(button);
    expect(document.getElementById("name")?.textContent).toBe("Louis Reasoner");
  });
  test("We can have multiple bits of state on a page", () => {
    interface NameChangerProps {
      name: string;
      id: string;
      onclick: () => void;
    }
    const NameChanger: Component<NameChangerProps> = ({
      id,
      name,
      onclick,
    }) => {
      return (
        <div>
          <h1 id={id}>{name}</h1>
          <button onclick={onclick} id={`change-${id}`} type="button">
            Change the name!
          </button>
        </div>
      );
    };
    const App: Component<null> = () => {
      const [firstName, setFirstName] = useState("Bob");
      const [secondName, setSecondName] = useState("the Builder");
      return (
        <div>
          <NameChanger
            name={firstName}
            id="first-name"
            onclick={() => {
              setFirstName(firstName === "Bob" ? "Dora" : "Bob");
            }}
          />
          <NameChanger
            name={secondName}
            id="second-name"
            onclick={() => {
              setSecondName(
                secondName === "the Builder" ? "the Explorer" : "the Builder"
              );
            }}
          />
        </div>
      );
    };
    render(App, getRoot());
    const firstNameButton = getById("change-first-name");
    const secondNameButton = getById("change-second-name");
    expect(document.getElementById("first-name")?.textContent).toBe("Bob");
    expect(document.getElementById("second-name")?.textContent).toBe(
      "the Builder"
    );
    fireEvent.click(secondNameButton);
    expect(document.getElementById("first-name")?.textContent).toBe("Bob");
    expect(document.getElementById("second-name")?.textContent).toBe(
      "the Explorer"
    );
    fireEvent.click(firstNameButton);
    expect(document.getElementById("first-name")?.textContent).toBe("Dora");
    expect(document.getElementById("second-name")?.textContent).toBe(
      "the Explorer"
    );
  });
});

describe("Our useEffect hook", () => {
  test("Will run a side effect during our render", () => {
    const fn = jest.fn();
    const App: Component<null> = () => {
      useEffect(() => {
        fn();
      });
      return <h1>Hello!</h1>;
    };
    render(App, getRoot());
    expect(fn).toHaveBeenCalled();
  });
  test("When there is no dependency array, we call the effect every time", () => {
    const fn = jest.fn();
    const App: Component<null> = () => {
      useEffect(() => {
        fn();
      });
      return <h1>Hello!</h1>;
    };
    render(App, getRoot());
    render(App, getRoot());
    render(App, getRoot());
    render(App, getRoot());
    expect(fn).toHaveBeenCalledTimes(4);
  });
  test("When there is an empty dependency array, we only call the effect once", () => {
    const fn = jest.fn();
    const App: Component<null> = () => {
      useEffect(() => {
        fn();
      }, []);
      return <h1>Hello!</h1>;
    };
    render(App, getRoot());
    render(App, getRoot());
    render(App, getRoot());
    render(App, getRoot());
    expect(fn).toHaveBeenCalledTimes(1);
  });
  test("When the dependency array has elements inside of it, we call the effect when they change", () => {
    const fn = jest.fn();
    const App: Component<null> = () => {
      const [state, setState] = useState("Hello!");
      useEffect(() => {
        fn();
      }, [state]);
      return (
        <div>
          <h1 id="state">{state}</h1>
          <button
            id="effect-button"
            onclick={() => setState(state === "Hello!" ? "Goodbye!" : "Hello!")}
            type="button"
          >
            Trigger the effect!
          </button>
        </div>
      );
    };
    render(App, getRoot());
    render(App, getRoot());
    render(App, getRoot());
    expect(fn).toHaveBeenCalledTimes(1);
    fireEvent.click(getById("effect-button"));
    expect(fn).toHaveBeenCalledTimes(2);
  });
  test("Our array strategy only looks at the state we pass it", () => {
    const fn = jest.fn();
    const App: Component<null> = () => {
      const [state, setState] = useState("Hello!");
      const changeState = () =>
        setState(state === "Hello!" ? "Goodbye!" : "Hello!");
      const [counter, setCounter] = useState(1);
      const updateCounter = () => setCounter(counter + 1);
      useEffect(() => {
        fn();
      }, [state]);
      return (
        <div>
          <h1 id="state">{state}</h1>
          <h2 id="counter">{counter}</h2>
          <button id="effect-button" onclick={changeState} type="button">
            Trigger the effect!
          </button>
          <button id="counter-button" onclick={updateCounter} type="button">
            Update the counter!
          </button>
        </div>
      );
    };
    render(App, getRoot());
    render(App, getRoot());
    render(App, getRoot());
    expect(fn).toHaveBeenCalledTimes(1);
    fireEvent.click(getById("counter-button"));
    expect(fn).toHaveBeenCalledTimes(1);
    fireEvent.click(getById("effect-button"));
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
