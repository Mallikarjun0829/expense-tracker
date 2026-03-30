function showHome() {
  hideAll();
  document.getElementById("homePage").classList.remove("hidden");

  document.getElementById("navButtons").classList.remove("hidden");
  document.getElementById("navLogout").classList.add("hidden");
}

function showLogin() {
  hideAll();
  document.getElementById("loginContainer").classList.remove("hidden");
}

function showRegister() {
  hideAll();
  document.getElementById("registerContainer").classList.remove("hidden");
}

function showDashboard() {
  hideAll();
  document.getElementById("dashboard").classList.remove("hidden");

  document.getElementById("navButtons").classList.add("hidden");
  document.getElementById("navLogout").classList.remove("hidden");
}

function hideAll() {
  document.getElementById("homePage").classList.add("hidden");
  document.getElementById("loginContainer").classList.add("hidden");
  document.getElementById("registerContainer").classList.add("hidden");
  document.getElementById("dashboard").classList.add("hidden");
}

// Register
function register() {
  const data = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  };

  fetch("https://expense-tracker-backend.onrender.com/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  })
  .then(res => res.text())
  .then(data => alert(data));
}
// Login
function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  // ✅ Frontend validation
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  fetch("https://expense-tracker-backend.onrender.com/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Login Successful");
      showDashboard();
    } else {
      alert(data.message);
    }
  })
  .catch(err => console.log(err));
}
function logout() {
  localStorage.removeItem("token");
  showHome(); // ✅ go back to home
}
function addExpense() {
  const token = localStorage.getItem("token");

  const data = {
    category_id: document.getElementById("category").value,
    amount: document.getElementById("amount").value,
    date: document.getElementById("date").value,
    description: document.getElementById("desc").value
  };

  fetch("https://expense-tracker-backend.onrender.com/add-expense", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify(data)
  })
  .then(res => res.text())
  .then(data => alert(data));
}
function getExpenses() {
  const token = localStorage.getItem("token");

  fetch("http://localhost:5000/expenses", {
    headers: {
      "Authorization": token
    }
  })
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("expenseList");
      list.innerHTML = "";

      data.forEach(exp => {
        const li = document.createElement("li");

        li.innerHTML = `
  <div id="view-${exp.expense_id}">
    ${exp.category_name} - ₹${exp.amount}
    <br>
    <small>${new Date(exp.expense_date).toLocaleString()}</small>
  </div>

  <div id="edit-${exp.expense_id}" class="hidden">
    <input type="number" id="amount-${exp.expense_id}" value="${exp.amount}">
    <button onclick="updateExpense(${exp.expense_id})">Save</button>
    <button onclick="cancelEdit(${exp.expense_id})">Cancel</button>
  </div>

  <div class="actions">
    <button onclick="enableEdit(${exp.expense_id})">✏️</button>
    <button onclick="deleteExpense(${exp.expense_id})">🗑️</button>
  </div>
`;

        list.appendChild(li);
      });
    });
}
function deleteExpense(id) {
  fetch(`https://expense-tracker-backend.onrender.com/delete-expense/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": localStorage.getItem("token")
    }
  })
  .then(res => res.json())
  .then(data => {
    showToast(data.message); // 🔥 toast instead of alert
    loadExpenses();          // refresh instantly
  })
  .catch(err => console.error(err));
}
function updateExpense(id) {
  const amount = document.getElementById(`amount-${id}`).value;

  fetch(`https://expense-tracker-backend.onrender.com/update-expense/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem("token")
    },
    body: JSON.stringify({ amount, description: "" })
  })
  .then(res => res.text())
  .then(msg => {
    showToast(msg);   // 🔥 toast
    loadExpenses();   // refresh
  })
  .catch(err => console.error(err));
}
function enableEdit(id) {
  document.getElementById(`view-${id}`).classList.add("hidden");
  document.getElementById(`edit-${id}`).classList.remove("hidden");
}

function cancelEdit(id) {
  document.getElementById(`edit-${id}`).classList.add("hidden");
  document.getElementById(`view-${id}`).classList.remove("hidden");
}
function loadExpenses() {
  fetch("https://expense-tracker-backend.onrender.com/expenses", {
    headers: {
      "Authorization": localStorage.getItem("token")
    }
  })
  .then(res => res.json())
  .then(data => {
    displayExpenses(data); // ✅ single render function
    drawChart(data);       // ✅ update chart
  });
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}
