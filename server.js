function verifyToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid Token" });
  }
}
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = "mysecretkey";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// DB Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "expense_tracker"
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("Database Connected");
  }
});

// ✅ THIS IS THE IMPORTANT PART (test route)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Register API
app.post("/register", async (req, res) => {
  console.log("Incoming Data:", req.body); // 🔍 debug

  let { name, email, password } = req.body;

  // ✅ Trim values (IMPORTANT)
  name = name?.trim();
  email = email?.trim();
  password = password?.trim();

  // ❌ Block empty
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // ❌ Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // ❌ Password check
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // ✅ Check existing user
  const checkSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkSql, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
      db.query(insertSql, [name, email, hashedPassword], (err) => {
        if (err) return res.status(500).json({ message: "Registration failed" });

        res.json({ message: "Registration successful" });
      });

    } catch (error) {
      res.status(500).json({ message: "Error hashing password" });
    }
  });
});

// Login API
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // ✅ Check empty fields
  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    // ✅ Check user exists
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    // ✅ Compare password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { user_id: user.user_id },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login success", token });
  });
});
// Add Expense API
app.post("/add-expense", verifyToken, (req, res) => {
  const user_id = req.user.user_id; // from token
  const { category_id, amount, date, description } = req.body;

  const sql = `
  INSERT INTO expenses 
  (user_id, category_id, amount, expense_date, description)
  VALUES (?, ?, ?, NOW(), ?)
`;

  db.query(sql, [user_id, category_id, amount, date, description], (err) => {
    if (err) return res.send(err);
    res.send("Expense Added Successfully");
  });
});
// Get Expenses API
// Get Expenses API
app.get("/expenses", verifyToken, (req, res) => {
  const user_id = req.user.user_id;

  const sql = `
    SELECT e.expense_id, e.amount, e.expense_date, e.description, c.category_name
    FROM expenses e
    JOIN categories c ON e.category_id = c.category_id
    WHERE e.user_id = ?
    ORDER BY e.expense_date DESC
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
// Delete Expense API
// Delete Expense API
app.delete("/delete-expense/:id", verifyToken, (req, res) => {
  const id = req.params.id;
  const user_id = req.user.user_id;

  const sql = "DELETE FROM expenses WHERE expense_id = ? AND user_id = ?";

  db.query(sql, [id, user_id], (err, result) => {
    if (err) return res.status(500).send("Error deleting");

    if (result.affectedRows === 0) {
      return res.status(404).send("Not found");
    }

    res.json({ message: "Deleted successfully" });
  });
});
// Update Expense API
app.put("/update-expense/:id", verifyToken, (req, res) => {
  const id = req.params.id;
  const user_id = req.user.user_id;
  const { amount, description } = req.body;

  const sql = `
    UPDATE expenses 
    SET amount = ?, description = ?
    WHERE expense_id = ? AND user_id = ?
  `;

  db.query(sql, [amount, description, id, user_id], (err, result) => {
    if (err) return res.status(500).send("Update failed");

    if (result.affectedRows === 0) {
      return res.status(404).send("Not found");
    }

    res.send("Updated successfully");
  });
});
// Start server
app.listen(5000, () => {
  console.log("Server running on https://expense-tracker-backend.onrender.com");
});
