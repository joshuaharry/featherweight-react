import * as React from "./simple-react.js";

const { createElement: h } = React;

const App: React.Component<null> = () => {
  const [state, setState] = React.useState("Initial state");
  return (
    <div>
      <h1>Hello, world!</h1>
      <h2>{state}</h2>
      <button
        type="button"
        onclick={() =>
          setState(state === "Initial state" ? "New state" : "Initial state")
        }
      >
        Change the State
      </button>
    </div>
  );
};

React.render(App, document.getElementById("app")!);
