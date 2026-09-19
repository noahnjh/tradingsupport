const state = JSON.parse(localStorage.getItem("session-check-in") || "{}" );
const checks = [document.querySelector("#ackButton"), document.querySelector("#newsButton"), document.querySelector("#htfButton")];
const sessionOptions = document.querySelectorAll(".session-option");
const tradeButtons = document.querySelectorAll(".trade-button");
const themeButton = document.querySelector("#themeButton");
const startButton = document.querySelector("#startButton");
const breakButton = document.querySelector("#breakButton");
const completeButton = document.querySelector("#completeButton");
const resetButtons = document.querySelectorAll("#resetButton, #resetBottomButton");
const tradeCheckins = document.querySelector("#tradeCheckins");
const afterSession = document.querySelector("#afterSession");
const routineCount = document.querySelector("#routineCount");
const statusMessage = document.querySelector("#statusMessage");
const noteInput = document.querySelector("#noteInput");
const sessionHeading = document.querySelector("#sessionHeading");
const moodGroups = ["arrival", "trade1", "trade2", "after"];
const riskyEmotions = ["Restless", "Uncertain", "Anxious", "Frustrated", "Greedy"];
const emotionOptions = [
  ["Focused", "focused"], ["Calm", "calm"], ["Confident", "confident"], ["Happy", "happy"], ["Patient", "patient"],
  ["Restless", "restless"], ["Uncertain", "uncertain"], ["Anxious", "anxious"], ["Frustrated", "frustrated"], ["Greedy", "greedy"]
];

state.checks = state.checks || [false, false];
state.checks[2] = Boolean(state.checks[2]);
if (!state.sessionChoiceInitialized) {
  state.session = "";
  state.sessionChoiceInitialized = true;
  localStorage.setItem("session-check-in", JSON.stringify(state));
}
state.moods = state.moods || {};
moodGroups.forEach((group) => {
  state.moods[group] = Array.isArray(state.moods[group]) ? state.moods[group] : state.moods[group] ? [state.moods[group]] : [];
});
state.trades = state.trades || {};
state.theme = state.theme || "dark";

function createMoodButtons() {
  moodGroups.forEach((group) => {
    const grid = document.querySelector(`#${group === "arrival" ? "arrival" : group}MoodGrid`);
    grid.innerHTML = emotionOptions.map(([label, face]) => `<button class="mood" type="button" data-mood-group="${group}" data-mood="${label}" aria-label="${label}"><span class="mood-face face-${face}" aria-hidden="true"><i></i></span><span>${label}</span></button>`).join("");
  });
}

function saveState() {
  localStorage.setItem("session-check-in", JSON.stringify(state));
}

function render() {
  checks.forEach((button, index) => {
    const active = Boolean(state.checks?.[index]);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".mood").forEach((button) => button.setAttribute("aria-pressed", String(state.moods[button.dataset.moodGroup].includes(button.dataset.mood))));
  sessionOptions.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.session === state.session)));
  tradeButtons.forEach((button) => {
    const active = button.dataset.trade === state.activeTrade;
    button.setAttribute("aria-pressed", String(active));
    document.querySelector(`#${button.dataset.trade}Panel`).hidden = !active;
  });
  document.documentElement.dataset.theme = state.theme;
  themeButton.textContent = state.theme === "dark" ? "☼" : "☾";
  themeButton.setAttribute("aria-label", state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  sessionHeading.textContent = state.session || "Choose a session";
  tradeCheckins.hidden = !state.sessionStarted;
  completeButton.hidden = !state.sessionStarted;
  completeButton.setAttribute("aria-pressed", String(Boolean(state.sessionCompleted)));
  afterSession.hidden = !state.sessionCompleted;
  noteInput.value = state.note || "";
  const completedChecks = state.checks.filter(Boolean).length;
  routineCount.textContent = `${completedChecks} / 3`;
  const readyToStart = completedChecks === 3 && state.moods.arrival.length > 0;
  startButton.disabled = !readyToStart || state.sessionStarted;
  startButton.textContent = state.sessionStarted ? "Session in progress" : "Start session";
  breakButton.textContent = state.takingBreak ? "Break noted for today" : "Taking a break today";
  breakButton.setAttribute("aria-pressed", String(Boolean(state.takingBreak)));
  statusMessage.textContent = state.takingBreak ? "Good call. Rest is part of the process." : state.sessionStarted ? "Stay with your plan. Check back in when you are done." : readyToStart ? `${state.moods.arrival.join(" + ")} noted. You are ready.` : completedChecks === 3 ? "Select at least one arrival emotion to begin." : "I'm proud of you for showing up for yourself.";
  statusMessage.classList.toggle("ready", readyToStart);
  moodGroups.forEach((group) => {
    const reminder = document.querySelector(`#${group}Reminder`);
    if (!reminder) return;
    const needsReminder = group !== "after" && state.moods[group].some((emotion) => riskyEmotions.includes(emotion));
    reminder.hidden = !needsReminder;
    reminder.textContent = group === "arrival" ? "A gentle check-in: it is okay not to trade today. Protecting your state is part of the process." : "Whatever you're feeling is okay. Notice it, take a breath, and stay connected to your plan.";
  });
}

checks.forEach((button, index) => button.addEventListener("click", () => {
  state.checks = state.checks || [false, false];
  state.checks[index] = !state.checks[index];
  saveState();
  render();
}));

function attachMoodListeners() {
  document.querySelectorAll(".mood").forEach((button) => button.addEventListener("click", () => {
  const group = button.dataset.moodGroup;
  const selected = state.moods[group];
  state.moods[group] = selected.includes(button.dataset.mood) ? selected.filter((emotion) => emotion !== button.dataset.mood) : [...selected, button.dataset.mood];
  saveState();
  render();
  }));
}

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
  state.sessionStarted = true;
  state.sessionCompleted = false;
  state.takingBreak = false;
  saveState();
  render();
  startButton.disabled = true;
});

completeButton.addEventListener("click", () => {
  state.sessionCompleted = !state.sessionCompleted;
  saveState();
  render();
});

breakButton.addEventListener("click", () => {
  state.takingBreak = !state.takingBreak;
  state.sessionStarted = false;
  state.sessionCompleted = false;
  saveState();
  render();
});

function resetSession() {
  localStorage.removeItem("session-check-in");
  state.checks = [false, false, false];
  state.session = "";
  state.sessionChoiceInitialized = true;
  state.moods = { arrival: [], trade1: [], trade2: [], after: [] };
  state.trades = {};
  state.activeTrade = "";
  state.sessionStarted = false;
  state.sessionCompleted = false;
  state.takingBreak = false;
  state.note = "";
  render();
}

resetButtons.forEach((button) => button.addEventListener("click", resetSession));

createMoodButtons();
attachMoodListeners();
render();