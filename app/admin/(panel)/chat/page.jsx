"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icons";

export default function ChatDashboard() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();

    const eventSource = new EventSource("/api/chat/sse");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connected" || data.type === "heartbeat") return;
      fetchConversations();
    };

    eventSource.onerror = () => {
      eventSource.close();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    };

    return () => eventSource.close();
  }, []);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {conversations.length}
            </span>
          </div>

          <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
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
                <Link
                  key={conv.id}
                  href={`/admin/chat/${conv.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
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
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
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
      </div>
    </div>
  );
}
