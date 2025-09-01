const methodOverride = require("method-override");
const express = require("express");
const app = express();
const cors = require("cors");
//const port = 3001;
require("dotenv").config();
const db = require("./database/db");
const port = process.env.PORT;

//const todoRoutes = require("./routes/todo.js"); //ini array, kita gk make array
const { todos } = require("./routes/todo.js");
const todoRoutes = require('./routes/tododb');

//middleware untuk parsing json dan form
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const expressLayouts = require("express-ejs-layouts");
app.use(expressLayouts);

app.use(express.json());
app.use("/todos", todoRoutes); 

// atur EJS sebagai view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", {
    layout: "layouts/main-layout",
  }); // render file index.ejs
});

app.get("/contact", (req, res) => {
res.render("contact", {
  layout: "layouts/main-layout",
});
});

app.get("/todo-view", (req, res) => {
  db.query("SELECT * FROM todos", (err, todos) => {
    if(err) return res.status(500).send("Internal Server Error");
    res.render("todo", {
      layout: "layouts/main-layout",
      todos: todos,
    });
  });
});

// GET: Mengambil semua todos
// app.get("/api/todos", (req, res) => {
//   console.log("Menerima permintaan GET untuk todos.");
//   db.query("SELECT * FROM todos", (err, todos) => {
//     if (err) {
//       console.error("Database query error:", err);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//     console.log("Berhasil mengirim todos:", todos.length, "item.");
//     res.json({ todos: todos });
//   });
// });

app.get("/api/todos", (req, res) => {
  const { search } = req.query;
  console.log(
    `Menerima permintaan GET untuk todos. Kriteria pencarian: '${search} || "Tidak ada"}'`
  );

  let query = "SELECT * FROM todos";
  const params = [];

  if (search) {
    query += " WHERE task LIKE ?";
    params.push(`%${search}%`);
  }

  db.query(query, params, (err, todos) => {
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

// MODIFIKASI - PUT: Memperbarui todo (bisa task, completed, atau keduanya)
app.put("/api/todos/:id", (req, res) => {
    const { id } = req.params;
    const { task, completed } = req.body; // <-- Ambil KEDUA kemungkinan properti

    console.log(`Menerima permintaan PUT untuk ID: ${id} dengan data:`, req.body);

    // Cek apakah ada data yang dikirim untuk diupdate
    if (task === undefined && completed === undefined) {
        return res.status(400).json({ error: "Tidak ada data untuk diupdate. Kirim 'task' atau 'completed'." });
    }
    
    let updateFields = [];
    let queryValues = [];

    // Jika ada 'task' di body, siapkan untuk query SQL
    if (task !== undefined) {
        updateFields.push("task = ?");
        queryValues.push(task);
    }

    // Jika ada 'completed' di body, siapkan untuk query SQL
    if (completed !== undefined) {
        if (typeof completed !== 'boolean') {
            return res.status(400).json({ error: "Nilai 'completed' harus boolean." });
        }
        updateFields.push("completed = ?");
        queryValues.push(completed);
    }
    
    // Gabungkan semua field yang akan diupdate
    const query = `UPDATE todos SET ${updateFields.join(', ')} WHERE id = ?`;
    queryValues.push(id);

    db.query(query, queryValues, (err, result) => {
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

//endpoint untuk mendapatkan data todos
app.get("/todos-data", (req, res) =>{
  res.json(todos); // mengembalikan data todos dalam format json
})

// GET untuk halaman daftar tugas
app.get("/todos-list", (req, res) => {
  res.render("todos-page", { 
    layout: "layouts/main-layout",
    todos 
  });
});

// POST 
app.post("/todos-list/add", (req, res) => {
  const { task } = req.body;
  if (!task || task.trim() === "") {
    return res.status(400).send("Task tidak boleh kosong");
  }

  const newTodo = {
    id: todos.length > 0 ? todos[todos.length - 1].id + 1 : 1,
    task: task.trim()
  };
  todos.push(newTodo);

  res.redirect("/todos-list");
});


// PUT update data
app.put("/todos-list/edit/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { task } = req.body;
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).send("Tugas tidak ditemukan");
  }
  if (!task || task.trim() === "") {
    return res.status(400).send("Task tidak boleh kosong");
  }

  todo.task = task.trim();
  res.redirect("/todos-list");
});

// DELETE hapus data
app.delete("/todos-list/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).send("Tugas tidak ditemukan");
  }

  todos.splice(index, 1);
  res.redirect("/todos-list");
});



//middleware
app.use((req, res) => {
res.status(404).send("404 - page not found");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});