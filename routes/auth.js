const express = require("express");
const bcrypt =  require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const router = express.Router();

// endpoint registrasi
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || ! password)
        return res.status(400).json({ msg: "Please enter all fields"});

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query (
        "INSERT INTO users SET ?",
        { name, email, password: hashedPassword },
        (err) => {
            if (err) return res.status(500).json ({ error: err.message });
            res.status(201).json({ msg: "User registered successfully" });
        }
    );
});

//endpoint login
router.post("/login", (req, res) => {
    const { email, password, } = req.body;
    if(!email || !password)
        return res.status(400).json({ msg: "Please enter all fields" });

    db.query(
        "SELECT * FROM users WHERE email =?",
        [email],
        async (err, results) => {
            const user = results[0];
            if (!user) return res.status(400).json({ msg: "Email tidak ditemukan" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: "Password salah" });

            const token = jwt.sign({ id: user.id }, "your_super_secret_jwt_key", {
                expiresIn: 3600,
            });
            res.json({ token, user: { id: user.id, email: user.email, name: user.name }});
        }
    );
});

module.exports = router;