const state = JSON.parse(localStorage.getItem("session-check-in") || "{}" );
const checks = [document.querySelector("#ackButton"), document.querySelector("#newsButton")];
const moods = document.querySelectorAll(".mood");
const sessionOptions = document.querySelectorAll(".session-option");
const tradeButtons = document.querySelectorAll(".trade-button");
const themeButton = document.querySelector("#themeButton");
const startButton = document.querySelector("#startButton");
const progressBar = document.querySelector("#progressBar");
const routineCount = document.querySelector("#routineCount");
const statusMessage = document.querySelector("#statusMessage");
const noteInput = document.querySelector("#noteInput");
const sessionHeading = document.querySelector("#sessionHeading");
const sessionTime = document.querySelector("#sessionTime");

state.checks = state.checks || [false, false];
state.session = state.session || "New York";
state.moods = state.moods || {};
state.trades = state.trades || {};
state.theme = state.theme || "dark";

function saveState() {
  localStorage.setItem("session-check-in", JSON.stringify(state));
}

function render() {
  checks.forEach((button, index) => {
    const active = Boolean(state.checks?.[index]);
    button.setAttribute("aria-pressed", String(active));
  });
  moods.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mood === state.moods[button.dataset.moodGroup])));
  sessionOptions.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.session === state.session)));
  tradeButtons.forEach((button) => {
    const active = button.dataset.trade === state.activeTrade;
    button.setAttribute("aria-pressed", String(active));
    document.querySelector(`#${button.dataset.trade}Panel`).hidden = !active;
  });
  document.documentElement.dataset.theme = state.theme;
  themeButton.textContent = state.theme === "dark" ? "☼" : "☾";
  themeButton.setAttribute("aria-label", state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  sessionHeading.textContent = state.session === "Asia" ? "Asia open" : "New York open";
  sessionTime.textContent = state.session === "Asia" ? "20:00 — 22:00 ET" : "09:30 — 11:30 ET";
  noteInput.value = state.note || "";
  const completedChecks = state.checks.filter(Boolean).length;
  routineCount.textContent = `${completedChecks} / 2`;
  const progress = 18 + (completedChecks * 19) + (state.moods.arrival ? 10 : 0) + (state.activeTrade ? 10 : 0);
  progressBar.style.width = `${progress}%`;
  startButton.disabled = completedChecks !== 2;
  statusMessage.textContent = completedChecks === 2 ? (state.moods.arrival ? `${state.moods.arrival} noted. You are ready.` : "Checks complete. Add a mood when you are ready.") : "Complete the two checks to begin.";
  statusMessage.classList.toggle("ready", completedChecks === 2);
}

checks.forEach((button, index) => button.addEventListener("click", () => {
  state.checks = state.checks || [false, false];
  state.checks[index] = !state.checks[index];
  saveState();
  render();
}));

moods.forEach((button) => button.addEventListener("click", () => {
  const group = button.dataset.moodGroup;
  state.moods[group] = state.moods[group] === button.dataset.mood ? "" : button.dataset.mood;
  saveState();
  render();
}));

sessionOptions.forEach((button) => button.addEventListener("click", () => {
  state.session = button.dataset.session;
  saveState();
  render();
}));

tradeButtons.forEach((button) => button.addEventListener("click", () => {
  state.activeTrade = state.activeTrade === button.dataset.trade ? "" : button.dataset.trade;
  saveState();
  render();
}));

themeButton.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState();
  render();
});

noteInput.addEventListener("input", () => {
  state.note = noteInput.value;
  saveState();
});

startButton.addEventListener("click", () => {
  startButton.querySelector("span").textContent = "Session in progress";
  statusMessage.textContent = "Stay with your plan. Check back in when you are done.";
  statusMessage.classList.add("ready");
  startButton.disabled = true;
});

document.querySelector("#resetButton").addEventListener("click", () => {
  localStorage.removeItem("session-check-in");
  state.checks = [false, false];
  state.session = "New York";
  state.moods = {};
  state.trades = {};
  state.activeTrade = "";
  state.note = "";
  startButton.querySelector("span").textContent = "Start session";
  render();
});

render();