const typingState = new Map();

// Cleanup interval for expired typing states
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of typingState.entries()) {
    if (now - state.timestamp > 5000) {
      typingState.delete(key);
    }
  }
}, 2000);

export async function POST(req) {
  try {
    const { conversationId, role, isTyping } = await req.json();

    if (!conversationId || !role) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const key = `${String(conversationId)}:${String(role)}`;

    if (isTyping) {
      typingState.set(key, { role: String(role), timestamp: Date.now() });
    } else {
      typingState.delete(key);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating typing state:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = String(searchParams.get("conversationId"));

    if (!conversationId || conversationId === "null") {
      return Response.json({ success: false, error: "Missing conversationId" }, { status: 400 });
    }

    const now = Date.now();
    const typingUsers = [];

    for (const [key, state] of typingState.entries()) {
      const [convId, role] = key.split(":");
      if (convId === conversationId && now - state.timestamp < 5000) {
        typingUsers.push({ role });
      }
    }

    return Response.json({ success: true, typing: typingUsers });
  } catch (error) {
    console.error("Error fetching typing state:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
