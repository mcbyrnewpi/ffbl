import { prisma } from "@/lib/prisma";
import { BookOpen } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "League Lore | FFBL",
  description: "The official rules and history of the Franklin Fantasy Baseball League.",
};

export const revalidate = 60; 

export default async function HistoryPage() {
  const doc = await prisma.leagueDocument.findUnique({
    where: { slug: "history" },
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

      {doc ? (
        <div 
          className="
            p-8 md:p-12 lg:p-16
            prose prose-slate prose-lg max-w-none 
            prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
            prose-h1:text-4xl prose-h1:mb-8
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b prose-h2:border-slate-100
            prose-p:leading-relaxed prose-p:text-slate-600 prose-p:mb-6
            prose-strong:font-bold prose-strong:text-slate-900
            prose-em:font-medium prose-em:text-slate-800
            prose-img:rounded-2xl prose-img:border prose-img:border-slate-200 prose-img:shadow-md prose-img:mx-auto prose-img:my-10
          "
          dangerouslySetInnerHTML={{ __html: doc.content }} 
        />
      ) : (
        <div className="p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
            <BookOpen size={24} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Archives Empty</h3>
          <p className="text-slate-500 font-medium mt-1">
            The Commissioner has not published the league history yet.
          </p>
        </div>
      )}
    </div>
  );
}