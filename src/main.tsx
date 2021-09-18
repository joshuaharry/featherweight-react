import * as React from "./simple-react";

const { createElement: h } = React;

const TODOS = [
  { id: 0, text: "0" },
  { id: 1, text: "1" },
  { id: 2, text: "2" },
  { id: 3, text: "3" },
  { id: 4, text: "4" },
  { id: 5, text: "5" },
  { id: 6, text: "6" },
];

const delay = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

const App: React.Component<null> = () => {
  const [counter, setCounter] = React.useState(0);
  const [todo, setTodo] = React.useState(JSON.stringify(TODOS[counter]));
  const [loading, setLoading] = React.useState(false);
  return (
    <div>
      <h1 id="todos">Todos</h1>
      <button
        type="button"
        onclick={async () => {
          setLoading(true);
          setCounter(counter + 1);
          await delay(500);
          setTodo(JSON.stringify(TODOS[counter + 1]));
          setLoading(false);
        }}
      >
        Increment
      </button>
      <h2>Todo Id: {counter}</h2>
      {loading ? (
        <h2>Loading</h2>
      ) : (
        <h2>Todo: {todo}</h2>
      )}
    </div>
  );
};

React.render(App, document.getElementById("app")!);
