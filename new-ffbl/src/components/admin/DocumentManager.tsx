// src/components/admin/DocumentManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { CldUploadWidget } from 'next-cloudinary';
import MediaLibraryModal from '../ui/MediaLibraryModal';
import { 
  FileText, Save, Loader2, Bold, Italic, Strikethrough, 
  Heading1, Heading2, List, ListOrdered, Quote, Undo, Redo, Image as ImageIcon, UploadCloud, Library 
} from "lucide-react";

export default function DocumentManager() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("new");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Initialize Tiptap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl border border-slate-200 shadow-sm max-w-full h-auto my-6',
        },
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-6 bg-white',
      },
    },
  });

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  // Handle switching documents
  useEffect(() => {
    if (selectedDocId === "new") {
      setTitle("");
      setSlug("");
      editor?.commands.setContent("");
    } else {
      const doc = documents.find(d => d.id === selectedDocId);
      if (doc) {
        setTitle(doc.title);
        setSlug(doc.slug);
        editor?.commands.setContent(doc.content);
      }
    }
  }, [selectedDocId, documents, editor]);

  // Auto-generate slug from title if creating new
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (selectedDocId === "new") {
      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  // Handle inserting an image manually via URL
  const addImageManual = () => {
    const url = window.prompt('Paste the image URL here:');
    if (url && editor) {
      editor.commands.setImage({ src: url });
    }
  };

  const handleLibrarySelect = (url: string) => {
    if (editor) {
      editor.commands.setImage({ src: url });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    setLoading(true);
    const content = editor.getHTML();
    const payload = { id: selectedDocId !== "new" ? selectedDocId : undefined, title, slug, content };
    const method = selectedDocId === "new" ? "POST" : "PATCH";

    try {
      const res = await fetch("/api/documents", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchDocuments();
        const savedDoc = await res.json();
        setSelectedDocId(savedDoc.id);
        router.refresh();
        alert("Document saved successfully!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save document.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title, className = "" }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'} ${className}`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FileText className="text-slate-400" size={20} />
          <select 
            className="flex-1 sm:w-64 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
          >
            <option value="new">— Create New Document —</option>
            {documents.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        <div className={`text-[10px] font-black px-3 py-1.5 rounded uppercase tracking-widest shadow-sm ${selectedDocId !== "new" ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
          {selectedDocId !== "new" ? 'Edit Mode' : 'Draft Mode'}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Document Title</label>
            <input type="text" required value={title} onChange={handleTitleChange} placeholder="e.g. Official FFBL Constitution" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">URL Slug</label>
            <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. constitution" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1">
            <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold')} icon={Bold} title="Bold" />
            <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic')} icon={Italic} title="Italic" />
            <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} isActive={editor?.isActive('strike')} icon={Strikethrough} title="Strikethrough" />
            
            <div className="w-px h-6 bg-slate-300 mx-1" />
            
            <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor?.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
            <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor?.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
            <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList')} icon={List} title="Bullet List" />
            <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={editor?.isActive('orderedList')} icon={ListOrdered} title="Numbered List" />
            <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive('blockquote')} icon={Quote} title="Quote" />
            
            <div className="w-px h-6 bg-slate-300 mx-1" />
            
            {/* NEW: FFBL Media Library Button */}
            <ToolbarButton onClick={() => setIsLibraryOpen(true)} isActive={false} icon={Library} title="Browse Media Library" className="text-blue-600 hover:bg-blue-100" />

            {/* Cloudinary Upload Widget */}
            <CldUploadWidget 
              uploadPreset="ffbl_uploads" 
              onSuccess={(result: any) => {
                if (result.event === "success" && result.info?.secure_url) {
                  editor?.commands.setImage({ src: result.info.secure_url });
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    open();
                  }}
                  className="p-2 rounded-lg transition-colors text-slate-500 hover:bg-slate-200"
                  title="Upload New Image"
                >
                  <UploadCloud size={16} />
                </button>
              )}
            </CldUploadWidget>

            {/* Manual URL Image Button */}
            <ToolbarButton onClick={addImageManual} isActive={false} icon={ImageIcon} title="Insert Image via URL" />
            
            <div className="w-px h-6 bg-slate-300 mx-1" />

            <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} isActive={false} icon={Undo} title="Undo" />
            <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} isActive={false} icon={Redo} title="Redo" />
          </div>
          
          {/* Editor Canvas */}
          <EditorContent editor={editor} />
        </div>

        <button 
          type="submit" disabled={loading || !title}
          className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {loading ? "Saving Document..." : "Save to Archives"}
        </button>
      </form>

      <MediaLibraryModal 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
        onSelect={handleLibrarySelect} 
      />
    </div>
  );
}