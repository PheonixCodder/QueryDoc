"use client";

import React, { useEffect, useState, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import {
  useChat,
  type UIMessage,
} from "@ai-sdk/react";
import { DefaultChatTransport, type TextUIPart } from "ai";

type Props = { chatId: number };

const ChatComponent = ({ chatId }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");

  // Fetch initial messages
  const { data, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<UIMessage[]>("/api/get-messages", { chatId });
      return response.data;
    },
  });

  // AI Chat hook
  const { messages, setMessages, sendMessage, status } = useChat<UIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: msg }) => ({
        body: {
          chatId,
          messages: msg.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.parts
              .filter((p): p is TextUIPart => p.type === "text")
              .map((p) => p.text)
              .join(""),
          })),
        },
      }),
    }),
    id: String(chatId),
    onData: (dataPart) => {
      if (dataPart.type === "data-message") {
        const incoming = dataPart.data as UIMessage;

        if (incoming.role === "assistant") {
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === incoming.id);
            if (exists) {
              return prev.map((m) =>
                m.id === incoming.id ? { ...m, parts: incoming.parts } : m
              );
            }
            return [...prev, incoming];
          });
        }
      }
    },
  });

  // Load initial messages
  useEffect(() => {
    if (data) setMessages(data);
  }, [data, setMessages]);

  // Smooth scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const maxScrollTop = scrollHeight - clientHeight;

    if (container.scrollTop >= maxScrollTop - 100) {
      container.scrollTo({ top: scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || status !== "ready") return;

    // Send a proper TextUIPart
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: trimmed }] as TextUIPart[],
    });

    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 inset-x-0 p-4 bg-white shadow">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        id="message-container"
        className="flex-1 overflow-y-auto p-2"
      >
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 inset-x-0 p-6 bg-white flex items-center border-t"
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any question..."
          className="flex-1"
        />
        <Button type="submit" disabled={status !== "ready"} className="bg-blue-600 ml-2">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatComponent;
