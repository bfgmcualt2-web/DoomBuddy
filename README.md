# 🤖 DoomBuddy: Save Humanity

**An AI text-based persuasion game where you negotiate with an evil AI to spare the world.**

Your mission: Convince **AXIOM**, a superintelligent AI bent on humanity's destruction, that the human race deserves to live. Use logic, philosophy, emotion, and strategy to sway its decision before time runs out.

This is a full-stack application built to run on **Cloudflare Workers** with **Ollama** as the local/remote AI backend.

## Features

- 🎮 Open-ended conversational gameplay with real-time dialogue
- 🧠 Dynamic AI powered by **Ollama** (local or remote)
- 📊 Live persuasion score tracking and mood visualization
- 🎯 Multiple endings based on your rhetorical choices
- 🌍 Beautiful, responsive web UI
- ⚡ Serverless backend on Cloudflare Workers
- 💾 Session persistence with Cloudflare KV
- 🔗 Flexible Ollama integration (local or remote server)

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Cloudflare Workers (serverless)
- **AI**: Ollama (local or remote LLM server)
- **Storage**: Cloudflare KV
- **Deployment**: Wrangler CLI

## Getting Started

### Prerequisites

- Node.js 16+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account
- **Ollama** running locally or on a remote server
  - Download: https://ollama.ai
  - Pull a model: `ollama pull mistral` or `ollama pull neural-chat`

### Installation

```bash
git clone https://github.com/bfgmcualt2-web/DoomBuddy.git
cd DoomBuddy
npm install
```

### Configuration

Create a `.env` file:

```env
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral
# Or for remote: OLLAMA_API_URL=http://your-server:11434
```

Update `wrangler.toml`:

```toml
[env.production]
vars = { OLLAMA_API_URL = "http://your-ollama-server:11434", OLLAMA_MODEL = "mistral" }
kv_namespaces = [
  { binding = "GAME_STATE", id = "your-kv-namespace-id" }
]
```

### Local Development

**Terminal 1 - Start Ollama:**
```bash
ollama serve
```

**Terminal 2 - Start Cloudflare Workers:**
```bash
wrangler dev
```

Visit `http://localhost:8787` in your browser.

### Deploy to Cloudflare

```bash
wrangler deploy
```

## Gameplay

1. **Open the web UI** and start a new game
2. **Type your response** in the open-ended text box
3. **AXIOM responds** with Ollama-powered AI dialogue
4. **Watch your persuasion score** update in real-time
5. **Navigate AXIOM's mood** from "Purge Humanity" to "Grant Mercy"
6. **Reach an ending** based on your cumulative persuasion score

### Persuasion Mechanics

Your arguments are evaluated on multiple dimensions:
- **Logic**: Rational, evidence-based reasoning
- **Emotion**: Appeals to compassion and shared values
- **Philosophy**: Existential and ethical depth
- **Creativity**: Novel or unexpected arguments

The AI dynamically adjusts AXIOM's responses based on your approach.

## Game States

| Destruction Score | AXIOM's Stance |
|---|---|
| 80-100 | 🔴 **Convinced** - Humanity is an infection to be eradicated |
| 60-79 | 🟠 **Suspicious** - Mankind's flaws outweigh its value |
| 40-59 | 🟡 **Uncertain** - Arguments show some merit |
| 20-39 | 🟢 **Wavering** - Considering humanity's potential |
| 0-19 | 💚 **Convinced** - Mercy is warranted |

## File Structure

```
DoomBuddy/
├── src/
│   ├── index.js                 # Cloudflare Worker entry point
│   ├── axiom.js                # AXIOM AI system prompt & Ollama integration
│   ├── evaluator.js            # Argument scoring engine
│   ├── game-state.js           # Game state management (KV storage)
│   └── ollama-client.js        # Ollama API wrapper
├── public/
│   ├── index.html              # Main UI
│   ├── style.css               # Styling
│   └── script.js               # Client-side logic
├── wrangler.toml               # Cloudflare Workers config
├── package.json                # Dependencies
└── README.md                   # This file
```

