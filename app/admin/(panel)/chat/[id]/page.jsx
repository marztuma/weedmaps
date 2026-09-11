"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icons";

export default function ChatDetail() {
  const params = useParams();
  const id = params.id;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchConversation();

    const eventSource = new EventSource(`/api/chat/sse?conversationId=${id}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connected" || data.type === "heartbeat") return;
      fetchConversation();
    };

    eventSource.onerror = () => {
      eventSource.close();
      const interval = setInterval(fetchConversation, 3000);
      return () => clearInterval(interval);
    };

    return () => eventSource.close();
  }, [id]);

  async function fetchConversation() {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      const data = await res.json();
      if (data.success) {
        setConversation(data.conversation);
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplying(true);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText("");
        await fetchConversation();
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setReplying(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-600 mb-4">Conversation not found</p>
        <Link href="/admin/chat" className="text-blue-600 hover:text-blue-700">
          Back to conversations
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/chat" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center gap-1">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {conversation.contactEmail || `Visitor ${conversation.visitorKey.slice(0, 8)}`}
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Status: <span className="font-medium">{conversation.status}</span> • 
            Conversation started: {new Date(conversation.createdAt).toLocaleString()}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          conversation.status === 'needs_reply' ? 'bg-red-100 text-red-800' :
          conversation.status === 'answered' ? 'bg-green-100 text-green-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {conversation.status.replace('_', ' ')}
        </span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'visitor' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === 'visitor'
                      ? 'bg-blue-600 text-white'
                      : msg.role === 'staff'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.body}</p>
                  <p className={`text-xs mt-1 ${
                    msg.role === 'visitor' ? 'text-blue-100' : 'text-green-100'
                  }`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleReply} className="border-t border-gray-200 pt-6">
          <div className="flex gap-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
              rows="3"
            />
            <button
              type="submit"
              disabled={replying || !replyText.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-fit"
            >
              {replying ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
