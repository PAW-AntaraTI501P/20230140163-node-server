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

app.post("/todos-list/add", (req, res) => {
  const { task } = req.body;
  if (!task || task.trim() === "") {
    return res.status(400).send("Task tidak boleh kosong");
  }

  const newTodo = {
    id: todos.length > 0 ? todos[todos.length - 1].id + 1 : 1,
    task: task.trim(),
  };
  todos.push(newTodo);

  res.redirect("/todos-list");
});

app.put("/todos-list/edit/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { task } = req.body;
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).send("Tugas tidak ditemukan");
  }
  if (!task || task.trim() === "") {
    return res.status(400).send("Task tidak boleh kosong");
  }

  todo.task = task.trim();
  res.redirect("/todos-list");
});

app.delete("/todos-list/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).send("Tugas tidak ditemukan");
  }

  todos.splice(index, 1);
  res.redirect("/todos-list");
});


app.get("/todo-view", (req,res) => {
  db.query("SELECT * FROM todos", (err, todos) => {
    if (err) return res.status(500).send("internal server error")
    res.render("todo", {
      todos: todos, layout: "layouts/main-layout"
    });
  });
});

// GET: Mengambil semua todos
app.get("/api/todos", (req, res) => {
  console.log("Menerima permintaan GET untuk todos.");
  db.query("SELECT * FROM todos", (err, todos) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log("Berhasil mengirim todos:", todos.length, "item.");
    res.json({ todos: todos });
  });
});

// POST: Menambah todo baru
app.post("/api/todos", (req, res) => {
    const { task } = req.body;
    console.log("Menerima permintaan POST untuk menambah task:", task);

    if (!task) {
        console.error("Task tidak ditemukan di body permintaan.");
        return res.status(400).json({ error: 'Task is required' });
    }
    const query = 'INSERT INTO todos (task, completed) VALUES (?, ?)';
    db.query(query, [task, false], (err, result) => {
        if (err) {
            console.error("Database insert error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        console.log("Todo berhasil ditambahkan dengan ID:", result.insertId);
        res.status(201).json({ 
            message: 'Todo added successfully', 
            id: result.insertId,
            task, 
            completed: false 
        });
    });
});

// PUT: Memperbarui status 'completed' saja
app.put("/api/todos/:id", (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    
    console.log(`Menerima permintaan PUT untuk ID: ${id} dengan status completed: ${completed}`);

    // Validasi input
    if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: "Invalid 'completed' value. Must be a boolean." });
    }
    
    const query = 'UPDATE todos SET completed = ? WHERE id = ?';

    db.query(query, [completed, id], (err, result) => {
        if (err) {
            console.error("Database update error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (result.affectedRows === 0) {
            console.error("Todo tidak ditemukan untuk ID:", id);
            return res.status(404).json({ error: 'Todo not found' });
        }
        console.log(`Todo dengan ID ${id} berhasil diperbarui.`);
        res.json({ message: 'Todo updated successfully' });
    });
});

// DELETE: Menghapus todo berdasarkan ID
app.delete("/api/todos/:id", (req, res) => {
    const { id } = req.params;
    console.log(`Menerima permintaan DELETE untuk ID: ${id}`);
    const query = 'DELETE FROM todos WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Database delete error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (result.affectedRows === 0) {
            console.error("Todo tidak ditemukan untuk ID:", id);
            return res.status(404).json({ error: 'Todo not found' });
        }
        console.log(`Todo dengan ID ${id} berhasil dihapus.`);
        res.json({ message: 'Todo deleted successfully' });
    });
});

//middleware
app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});