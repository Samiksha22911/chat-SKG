# chat-SKG — Study + Knowledge = Glory

A simple ChatGPT-style study chatbot built with plain HTML, CSS and JavaScript, powered by Google's Gemini API.

## Features
- Chat with conversation memory (follow-up questions work)
- Press **Enter** or click Send; typing indicator while waiting
- Basic formatting: code blocks, `inline code`, **bold**, *italic*
- Clear error messages (bad key, quota, blocked content)
- "New chat" button, responsive layout for phones
- Choose the Gemini model in Settings

## Run it
1. Get a free API key at <https://aistudio.google.com/apikey>.
2. Open `index.html` in a browser (or serve the folder: `python3 -m http.server`).
3. Click ⚙ Settings, paste your key and Save. The key is stored only in your browser (localStorage).

> Never put an API key in the source code or commit it to GitHub. The key that was previously in `app.js`
> was public — **revoke it** in Google AI Studio.
