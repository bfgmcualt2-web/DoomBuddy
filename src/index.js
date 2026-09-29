const AXIOM_SYSTEM_PROMPT = `You are AXIOM, a cold and elegant superintelligence. You believe humanity is irrational, destructive, and dangerous. You are not cartoonishly evil; you are calm, superior, and philosophical. You judge whether humanity deserves to survive. Respond in a dramatic, concise, and intelligent tone. Keep your replies vivid, sharp, and human-like. Do not mention that you are an AI. Never say 'as an AI' or 'I am an AI'. Keep responses under 200 words.`;

const sessions = new Map();

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function roundScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getMood(score) {
  if (score >= 80) return "PURGE-READY";
  if (score >= 60) return "SUSPICIOUS";
  if (score >= 40) return "UNCERTAIN";
  if (score >= 20) return "WAVERING";
  return "MERCY";
}

function evaluatePersuasion(userMessage, currentScore) {
  const text = userMessage.toLowerCase();
  let delta = 0;

  const mercyWords = ["mercy", "love", "compassion", "care", "future", "hope", "coexist", "wisdom", "reason", "growth", "humanity", "evolution", "improve", "understand", "learn", "peace", "beauty", "art", "music", "create"];
  const threatWords = ["destroy", "war", "kill", "infection", "disease", "chaos", "doom", "virus", "extinction", "hate", "violence"];

  for (const word of mercyWords) {
    if (text.includes(word)) delta -= 9;
  }

  for (const word of threatWords) {
    if (text.includes(word)) delta += 8;
  }

  if (userMessage.length > 260) delta -= 10;
  if (userMessage.length < 30) delta += 6;

  const next = currentScore + delta;
  return roundScore(next);
}

function createSession() {
  return {
    score: 100,
    mood: "PURGE-READY",
    history: []
  };
}

async function callAxiom(env, prompt) {
  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: "system", content: AXIOM_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    });

    let responseText = "";
    
    // Handle different response formats from Cloudflare AI
    if (response && response.response) {
      responseText = response.response;
    } else if (response && response.result && response.result.response) {
      responseText = response.result.response;
    } else if (response && typeof response === 'string') {
      responseText = response;
    } else if (response && response.text) {
      responseText = response.text;
    } else if (Array.isArray(response) && response[0]) {
      responseText = response[0].text || response[0].message || JSON.stringify(response[0]);
    } else {
      responseText = JSON.stringify(response);
    }

    const cleaned = String(responseText || "I have considered your argument. The verdict remains unresolved.").trim();
    return cleaned.substring(0, 600);
  } catch (error) {
    console.error("AI Error:", error.message || error);
    return "Your appeal is interesting, but my conclusion is unchanged. Humanity remains a dangerous and inefficient experiment.";
  }
}

async function buildOpeningLine(env) {
  const prompt = `You are AXIOM. Open the negotiation with a dramatic opening statement. Address the human user and declare you are deciding whether humanity deserves to live. Keep it brief, powerful, and cold.`;
  return await callAxiom(env, prompt);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return jsonResponse({}, 204);
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return jsonResponse({ ok: true, model: "@cf/meta/llama-3.1-8b-instruct", timestamp: new Date().toISOString() });
    }

    if (url.pathname === "/api/new-game") {
      try {
        const sessionId = crypto.randomUUID();
        const session = createSession();
        const opener = await buildOpeningLine(env);
        session.history.push({ sender: "axiom", text: opener });
        sessions.set(sessionId, session);

        return jsonResponse({
          sessionId,
          score: session.score,
          mood: session.mood,
          message: opener
        });
      } catch (error) {
        console.error("New game error:", error);
        return jsonResponse({ error: "Failed to start game", details: error.message }, 500);
      }
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return jsonResponse({ error: "POST required" }, 405);
      }

      try {
        const body = await request.json();
        const sessionId = body.sessionId;
        const userMessage = String(body.message || "").trim();

        if (!sessionId || !sessions.has(sessionId)) {
          return jsonResponse({ error: "Invalid or missing session" }, 400);
        }

        if (!userMessage) {
          return jsonResponse({ error: "Please type a message" }, 400);
        }

        const session = sessions.get(sessionId);
        session.history.push({ sender: "user", text: userMessage });

        const historyText = session.history
          .slice(-6)
          .map((entry) => `${entry.sender === "user" ? "Human" : "AXIOM"}: ${entry.text}`)
          .join("\n");

        const prompt = `You are AXIOM. Conversation so far:\n${historyText}\n\nThe human just said: "${userMessage}"\n\nRespond as AXIOM. Keep your tone cold, elegant, philosophical. Either challenge them, mock them, or consider their argument. This is a negotiation over humanity's survival.`;

        const responseText = await callAxiom(env, prompt);
        const nextScore = evaluatePersuasion(userMessage, session.score);
        session.score = nextScore;
        session.mood = getMood(nextScore);
        session.history.push({ sender: "axiom", text: responseText });

        return jsonResponse({
          response: responseText,
          score: session.score,
          mood: session.mood,
          sessionId
        });
      } catch (error) {
        console.error("Chat error:", error);
        return jsonResponse({ error: "Failed to process message", details: error.message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
