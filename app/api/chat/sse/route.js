import { db, schema } from "@/db/client";
import { desc, eq } from "drizzle-orm";

const clients = new Set();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      clients.add({ controller, conversationId });

      sendUpdate({ type: "connected", message: "Connected to real-time updates" });

      const heartbeat = setInterval(() => {
        sendUpdate({ type: "heartbeat" });
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clients.delete({ controller, conversationId });
        controller.close();
      });
    },
  });

  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(request) {
  const { type, conversationId, data } = await request.json();

  const encoder = new TextEncoder();

  for (const client of clients) {
    if (!client.conversationId || client.conversationId === conversationId) {
      try {
        client.controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, data, conversationId })}\n\n`)
        );
      } catch (error) {
        clients.delete(client);
      }
    }
  }

  return Response.json({ success: true });
}
