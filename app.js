// SKG – a simple ChatGPT-style chatbot using the Gemini API.
// The API key is NOT stored in the code: each user adds their own in Settings.

const $ = (s) => document.querySelector(s);
const hero = $("#hero");
const chat = $("#chat");
const form = $("#form");
const promptEl = $("#prompt");
const sendBtn = $("#send");
const dialog = $("#settings");

const store = {
  get(k, d = "") { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let history = []; // [{role: "user"|"model", parts: [{text}]}]
let busy = false;

const SYSTEM_PROMPT =
  "You are SKG (Study + Knowledge = Glory), a friendly study helper. Explain clearly and simply, " +
  "use short examples, and be accurate. Use **bold** for key terms and ``` fenced blocks for code.";

const AVATARS = {
  user: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z"/></svg>`,
  ai: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>`,
};

// ---------- rendering ----------
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Small, safe markdown subset: code blocks, inline code, bold, italics.
function renderMarkdown(text) {
  const parts = escapeHtml(text).split(/```(?:\w*\n)?/);
  return parts
    .map((chunk, i) =>
      i % 2
        ? `<pre><code>${chunk.replace(/\n$/, "")}</code></pre>`
        : chunk
            .replace(/`([^`\n]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
            .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    )
    .join("");
}

function addMessage(kind, text) {
  hero.style.display = "none";
  const box = document.createElement("div");
  box.className = kind === "user" ? "user-chat-box" : "ai-chat-box";
  box.innerHTML = `<div class="avatar">${AVATARS[kind === "user" ? "user" : "ai"]}</div><div class="text"></div>`;
  const t = box.querySelector(".text");
  if (kind === "user") t.textContent = text;
  else t.innerHTML = renderMarkdown(text);
  chat.appendChild(box);
  scrollDown();
  return t;
}

function scrollDown() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function setBusy(b) {
  busy = b;
  sendBtn.disabled = b;
  promptEl.disabled = b;
  if (!b) promptEl.focus();
}

// ---------- API ----------
async function askGemini() {
  const key = store.get("skg_key");
  const model = store.get("skg_model", "gemini-2.5-flash");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: history,
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Request failed (${res.status})`);
  const cand = data.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p.text || "").join("");
  if (!text) {
    throw new Error(data.promptFeedback?.blockReason
      ? `The request was blocked (${data.promptFeedback.blockReason}).`
      : "The model returned an empty answer. Try rephrasing.");
  }
  return text;
}

async function send(message) {
  if (!store.get("skg_key")) {
    openSettings();
    return;
  }
  addMessage("user", message);
  history.push({ role: "user", parts: [{ text: message }] });

  const aiText = addMessage("ai", "");
  aiText.innerHTML = `<span class="dots"><i></i><i></i><i></i></span>`;
  setBusy(true);
  try {
    const answer = await askGemini();
    history.push({ role: "model", parts: [{ text: answer }] });
    aiText.innerHTML = renderMarkdown(answer);
  } catch (e) {
    history.pop(); // drop the unanswered question so the history stays valid
    aiText.parentElement.classList.add("error");
    aiText.textContent = "⚠ " + e.message;
  } finally {
    setBusy(false);
    scrollDown();
  }
}

// ---------- events ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = promptEl.value.trim();
  if (!msg || busy) return;
  promptEl.value = "";
  send(msg);
});

$("#newChat").addEventListener("click", () => {
  history = [];
  chat.innerHTML = "";
  hero.style.display = "";
  promptEl.focus();
});

function openSettings() {
  $("#keyInput").value = store.get("skg_key");
  $("#modelSelect").value = store.get("skg_model", "gemini-2.5-flash");
  dialog.showModal();
}
$("#settingsBtn").addEventListener("click", openSettings);
$("#settingsForm").addEventListener("submit", (e) => {
  if (e.submitter?.value === "save") {
    store.set("skg_key", $("#keyInput").value.trim());
    store.set("skg_model", $("#modelSelect").value);
  }
});

if (!store.get("skg_key")) setTimeout(openSettings, 400);
