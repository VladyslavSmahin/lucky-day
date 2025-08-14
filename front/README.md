# 🧠 React Chat App with Voice & Text (n8n + ElevenLabs)

## 📦 Tech Stack

- **React**
- **n8n** (Webhook-based backend)
- **ElevenLabs API** (Text-to-Speech)
- **Web Audio API** (voice recording in browser)

---

## 🚀 Quick Start

### Install dependencies

```
\front>
npm install
npm run dev
```

```


// This is the endpoint where we send messages to our AI via n8n.
// The AI processes the input and responds with a reply (text and optional speech).
const N8N_WEBHOOK_URL = 'https://t3d-projects.app.n8n.cloud/webhook/incoming-message';

// These are the endpoints where we send messages to receive alarm-msg and motivational-msg  text.
const N8N_WEBHOOK_URL_ALARM = 'https://t3d-projects.app.n8n.cloud/webhook/incoming-data-alarm';
const N8N_WEBHOOK_URL_MOTIVATION = 'https://t3d-projects.app.n8n.cloud/webhook/incoming-data-motivation';

// API key for ElevenLabs TTS
const ELEVENLABS_API_KEY = 'sk_2c7d605a06bef08acd46a55d5c14115c2480ae68c470c374';

// ElevenLabs custom voice ID
const ELEVENLABS_VOICE_ID = 'TERu3lB0KuECqdPTHehh';

// The endpoint where we send a request for TTS 
https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}
```

## 💡 Features

### 1. Username input

The app prompts the user to enter a username on first load. This username is sent along with messages as `userId`.

---

### 2. Text messages

- Sent via `POST` to your n8n webhook:

```json
{
  "type": "text",
  "message": "Hi there!",
  "userId": "Vlad"
}
```
The response format:

```json
[
  {
    "output": "Bot's text reply",
    "speech": "Alternative voice text (optional)"
  }
]
```
Inputs id
```
 inputTOV  - set the tone of voice for chatting. we enter it once, but we transmit it every time,
  we can replace it with a new value
  
  inputDailyInfo - answers from the daily quiz will shape the user's preferences. 
 The data changes every day and will be updated automatically

  msgInput - user's message
  
  alarm-input - accepts a request for an audio file for the alarm
  
  motivation-input - accepts request for motivational audio
```