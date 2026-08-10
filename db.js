// Simple IndexedDB wrapper

const openDB = (name, version, upgradeCallback) =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => upgradeCallback(e.target.result);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });

const txStore = (db, storeName, mode = "readonly") =>
  db.transaction(storeName, mode).objectStore(storeName);

export async function getUsersDB() {
  return openDB("usersDB", 1, (db) => {
    if (!db.objectStoreNames.contains("users")) {
      const store = db.createObjectStore("users", { keyPath: "eml" });
      store.createIndex("byEmail", "eml", { unique: true });
    }
  });
}

export async function getUserTasksDB(email) {
  return openDB(`tasks_${email}`, 1, (db) => {
    if (!db.objectStoreNames.contains("tasks")) {
      const store = db.createObjectStore("tasks", { keyPath: "now" });
      store.createIndex("byDate", "whenDate", { unique: false });
      store.createIndex("byName", "what", { unique: false });
    }
  });
}

export async function getUserSymptomsDB(email) {
  return openDB(`symptoms_${email}`, 1, (db) => {
    if (!db.objectStoreNames.contains("symptoms")) {
      const store = db.createObjectStore("symptoms", { keyPath: "now" });
      store.createIndex("byDate", "whenDate", { unique: false });
    }
  });
}

export async function addUser(userObj) {
  const db = await getUsersDB();
  return new Promise((resolve, reject) => {
    const store = txStore(db, "users", "readwrite");
    const req = store.put(userObj);
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getUserByEmail(email) {
  const db = await getUsersDB();
  return new Promise((resolve, reject) => {
    const store = txStore(db, "users");
    const req = store.get(email);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function addTask(email, taskObj) {
  const db = await getUserTasksDB(email);
  return new Promise((resolve, reject) => {
    const store = txStore(db, "tasks", "readwrite");
    const req = store.put(taskObj);
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getTasksByDate(email, dateStr) {
  const db = await getUserTasksDB(email);
  return new Promise((resolve, reject) => {
    const store = txStore(db, "tasks");
    const idx = store.index("byDate");
    const req = idx.getAll(dateStr);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getTasksByName(email, nameStr) {
  const db = await getUserTasksDB(email);
  return new Promise((resolve, reject) => {
    const store = txStore(db, "tasks");
    const idx = store.index("byName");
    const req = idx.getAll(nameStr);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function updateTask(email, taskObj) {
  return addTask(email, taskObj);
}

export async function addSymptom(email, symptomObj) {
  const db = await getUserSymptomsDB(email);
  return new Promise((resolve, reject) => {
    const store = txStore(db, "symptoms", "readwrite");
    const req = store.put(symptomObj);
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getSymptomsByDate(email, dateStr) {
  const db = await getUserSymptomsDB(email);
  return new Promise((resolve, reject) => {
    const store = txStore(db, "symptoms");
    const idx = store.index("byDate");
    const req = idx.getAll(dateStr);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}
