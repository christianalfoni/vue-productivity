import { reactive, ref, type Ref } from "vue";
import { createComponent } from "vue-productivity";

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

function Setup(): State {
  const newTodoTitle = ref("");
  const todos = ref<Todo[]>([]);

  return {
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
  };
}

function Test() {
  return <div>hello</div>;
}

function App(state: State) {
  return (
    <div>
      <input
        value={state.newTodoTitle.value}
        onInput={(event) => {
          state.newTodoTitle.value = event.target!.value!;
        }}
        onKeyDown={(event) => {
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
