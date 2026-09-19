const state = JSON.parse(localStorage.getItem("session-check-in") || "{}" );
const checks = [document.querySelector("#ackButton"), document.querySelector("#newsButton")];
const moods = document.querySelectorAll(".mood");
const startButton = document.querySelector("#startButton");
const progressBar = document.querySelector("#progressBar");
const routineCount = document.querySelector("#routineCount");
const statusMessage = document.querySelector("#statusMessage");
const noteInput = document.querySelector("#noteInput");

function saveState() {
  localStorage.setItem("session-check-in", JSON.stringify(state));
}

function render() {
  checks.forEach((button, index) => {
    const active = Boolean(state.checks?.[index]);
    button.setAttribute("aria-pressed", String(active));
  });
  moods.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mood === state.mood)));
  noteInput.value = state.note || "";
  const completedChecks = state.checks?.filter(Boolean).length || 0;
  routineCount.textContent = `${completedChecks} / 2`;
  const progress = 18 + (completedChecks * 25) + (state.mood ? 12 : 0);
  progressBar.style.width = `${progress}%`;
  startButton.disabled = completedChecks !== 2;
  statusMessage.textContent = completedChecks === 2 ? (state.mood ? `${state.mood} noted. You are ready.` : "Checks complete. Add a mood when you are ready.") : "Complete the two checks to begin.";
  statusMessage.classList.toggle("ready", completedChecks === 2);
}

checks.forEach((button, index) => button.addEventListener("click", () => {
  state.checks = state.checks || [false, false];
  state.checks[index] = !state.checks[index];
  saveState();
  render();
}));

moods.forEach((button) => button.addEventListener("click", () => {
  state.mood = state.mood === button.dataset.mood ? "" : button.dataset.mood;
  saveState();
  render();
}));

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
  state.mood = "";
  state.note = "";
  startButton.querySelector("span").textContent = "Start session";
  render();
});

render();