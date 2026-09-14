const typingState = new Map();

export async function POST(req) {
  try {
    const { conversationId, role, isTyping } = await req.json();

    if (!conversationId || !role) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const key = `${conversationId}:${role}`;

    if (isTyping) {
      typingState.set(key, { role, timestamp: Date.now() });
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
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return Response.json({ success: false, error: "Missing conversationId" }, { status: 400 });
    }

    const now = Date.now();
    const typingUsers = [];

    for (const [key, state] of typingState.entries()) {
      const [convId, role] = key.split(":");
      if (convId === conversationId && now - state.timestamp < 3000) {
        typingUsers.push({ role });
      }
    }

    return Response.json({ success: true, typing: typingUsers });
  } catch (error) {
    console.error("Error fetching typing state:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
