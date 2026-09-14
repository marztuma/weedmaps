"use client";

import { useEffect, useState, useRef } from "react";
import Icon from "@/components/Icons";

export default function ChatDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [typing, setTyping] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();

    const eventSource = new EventSource("/api/chat/sse");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connected" || data.type === "heartbeat") return;
      fetchConversations();
      if (selectedId) fetchConversationDetail(selectedId);
    };

    eventSource.onerror = () => {
      eventSource.close();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    };

    return () => eventSource.close();
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      fetchConversationDetail(selectedId);
      const interval = setInterval(() => fetchConversationDetail(selectedId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      const fetchTyping = async () => {
        try {
          const res = await fetch(`/api/chat/typing?conversationId=${selectedId}`);
          const data = await res.json();
          if (data.success) setTyping(data.typing || []);
        } catch (error) {
          console.error("Error fetching typing state:", error);
        }
      };
      fetchTyping();
      const interval = setInterval(fetchTyping, 300);
      return () => clearInterval(interval);
    }
  }, [selectedId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchConversationDetail(convId) {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConv(data.conversation);
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !selectedId) return;

    setReplying(true);
    try {
      await fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: String(selectedId), role: "staff", isTyping: false }),
      }).catch(() => {});

      const res = await fetch(`/api/chat/conversations/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText("");
        await fetchConversationDetail(selectedId);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setReplying(false);
    }
  }

  const statusColors = {
    open: "bg-blue-100 text-blue-800",
    needs_reply: "bg-red-100 text-red-800",
    answered: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Live Support Chat</h1>
        <p className="mt-2 text-gray-600">Manage incoming customer messages in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {conversations.length}
            </span>
          </div>

          <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  When customers start chatting, they'll appear here
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 ${
                    selectedId === conv.id ? "border-l-blue-600 bg-gray-50" : "border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.contactEmail || `Visitor ${conv.visitorKey.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last message: {new Date(conv.lastMessageAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      statusColors[conv.status] || statusColors.open
                    }`}>
                      {conv.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="p-12 flex items-center justify-center flex-1">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <Icon name="messageCircle" size={24} className="text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
                <p className="text-gray-600 text-sm mt-2">
                  Click on a conversation from the list to view messages and reply
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedConv?.contactEmail || `Visitor ${selectedConv?.visitorKey.slice(0, 8)}`}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Status: <span className="font-medium">{selectedConv?.status}</span> •
                  Started: {selectedConv && new Date(selectedConv.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'visitor' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === 'visitor'
                          ? 'bg-blue-600 text-white'
                          : msg.role === 'staff'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
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

                {typing.length > 0 && typing.some(t => t.role === 'visitor') && (
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></span>
                    </div>
                    <span className="text-xs text-gray-500">Customer is typing…</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-200 p-4 flex-shrink-0">
                <form onSubmit={handleReply} className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      if (e.target.value.trim()) {
                        fetch("/api/chat/typing", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ conversationId: String(selectedId), role: "staff", isTyping: true }),
                        }).catch(() => {});
                      }
                    }}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                    rows="3"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-fit whitespace-nowrap"
                  >
                    {replying ? "Sending..." : "Send"}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
