import ChatComponent from "@/components/ChatComponent";
import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
// import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: {
    chatId: string;
  };
};

const ChatPage = async ({ params }: Props) => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  const chatID = (await params).chatId;

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  if (!_chats) {
    return redirect("/");
  }
  if (!_chats.find((chat) => chat.id === parseInt(chatID))) {
    return redirect("/");
  }

  const currentChat = _chats.find((chat) => chat.id === parseInt(chatID));

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Full height, no double scroll */}
      {/* chat sidebar */}
      <div className="flex-[2] max-w-xs h-full overflow-y-auto">
        <ChatSideBar chats={_chats} chatId={parseInt(chatID)} />
      </div>
      {/* pdf viewer */}
      <div className="flex-[5] p-4 h-full overflow-y-auto">
        <PDFViewer pdf_url={currentChat?.pdfUrl || ""} />
      </div>
      {/* chat component */}
      <div className="flex-[3] h-full border-l-4 border-l-slate-200 overflow-y-auto">
        <ChatComponent chatId={parseInt(chatID)} />
      </div>
    </div>
  );
};

export default ChatPage;
