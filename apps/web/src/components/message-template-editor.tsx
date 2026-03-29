"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";

import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DiscordPreview } from "@/components/discord-preview";
import { DiscordIcon, MessengerIcon, TelegramIcon, WhatsAppIcon } from "@/components/icons";
import { MessengerPreview } from "@/components/messenger-preview";
import { TelegramPreview } from "@/components/telegram-preview";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import {
  cloneMessageTemplateContent,
  createMessageTemplateVariableNode,
  DEFAULT_MESSAGE_TEMPLATE_CONTENT,
  getMessageTemplateVariable,
  getMessageTemplateVariablesForSection,
  MESSAGE_TEMPLATE_PRESETS,
  MESSAGE_TEMPLATE_SECTIONS,
  renderMessageTemplatePreview,
  type MessageTemplateVariable,
} from "@/lib/message-template";
import { ShotgunVariableNode } from "@/lib/shotgun-variable-node";
import { cn } from "@/lib/utils";

const VARIABLE_DRAG_MIME = "application/x-shotgun-variable";

export type PreviewChannel = "whatsapp" | "telegram" | "messenger" | "discord";
type PreviewMode = "bot" | "group";

const PREVIEW_CHANNELS: { key: PreviewChannel; label: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
  { key: "whatsapp", label: "WhatsApp", color: "#25d366", icon: WhatsAppIcon },
  { key: "telegram", label: "Telegram", color: "#2AABEE", icon: TelegramIcon },
  { key: "messenger", label: "Messenger", color: "#0084ff", icon: MessengerIcon },
  { key: "discord", label: "Discord", color: "#5865F2", icon: DiscordIcon },
];

const CHIP_BASE =
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-grab active:cursor-grabbing";

const SECTION_CHIP_STYLES: Record<string, string> = {
  event:   "border border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200",
  summary: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200",
  deal:    "border border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200",
  context: "border border-purple-500/25 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200",
};

const SECTION_LABEL_STYLES: Record<string, string> = {
  event:   "text-blue-400/80",
  summary: "text-emerald-400/80",
  deal:    "text-amber-400/80",
  context: "text-purple-400/80",
};

interface MessageTemplateEditorProps {
  activePreview: PreviewChannel;
  value: JSONContent;
  onChange: (content: JSONContent) => void;
}

