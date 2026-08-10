import { SecQ, Person } from "./Person.js";
import { Todo } from "./Todo.js";
import { Symptom } from "./Symptom.js";
import {
  addUser,
  getUserByEmail,
  addTask,
  getTasksByDate,
  getTasksByName,
  updateTask,
  addSymptom,
  getSymptomsByDate
} from "./db.js";

let currentUser = null;
let currentView = "calendar"; // calendar | tasksByName | symptoms
let selectedDate = new Date().toISOString().slice(0, 10);

const appEl = document.getElementById("app");

// Simple hash (not secure, but better than plain text)
function hashPwd(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h.toString();
}

function render() {
  if (!currentUser) {
    renderAuth();
  } else {
    renderShell();
  }
}

function renderAuth() {
  appEl.innerHTML = `
    <div class="panel" style="max-width:420px;margin:2rem auto;">
      <h2>Welcome</h2>
      <p class="muted">Plan tasks, track wellbeing, and log symptoms.</p>
      <div style="margin-top:1rem;">
        <div style="margin-bottom:0.75rem;">
          <label>Email</label>
          <input id="auth-email" type="email" />
        </div>
        <div style="margin-bottom:0.75rem;">
          <label>Password</label>
          <input id="auth-pwd" type="password" />
        </div>
        <div class="nav">
          <button id="btn-login">Login</button>
          <button class="secondary" id="btn-register">Register</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-login").onclick = onLogin;
  document.getElementById("btn-register").onclick = onRegister;
}

const regSW = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js",  {
        scope: "/",
      });
      if (registration.installing) {
        console.log("Service Worker Installing.");
      } else if (registration.waiting) {
        console.log("Service Worker Installed.");
      } else if (registration.active) {
        console.log("Service Worker Active.");
      }
    } catch (error) {
      console.log(`Registration failed with error: ${error}`);
    }
  }
};                                

async function onLogin() {
  const eml = document.getElementById("auth-email").value.trim();
  const pwd = document.getElementById("auth-pwd").value;
  if (!eml || !pwd) return;

  const user = await getUserByEmail(eml);
  if (!user) {
    alert("User not found.");
    return;
  }
  if (user.pwd !== hashPwd(pwd)) {
    alert("Incorrect password.");
    return;
  }
  currentUser = user;
  regSW();
  render();
}

async function onRegister() {
  const eml = document.getElementById("auth-email").value.trim();
  const pwd = document.getElementById("auth-pwd").value;
  if (!eml || !pwd) return;

  const existing = await getUserByEmail(eml);
  if (existing) {
    alert("User already exists.");
    return;
  }

  const p = new Person();
  p.setEml(eml);
  p.setPwd(hashPwd(pwd));
  p.setNme(eml.split("@")[0]);
  await addUser(p);
  alert("Registered. Please log in.");
}

function renderShell() {
  appEl.innerHTML = `
    <div class="app-shell">
      <div class="panel">
        <h3>${currentUser.name}</h3>
        <p class="muted">${currentUser.eml}</p>
        <button class="secondary" id="btn-logout" style="margin-top:0.5rem;">Logout</button>
        <hr style="margin:1rem 0;border:none;border-top:1px solid rgba(148,163,184,0.3);" />
        <div class="nav">
          <button id="nav-calendar">By date</button>
          <button id="nav-tasks-name">By name</button>
          <button id="nav-symptoms">Symptoms</button>
        </div>
        <div style="margin-top:1rem;">
          <label>Selected date</label>
          <input id="date-picker" type="date" value="${selectedDate}" />
        </div>
        <div style="margin-top:1rem;">
          <button id="btn-add-task">Add task</button>
          <button class="secondary" id="btn-add-symptom" style="margin-top:0.5rem;">Add symptom</button>
        </div>
      </div>
      <div class="panel" id="main-panel"></div>
    </div>
  `;

  document.getElementById("btn-logout").onclick = () => {
    currentUser = null;
    render();
  };

  document.getElementById("nav-calendar").onclick = () => {
    currentView = "calendar";
    renderMain();
  };
  document.getElementById("nav-tasks-name").onclick = () => {
    currentView = "tasksByName";
    renderMain();
  };
  document.getElementById("nav-symptoms").onclick = () => {
    currentView = "symptoms";
    renderMain();
  };

  document.getElementById("date-picker").onchange = (e) => {
    selectedDate = e.target.value;
    renderMain();
  };

  document.getElementById("btn-add-task").onclick = showAddTaskModal;
  document.getElementById("btn-add-symptom").onclick = showAddSymptomModal;

  renderMain();
}

async function renderMain() {
  const panel = document.getElementById("main-panel");
  if (currentView === "calendar") {
    await renderCalendar(panel);
  } else if (currentView === "tasksByName") {
    await renderTasksByName(panel);
  } else if (currentView === "symptoms") {
    await renderSymptoms(panel);
  }
}

async function renderCalendar(panel) {
  const date = new Date(selectedDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0..6
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // tasks for selected date
  const tasksToday = await getTasksByDate(currentUser.eml, selectedDate);

  let gridHtml = "";
  for (let i = 0; i < startWeekday; i++) {
    gridHtml += `<div class="calendar-day"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = dayStr === new Date().toISOString().slice(0, 10);
    gridHtml += `
      <div class="calendar-day ${isToday ? "today" : ""}" data-date="${dayStr}">
        <div class="muted" style="margin-bottom:0.25rem;">${d}</div>
      </div>
    `;
  }

  panel.innerHTML = `
    <h3>Tasks on ${selectedDate}</h3>
    <div class="list" style="margin-bottom:1rem;">
      ${tasksToday.length === 0 ? `<p class="muted">No tasks for this date.</p>` : tasksToday.map(t => `
        <div class="list-item">
          <div>
            <div>${t.what}</div>
            <div class="muted">${t.whenTime} · mv ${t.moodval} · mi ${t.moodsev}</div>
          </div>
          <div>
            ${t.iscomp ? `<span class="badge">Done</span>` : `<button data-now="${t.now}" class="btn-complete">Complete</button>`}
          </div>
        </div>
      `).join("")}
    </div>
    <h4>Month view</h4>
    <div class="calendar-grid">
      ${gridHtml}
    </div>
  `;

  panel.querySelectorAll(".calendar-day[data-date]").forEach((el) => {
    el.onclick = () => {
      selectedDate = el.dataset.date;
      document.getElementById("date-picker").value = selectedDate;
      renderMain();
    };
  });

  panel.querySelectorAll(".btn-complete").forEach((btn) => {
    btn.onclick = () => showCompleteTaskModal(btn.dataset.now);
  });
}

