'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

interface BlockEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt('이미지 URL을 입력하세요:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="border-b border-border p-2 flex flex-wrap gap-2 sticky top-0 bg-background z-10">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-muted font-bold' : 'hover:bg-muted/50'}`}
            >
                Bold
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-muted italic' : 'hover:bg-muted/50'}`}
            >
                Italic
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`px-2 py-1 rounded ${editor.isActive('strike') ? 'bg-muted line-through' : 'hover:bg-muted/50'}`}
            >
                Strike
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                className={`px-2 py-1 rounded ${editor.isActive('code') ? 'bg-muted font-mono' : 'hover:bg-muted/50'}`}
            >
                Code
            </button>
            <button
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={`px-2 py-1 rounded ${editor.isActive('paragraph') ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
                P
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-muted font-bold' : 'hover:bg-muted/50'}`}
            >
                H1
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-muted font-bold' : 'hover:bg-muted/50'}`}
            >
                H2
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
                Bullet
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
                Ordered
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`px-2 py-1 rounded ${editor.isActive('codeBlock') ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
                CodeBlock
            </button>
            <button
                onClick={addImage}
                className="px-2 py-1 rounded hover:bg-muted/50"
            >
                Image
            </button>
        </div>
    );
};

export default function BlockEditor({ content, onChange, editable = true }: BlockEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 text-foreground',
            },
        },
    });

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-background">
            {editable && <MenuBar editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );
}
