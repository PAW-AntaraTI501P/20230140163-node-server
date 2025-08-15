require("dotenv").config();
const express = require("express");
const app = express();
const db =require("./database/db");

//const port = 3001;
const todoRoutes = require("./routes/tododb.js");
const { todos } = require("./routes/todo.js");
const port = process.env.PORT;

const expressLayouts = require("express-ejs-layouts");
app.use(expressLayouts);

app.use(express.json());
app.set("view engine", "ejs");
app.use("/todos", todoRoutes);

app.get("/", (req, res) => {
  res.render("index", {
    layout: "layouts/main-layout",
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    layout: "layouts/main-layout",
  });
});

//endpoint untuk mendapatkan data todos
app.get("/todos-data", (req, res) => {
  res.json(todos); //mengembalikan data todos dalam format json
});

app.get("/todos-list", (req, res) => {
  res.render("todos-page", { todos: todos, layout: "layouts/main-layout" });
});


app.get("/todo-view", (req,res) => {
  db.query("SELECT * FROM todos", (err, todos) => {
    if (err) return res.status(500).send("internal server error")
    res.render("todo", {
      todos: todos, layout: "layouts/main-layout"
    });
  });
});

app.get("/todos-list", (req, res) => {
  res.render("todos-page", {todos: todos}); //merender todos-page
});


// POST - tambah todo
// router.post('/', (req, res) => {
//   const { task } = req.body;
//   if (!task) return res.status(400).json({ error: 'Task is required' });

//   const newTodo = {
//     id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,
//     task,
//     completed: false
//   };
//   todos.push(newTodo);
//   res.status(201).json(newTodo);
// });

// // PUT - update todo
// router.put('/:id', (req, res) => {
//   const id = parseInt(req.params.id);
//   const { task } = req.body;
//   const index = todos.findIndex(t => t.id === id);
//   if (index === -1) return res.status(404).json({ error: 'Todo not found' });

//   todos[index].task = task;
//   res.json(todos[index]);
// });

// // PATCH - tandai selesai
// router.patch('/:id/complete', (req, res) => {
//   const id = parseInt(req.params.id);
//   const index = todos.findIndex(t => t.id === id);
//   if (index === -1) return res.status(404).json({ error: 'Todo not found' });

//   todos[index].completed = true;
//   res.json(todos[index]);
// });

// // DELETE - hapus todo
// router.delete('/:id', (req, res) => {
//   const id = parseInt(req.params.id);
//   todos = todos.filter(t => t.id !== id);
//   res.json({ message: 'Todo deleted' });
// });

// module.exports = router;
// module.exports.todos = todos;

//middleware
app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});