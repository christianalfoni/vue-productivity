import { ref } from "vue";
import { createComponent, type VueNode } from "vue-productivity";

type Todo = {
  title: string;
  completed: boolean;
};

function Setup(props: { initialCount: number }) {
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
    toggleCompleted(index: number) {
      todos.value[index].completed = !todos.value[index].completed;
    },
  };
}

type State = ReturnType<typeof Setup>;

function App(state: State, props: { children: VueNode }) {
  return (
    <div>
      <h1>Todos</h1>
      <input
        value={state.newTodoTitle.value}
        onInput={(event) => (state.newTodoTitle.value = event.target.value)}
        onKeydown={(event) => {
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
