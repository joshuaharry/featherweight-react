/* eslint-disable react/button-has-type */
import * as React from "./simple-react";
import "./index.css";

const { createElement: h } = React;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const App: React.Component<null> = () => {
  const [stateA, setStateA] = React.useState(true);
  const [stateB, setStateB] = React.useState(false);
  const toggleStates = () => {
    setStateB(!stateB);
    setStateA(!stateA);
  };
  const toggleDelayed = async () => {
    setStateB(!stateB);
    await sleep(500);
    setStateA(!stateA);
  };
  return (
    <div id="container">
      <h1>Broken Xor Machine</h1>
      <div id="side-by-side">
        <div>
          <h2>State A</h2>
          <button onclick={toggleStates}>Set State A</button>
          <h3>{stateA.toString()}</h3>
        </div>
        <div>
          <h2>State B</h2>
          <button onclick={toggleDelayed}>Set State B</button>
          <h3>{stateB.toString()}</h3>
        </div>
      </div>
    </div>
  );
};

React.render(App, document.getElementById("app")!);
