'use client';

import { ChatBot } from './components/ChatBot';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1A2142] via-[#221C35] to-[#0F172A]">
      <ChatBot />
    </main>
  );
}
