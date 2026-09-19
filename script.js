const state = JSON.parse(localStorage.getItem("session-check-in") || "{}" );
const checks = [document.querySelector("#ackButton"), document.querySelector("#newsButton"), document.querySelector("#htfButton")];
const sessionOptions = document.querySelectorAll(".session-option");
const tradeButtons = document.querySelectorAll(".trade-button");
const themeButton = document.querySelector("#themeButton");
const startButton = document.querySelector("#startButton");
const breakButton = document.querySelector("#breakButton");
const breakSuggestions = document.querySelector("#breakSuggestions");
const suggestionButtons = document.querySelectorAll(".suggestion-button");
const completeButton = document.querySelector("#completeButton");
const resetButtons = document.querySelectorAll("#resetButton, #resetBottomButton");
const setupRating = document.querySelector("#setupRating");
const setupRatingOptions = document.querySelectorAll(".setup-rating-option");
const setupRatingMessage = document.querySelector("#setupRatingMessage");
const tradeCheckins = document.querySelector("#tradeCheckins");
const afterSession = document.querySelector("#afterSession");
const routineCount = document.querySelector("#routineCount");
const statusMessage = document.querySelector("#statusMessage");
const noteInput = document.querySelector("#noteInput");
const reportButton = document.querySelector("#reportButton");
const reportResult = document.querySelector("#reportResult");
const reportImage = document.querySelector("#reportImage");
const copyReportButton = document.querySelector("#copyReportButton");
const downloadReportLink = document.querySelector("#downloadReportLink");
const reportStatus = document.querySelector("#reportStatus");
let reportBlob;
let reportObjectUrl;
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
state.setupRating = state.setupRating || "";
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
  setupRating.hidden = !state.sessionStarted;
  setupRatingOptions.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.rating === state.setupRating)));
  const setupMessages = {
    "A+": "This is a strong setup. Stay patient and execute your plan.",
    "B+": "It may be best to wait for a more ideal setup or trade with smaller size.",
    C: "This is not a trade we want to take. Protect your capital and pass."
  };
  setupRatingMessage.hidden = !state.setupRating;
  setupRatingMessage.textContent = setupMessages[state.setupRating] || "";
  setupRatingMessage.dataset.rating = state.setupRating;
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
  breakSuggestions.hidden = !state.takingBreak;
  suggestionButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.suggestion === state.breakSuggestion)));
  statusMessage.textContent = state.takingBreak ? (state.breakSuggestion ? `${state.breakSuggestion} sounds good. Take the time you need.` : "Good call. Rest is part of the process.") : state.sessionStarted ? "Stay with your plan. Check back in when you are done." : readyToStart ? `${state.moods.arrival.join(" + ")} noted. You are ready.` : completedChecks === 3 ? "Select at least one arrival emotion to begin." : "I'm proud of you for showing up for yourself.";
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
  if (!state.takingBreak) state.breakSuggestion = "";
  saveState();
  render();
});

suggestionButtons.forEach((button) => button.addEventListener("click", () => {
  state.breakSuggestion = state.breakSuggestion === button.dataset.suggestion ? "" : button.dataset.suggestion;
  saveState();
  render();
}));

setupRatingOptions.forEach((button) => button.addEventListener("click", () => {
  state.setupRating = state.setupRating === button.dataset.rating ? "" : button.dataset.rating;
  saveState();
  render();
}));

function drawReportText(context, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  const lines = [];
  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });
  if (line) lines.push(line);
  lines.forEach((currentLine, index) => context.fillText(currentLine, x, y + index * lineHeight));
  return y + Math.max(lines.length, 1) * lineHeight;
}

function reportValue(value) {
  return value?.length ? value.join(" + ") : "None recorded";
}

