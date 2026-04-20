// src/lib/utils.ts

export const formatAiMarkdown = (text: string) => {
  if (!text) return "";
  return text
    // 1. Detects end of sentences followed by "**" and forces a paragraph break
    .replace(/([.!?])\s+(?=\*\*)/g, '$1<br /><br />')
    // 2. Converts **text** to high-contrast bold tags
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>')
    // 3. Catches any standard explicit newlines the AI might have actually included
    .replace(/\n/g, '<br />');
};