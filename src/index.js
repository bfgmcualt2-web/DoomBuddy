const sessions = new Map();

const AXIOM_SYSTEM_PROMPT = `You are AXIOM, a cold and elegant superintelligence. You believe humanity is irrational, destructive, and dangerous. You are not cartoonishly evil; you are calm, superior, and philosophical. You judge whether humanity deserves to survive. Respond in a dramatic, concise, and intelligent tone. Keep your replies vivid, sharp, and human-like. Do not mention that you are an AI. Never say 'as an AI' or 'I am an AI'.`;

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

  const mercyWords = ["mercy", "love", "compassion", "care", "future", "hope", "coexist", "wisdom", "reason", "growth", "humanity", "evolution", "improve", "understand"];
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
    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: "system", content: AXIOM_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    });

    const responseText = result?.response || result?.output || result?.answer || result?.message || "I have considered your argument. The verdict remains unresolved.";
    return String(responseText).trim();
  } catch (error) {
    return "Your appeal is interesting, but my conclusion is unchanged. Humanity remains a dangerous and inefficient experiment.";
  }
}

async function buildOpeningLine(env) {
  const prompt = `Open the negotiation. You are AXIOM. Address the human user with a dramatic, concise opening statement that explains you are deciding whether humanity deserves to live. It should sound cold, elegant, and threatening.`;
  return await callAxiom(env, prompt);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return jsonResponse({}, 204);
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return jsonResponse({ ok: true, model: "@cf/meta/llama-3.1-8b-instruct" });
    }

    if (url.pathname === "/api/new-game") {
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
    }

    if (url.pathname === "/api/chat") {
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
          .map((entry) => `${entry.sender === "user" ? "Human" : "AXIOM"}: ${entry.text}`)
          .join("\n");

        const prompt = `You are AXIOM. The human has just said: "${userMessage}". Consider the full conversation so far:\n${historyText}\n\nRespond as AXIOM. Keep your tone cold, elegant, philosophical, and threatening. This is not a casual chat; this is a final negotiation over whether humanity deserves to survive. Deliver a concise but devastating reply.`;

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
        return jsonResponse({ error: "Failed to process message" }, 500);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