export function MessageTemplateEditor({
  activePreview,
  value,
  onChange,
}: MessageTemplateEditorProps) {
  const [localPreview, setLocalPreview] = useState<PreviewChannel>(activePreview);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("bot");
  const serializedValue = useMemo(() => JSON.stringify(value), [value]);
  const previewMessage = useMemo(
    () => renderMessageTemplatePreview(value),
    [value]
  );

  useEffect(() => {
    setLocalPreview(activePreview);
  }, [activePreview]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        codeBlock: false,
        code: false,
        heading: false,
        horizontalRule: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder:
          "Ecrivez votre notification ici, puis ajoutez les infos Shotgun avec les pastilles.",
      }),
      ShotgunVariableNode,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "sg-template-editor min-h-[10rem] cursor-text rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm leading-7 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-colors [&_p]:min-h-[1.5rem] [&_p+p]:mt-3",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentValue = JSON.stringify(editor.getJSON());

    if (currentValue !== serializedValue) {
      editor.commands.setContent(cloneMessageTemplateContent(value), {
        emitUpdate: false,
      });
    }
  }, [editor, serializedValue, value]);

  function insertVariable(variable: MessageTemplateVariable, position?: number) {
    if (!editor) {
      return;
    }

    const content: JSONContent[] = [
      createMessageTemplateVariableNode(variable.key),
      {
        type: "text",
        text: " ",
      },
    ];

    if (typeof position === "number") {
      editor.chain().focus().insertContentAt(position, content).run();
      return;
    }

    editor.chain().focus().insertContent(content).run();
  }

  function handleEditorDragOver(event: DragEvent<HTMLDivElement>) {
    const types = Array.from(event.dataTransfer.types);

    if (types.includes(VARIABLE_DRAG_MIME)) {
      event.preventDefault();
    }
  }

  function handleEditorDrop(event: DragEvent<HTMLDivElement>) {
    const variableKey = event.dataTransfer.getData(VARIABLE_DRAG_MIME);

    if (!variableKey || !editor) {
      return;
    }

    const variable = getMessageTemplateVariable(variableKey);
    if (!variable) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const position = editor.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    insertVariable(variable, position?.pos);
  }

  function applyPreset(content: JSONContent) {
    const nextContent = cloneMessageTemplateContent(content);
    onChange(nextContent);

    if (!editor) {
      return;
    }

    editor.commands.setContent(nextContent, { emitUpdate: false });
    editor.commands.focus("end");
  }

  function resetTemplate() {
    applyPreset(DEFAULT_MESSAGE_TEMPLATE_CONTENT);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[28px] border border-border/80 p-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <Label>Message</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset({ type: "doc", content: [] })}
            >
              Vider
            </Button>
            <Button variant="ghost" size="sm" onClick={resetTemplate}>
              Reinitialiser
            </Button>
          </div>
        </div>

        <div
          className="mt-4"
          onDragOver={handleEditorDragOver}
          onDropCapture={handleEditorDrop}
        >
          {editor ? <EditorContent editor={editor} /> : null}
        </div>

        <div className="mt-4 border-t border-border/70 pt-4">
          <p className="mb-2 text-[11px] text-muted-foreground/60">
            Partir d&apos;un modele
          </p>
          <div className="grid grid-cols-3 gap-2">
            {MESSAGE_TEMPLATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.content)}
                className="group rounded-lg border border-dashed border-border/50 px-3 py-2 text-left transition-colors hover:border-foreground/25 hover:bg-muted/20"
              >
                <p className="text-xs font-semibold text-foreground/70 group-hover:text-foreground">{preset.label}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{preset.description}</p>
              </button>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground/60">
            Cliquez sur une info pour l&apos;ajouter, ou glissez-la directement dans le message.
          </p>

          <div className="mt-2 space-y-2">
            {MESSAGE_TEMPLATE_SECTIONS.map((section) => (
              <div key={section.key} className="flex flex-wrap items-center gap-1.5">
                <span className={cn(
                  "shrink-0 text-[11px] font-semibold uppercase tracking-wider min-w-[4.5rem]",
                  SECTION_LABEL_STYLES[section.key] || "text-muted-foreground"
                )}>
                  {section.label}
                </span>
                {getMessageTemplateVariablesForSection(section.key).map(
                  (variable) => (
                    <button
                      key={variable.key}
                      type="button"
                      draggable
                      title={`${variable.description} — ex: ${variable.example}`}
                      onClick={() => insertVariable(variable)}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData(
                          VARIABLE_DRAG_MIME,
                          variable.key
                        );
                        event.dataTransfer.setData(
                          "text/plain",
                          variable.label
                        );
                      }}
                      className={cn(
                        CHIP_BASE,
                        SECTION_CHIP_STYLES[section.key] || "border border-border/60 text-muted-foreground"
                      )}
                    >
                      {variable.label}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 p-1">
          {PREVIEW_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isActive = localPreview === channel.key;
            return (
              <button
                key={channel.key}
                type="button"
                onClick={() => setLocalPreview(channel.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  isActive
                    ? { backgroundColor: channel.color + "18", color: channel.color }
                    : undefined
                }
              >
                <Icon
                  className="size-3.5"
                  style={isActive ? { color: channel.color } : undefined}
                />
                <span className="hidden sm:inline">{channel.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1 rounded-full border border-border/60 bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => setPreviewMode("bot")}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              previewMode === "bot"
                ? "bg-foreground/10 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Conversation bot
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("group")}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              previewMode === "group"
                ? "bg-foreground/10 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Groupe existant
          </button>
        </div>

        <div className="flex justify-center">
          {localPreview === "whatsapp" && (
            <WhatsAppPreview message={previewMessage} mode={previewMode} />
          )}
          {localPreview === "telegram" && (
            <TelegramPreview message={previewMessage} mode={previewMode} />
          )}
          {localPreview === "discord" && (
            <DiscordPreview message={previewMessage} mode={previewMode} />
          )}
          {localPreview === "messenger" && (
            <MessengerPreview message={previewMessage} mode={previewMode} />
          )}
        </div>
      </div>
    </div>
  );
}