async function renderTasksByName(panel) {
  // simple search by name
  panel.innerHTML = `
    <h3>Tasks by name</h3>
    <div style="margin-bottom:0.75rem;">
      <label>Task name</label>
      <input id="task-name-search" placeholder="Exact name" />
    </div>
    <button id="btn-search-name">Search</button>
    <div id="tasks-name-results" style="margin-top:1rem;"></div>
  `;

  document.getElementById("btn-search-name").onclick = async () => {
    const name = document.getElementById("task-name-search").value.trim();
    const resEl = document.getElementById("tasks-name-results");
    if (!name) {
      resEl.innerHTML = `<p class="muted">Enter a task name.</p>`;
      return;
    }
    const tasks = await getTasksByName(currentUser.eml, name);
    if (!tasks.length) {
      resEl.innerHTML = `<p class="muted">No tasks found with that name.</p>`;
      return;
    }
    resEl.innerHTML = `
      <div class="list">
        ${tasks.map(t => `
          <div class="list-item">
            <div>
              <div>${t.what}</div>
              <div class="muted">${t.whenDate} ${t.whenTime}</div>
            </div>
            <div>
              ${t.iscomp ? `<span class="badge">Done</span>` : `<button data-now="${t.now}" class="btn-complete">Complete</button>`}
            </div>
          </div>
        `).join("")}
      </div>
    `;
    resEl.querySelectorAll(".btn-complete").forEach((btn) => {
      btn.onclick = () => showCompleteTaskModal(btn.dataset.now);
    });
  };
}

async function renderSymptoms(panel) {
  const symptoms = await getSymptomsByDate(currentUser.eml, selectedDate);
  panel.innerHTML = `
    <h3>Symptoms on ${selectedDate}</h3>
    <div class="list">
      ${symptoms.length === 0 ? `<p class="muted">No symptoms recorded.</p>` : symptoms.map(s => `
        <div class="list-item">
          <div>
            <div>${s.what}</div>
            <div class="muted">${s.whenTime} · severity ${s.severity} · duration ${s.duration}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

/* Modals (simple inline prompts for now) */

function showAddTaskModal() {
  const what = prompt("Task description:");
  if (!what) return;
  const whenDate = selectedDate;
  const whenTime = prompt("Time (HH:MM):", "09:00") || "09:00";
  const now = Date.now();
  const t = new Todo(now, whenDate, whenTime, what);
  t.notes = prompt("Notes (optional):", "") || "";
  t.urgency = Number(prompt("Urgency (0–7):", "0") || 0);
  addTask(currentUser.eml, t).then(() => renderMain());
}

function showCompleteTaskModal(taskNow) {
  // fetch task by date + now (simple approach)
  getTasksByDate(currentUser.eml, selectedDate).then((tasks) => {
    const t = tasks.find(x => String(x.now) === String(taskNow));
    if (!t) return;
    const mv = Number(prompt("Mood valence (-3..+3):", String(t.moodval || 0)) || 0);
    const mi = Number(prompt("Mood intensity (0..7):", String(t.moodsev || 0)) || 0);
    var well = [3, 5, 7, 11, 13];
    for (var i = 0; i < well.length; i++) {
      var wb = "";
      switch (well[i]) {
        case well[i] == 3:
          wb = "Connect";
          break;
        case well[i] == 5:
          wb = "Learn";
          break;
        case well[i] == 7:
          wb = "Exercise";
          break;
        case well[i] == 11:
          wb = "Take Notice";
          break;
        case well[i] == 13:
          wb = "Give";
          break;      
      }
      if (prompt("This task made me " + wb + "? (y/n)").toLowerCase() == "y") {
        t.wellbeing *= well[i];
      }
    }
    const notes = prompt("Update notes (optional):", t.notes || "") || t.notes;
    t.moodval = mv;
    t.moodsev = mi;
    t.notes = notes;
    t.iscomp = true;
    t.ismod = 1;
    updateTask(currentUser.eml, t).then(() => renderMain());
  });
}

function showAddSymptomModal() {
  const what = prompt("Symptom description:");
  if (!what) return;
  const whenDate = selectedDate;
  const whenTime = prompt("Time (HH:MM):", "09:00") || "09:00";
  const now = Date.now();
  const s = new Symptom(now, whenDate, whenTime, what);
  s.notes = prompt("Notes (optional):", "") || "";
  s.severity = Number(prompt("Severity (0–7):", "0") || 0);
  s.duration = Number(prompt("Duration (minutes):", "0") || 0);
  addSymptom(currentUser.eml, s).then(() => renderMain());
}

render();