function createReportImage() {
  const canvas = document.createElement("canvas");
  const width = 1200;
  const padding = 78;
  const lineHeight = 32;
  const sections = [
    ["Trading session", state.session || "Not selected"],
    ["Arrival emotions", reportValue(state.moods.arrival)],
    ["Trade setup rating", state.setupRating || "Not rated"],
    ["After-session emotions", reportValue(state.moods.after)],
    ["Notes", state.note?.trim() || "No notes added"]
  ];
  if (state.moods.trade1.length > 0 && state.moods.trade2.length > 0) {
    sections.splice(2, 0, ["Trade 1 emotions", reportValue(state.moods.trade1)], ["Trade 2 emotions", reportValue(state.moods.trade2)]);
  }
  const canvasHeight = 320 + sections.length * 88;
  canvas.width = width;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  const isLight = state.theme === "light";
  const colors = isLight ? { background: "#f4f7f3", ink: "#18221e", muted: "#64736a", accent: "#b36f25", line: "#d5ded8", panel: "#e8eeea" } : { background: "#131b19", ink: "#e8eee8", muted: "#8f9b92", accent: "#e5ad62", line: "#283530", panel: "#17211e" };
  context.fillStyle = colors.background;
  context.fillRect(0, 0, width, canvasHeight);
  context.fillStyle = colors.panel;
  context.fillRect(padding, 54, width - padding * 2, canvasHeight - 108);
  context.fillStyle = colors.accent;
  context.fillRect(padding, 54, 12, 104);
  context.font = "700 22px Manrope, sans-serif";
  context.fillText("TRADING COMPANION", padding + 38, 102);
  context.font = "800 48px Manrope, sans-serif";
  context.fillStyle = colors.ink;
  context.fillText("Session check-in", padding + 38, 154);
  context.font = "500 18px DM Mono, monospace";
  context.fillStyle = colors.muted;
  context.fillText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), padding + 38, 194);
  let y = 270;
  sections.forEach(([label, value]) => {
    context.strokeStyle = colors.line;
    context.beginPath();
    context.moveTo(padding + 38, y - 22);
    context.lineTo(width - padding - 38, y - 22);
    context.stroke();
    context.font = "700 17px Manrope, sans-serif";
    context.fillStyle = colors.accent;
    context.fillText(label.toUpperCase(), padding + 38, y + 10);
    context.font = "500 22px Manrope, sans-serif";
    context.fillStyle = colors.ink;
    y = drawReportText(context, value, padding + 38, y + 46, width - padding * 2 - 76, lineHeight) + 34;
  });
  return canvas;
}

async function copyReportImage() {
  if (!reportBlob || !navigator.clipboard || !window.ClipboardItem) {
    reportStatus.textContent = "Copying images is unavailable in this browser. Use Download image instead.";
    return false;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": reportBlob })]);
    reportStatus.textContent = "Report image copied to your clipboard.";
    return true;
  } catch (error) {
    reportStatus.textContent = "Copying was blocked by the browser. Use Download image instead.";
    return false;
  }
}

reportButton.addEventListener("click", () => {
  reportButton.disabled = true;
  reportStatus.textContent = "Creating your report...";
  const canvas = createReportImage();
  canvas.toBlob(async (blob) => {
    if (!blob) {
      reportStatus.textContent = "The report could not be created. Please try again.";
      reportButton.disabled = false;
      return;
    }
    reportBlob = blob;
    if (reportObjectUrl) URL.revokeObjectURL(reportObjectUrl);
    reportObjectUrl = URL.createObjectURL(blob);
    reportImage.src = reportObjectUrl;
    downloadReportLink.href = reportObjectUrl;
    reportResult.hidden = false;
    await copyReportImage();
    reportButton.disabled = false;
  }, "image/png");
});

copyReportButton.addEventListener("click", copyReportImage);

function resetSession() {
  localStorage.removeItem("session-check-in");
  state.checks = [false, false, false];
  state.session = "";
  state.sessionChoiceInitialized = true;
  state.moods = { arrival: [], trade1: [], trade2: [], after: [] };
  state.trades = {};
  state.activeTrade = "";
  state.setupRating = "";
  state.sessionStarted = false;
  state.sessionCompleted = false;
  state.takingBreak = false;
  state.breakSuggestion = "";
  state.note = "";
  render();
}

resetButtons.forEach((button) => button.addEventListener("click", resetSession));

createMoodButtons();
attachMoodListeners();
render();