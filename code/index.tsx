import * as React from "./simple-react.js";

const { createElement: h } = React;

const App: React.Component<null> = () => {
  const [state, setState] = React.useState("Hello!");
  const changeState = () =>
    setState(state === "Hello!" ? "Goodbye!" : "Hello!");
  const [counter, setCounter] = React.useState(1);
  const updateCounter = () => setCounter(counter + 1);
  React.useEffect(() => {
    // eslint-disable-next-line
    console.log("The effect ran!");
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

React.render(App, document.getElementById("app")!);
