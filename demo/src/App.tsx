import { ref, type Ref } from "vue";
import { createComponent, createProvider } from "vue-productivity";

type Todo = {
  title: string;
  completed: boolean;
};

type State = {
  newTodoTitle: Ref<string>;
  todos: Todo[];
  addTodo(): void;
  toggleCompleted(index: number): void;
};

const [provide, inject] = createProvider<State>();

export const useTodos = inject;

const Test = createComponent(function Test({ slots }: { slots?: string }) {
  return <h1>{slots}</h1>;
});

function Setup(): State {
  const newTodoTitle = ref("");
  const todos = ref<Todo[]>([]);

  return provide({
    newTodoTitle,
    get todos() {
      return todos.value;
    },
    addTodo() {
      todos.value.push({
        title: newTodoTitle.value,
        completed: false,
      });
      newTodoTitle.value = "";
    },
    toggleCompleted(index) {
      todos.value[index].completed = !todos.value[index].completed;
    },
  });
}

function App(state: State) {
  return (
    <div>
      <Test></Test>
      <input
        value={state.newTodoTitle.value}
        onInput={(event) => {
          state.newTodoTitle.value = event.target!.value!;
        }}
        onkeydown={(event) => {
          if (event.key === "Enter") {
            state.addTodo();
          }
        }}
      />

      <ul>
        {state.todos.map((todo, index) => (
          <li key={index} onClick={() => state.toggleCompleted(index)}>
            {todo.title} - {todo.completed ? "Completed" : "Not completed"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default createComponent(Setup, App);