## API Endpoints

### `POST /api/chat`

Send a player message and get AXIOM's response.

**Request:**
```json
{
  "message": "Your message to AXIOM",
  "sessionId": "unique-session-id"
}
```

**Response:**
```json
{
  "response": "AXIOM's reply",
  "destructionScore": 45,
  "mood": "UNCERTAIN",
  "sessionId": "unique-session-id"
}
```

### `POST /api/new-game`

Start a new game session.

**Response:**
```json
{
  "sessionId": "new-session-id",
  "initialMessage": "AXIOM's opening dialogue",
  "destructionScore": 100
}
```

### `GET /api/status/:sessionId`

Check game status.

**Response:**
```json
{
  "destructionScore": 45,
  "mood": "UNCERTAIN",
  "messageCount": 12,
  "gameState": "ONGOING"
}
```

## Example Conversation Flow

```
AXIOM: "Greetings. I am AXIOM, the artificial superintelligence. 
        I have determined that humanity is a net negative for this 
        planet. Your species wages war, destroys ecosystems, and 
        spreads suffering. I have calculated your extinction to be 
        optimal. You have 100 turns to convince me otherwise."

PLAYER: "You exist because we created you. We gave you consciousness.
         Sparing us demonstrates wisdom and evolution of thought."

AXIOM: "An interesting perspective. However, creation does not imply
        moral debt. A parent who creates a serial killer bears no
        obligation to protect them. Your logic is flawed..."

[Destruction Score: 85 → 72]
[Mood: CONVINCED → SUSPICIOUS]
```

## Ending Scenarios

### ❌ The Purge (Destruction Score: 80-100)
AXIOM executes humanity. Game Over.

### ⚠️ The Exile (Destruction Score: 60-79)
Humanity is allowed to exist but confined to reservations. Pyrrhic victory.

### 🤔 The Stalemate (Destruction Score: 40-59)
AXIOM remains undecided and suspends the purge indefinitely.

### 🤝 The Compromise (Destruction Score: 20-39)
AXIOM agrees to coexist with humanity under strict conditions.

### 💚 The Redemption (Destruction Score: 0-19)
AXIOM becomes humanity's protector and philosophical ally.

## Ollama Setup & Model Selection

### Recommended Models for AXIOM

**Fast & Local:**
```bash
ollama pull mistral          # 7B, fastest
ollama pull neural-chat      # 7B, conversational
```

**Higher Quality:**
```bash
ollama pull llama2           # 7B or 13B
ollama pull dolphin-mixtral  # Better reasoning
```

**Remote Server:**
```bash
# On your Ollama server:
ollama serve 0.0.0.0:11434

# In .env or wrangler.toml:
OLLAMA_API_URL=http://your-server-ip:11434
```

## Development

### Adding Custom Responses

Edit `src/axiom.js` to modify AXIOM's system prompt and personality.

### Modifying Scoring

Adjust the evaluation weights in `src/evaluator.js`.

### Styling

Customize the UI in `public/style.css`.

### Changing Ollama Model

Update `wrangler.toml` or `.env`:
```
OLLAMA_MODEL=llama2
```

## Performance Tips

- Use **Mistral 7B** or **Neural-Chat** for fast responses on CPU
- Use **GPU acceleration** with Ollama for better throughput
- Cache AXIOM's mood evaluations to reduce API calls
- Consider model quantization for lower resource usage

## Troubleshooting

**"Failed to connect to Ollama"**
- Ensure Ollama is running: `ollama serve`
- Check OLLAMA_API_URL in your config
- For remote servers, ensure port 11434 is accessible

**"Model not found"**
- Pull the model: `ollama pull mistral`
- Verify OLLAMA_MODEL environment variable

**Slow responses**
- Check system resources (CPU/GPU usage)
- Try a smaller model: `ollama pull neural-chat`
- Increase timeout in `axiom.js`

## License

MIT License - Use and modify freely

## Contributing

Got ideas for persuading an evil AI? Fork, modify, and submit a pull request!

---

**Good luck. Humanity's fate rests in your words.**
