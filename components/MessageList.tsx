import { cn } from "@/lib/utils";
import { UIMessage } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";
import React from "react";
import { TextUIPart } from "ai";

type Props = {
  isLoading: boolean;
  messages: UIMessage[];
};

const MessageList = ({ messages, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!messages?.length) return <></>;

  return (
    <div className="flex flex-col gap-2 px-4">
      {messages.map((message) => {
        // Extract only text parts safely
        const textContent = message.parts
          ?.filter((p): p is TextUIPart => p.type === "text")
          .map((p) => p.text)
          .join("") || "";

        return (
          <div
            key={message.id}
            className={cn("flex", {
              "justify-end pl-10": message.role === "user",
              "justify-start pr-10": message.role === "assistant",
            })}
          >
            <div
              className={cn(
                "rounded-lg px-3 text-sm py-1 shadow-md ring-1 ring-gray-900/10 break-words",
                {
                  "bg-blue-600 text-white": message.role === "user",
                  "bg-gray-100 text-black": message.role === "assistant",
                }
              )}
            >
              <p>{textContent || <i>Streaming...</i>}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
