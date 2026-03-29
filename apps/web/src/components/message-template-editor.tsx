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
  DEFAULT_MESSAGE_TEMPLATE_SETTINGS,
  extractMessageTemplateVariableKeys,
  getMessageTemplateVariable,
  getMessageTemplateVariablesForSection,
  MESSAGE_TEMPLATE_PRESETS,
  MESSAGE_TEMPLATE_SECTIONS,
  renderMessageTemplatePreview,
  type MessageTemplateSettings,
  type MessageTemplateVariable,
} from "@/lib/message-template";
import { ShotgunVariableNode } from "@/lib/shotgun-variable-node";
import { cn } from "@/lib/utils";

const VARIABLE_DRAG_MIME = "application/x-shotgun-variable";

export type PreviewChannel = "whatsapp" | "telegram" | "messenger" | "discord";
type PreviewMode = "bot" | "group";

const PREVIEW_CHANNELS: { key: PreviewChannel; label: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; hidden?: boolean }[] = [
  { key: "whatsapp", label: "WhatsApp", color: "#25d366", icon: WhatsAppIcon, hidden: true },
  { key: "telegram", label: "Telegram", color: "#2AABEE", icon: TelegramIcon },
  { key: "messenger", label: "Messenger", color: "#0084ff", icon: MessengerIcon, hidden: true },
  { key: "discord", label: "Discord", color: "#5865F2", icon: DiscordIcon, hidden: true },
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
  settings: MessageTemplateSettings;
  value: JSONContent;
  onChange: (content: JSONContent) => void;
  onSettingsChange: (settings: MessageTemplateSettings) => void;
}

export function MessageTemplateEditor({
  activePreview,
  settings = DEFAULT_MESSAGE_TEMPLATE_SETTINGS,
  value,
  onChange,
  onSettingsChange,
}: MessageTemplateEditorProps) {
  const [localPreview, setLocalPreview] = useState<PreviewChannel>(activePreview);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("group");
  const serializedValue = useMemo(() => JSON.stringify(value), [value]);
  const hasEventNameVariable = useMemo(
    () => extractMessageTemplateVariableKeys(value).includes("event_name"),
    [value]
  );
  const previewMessage = useMemo(
    () => renderMessageTemplatePreview(value),
    [value]
  );
  const presetOptions = useMemo(
    () =>
      MESSAGE_TEMPLATE_PRESETS.map((preset) => ({
        ...preset,
        isActive: JSON.stringify(preset.content) === serializedValue,
      })),
    [serializedValue]
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
            "sg-template-editor min-h-[10rem] cursor-text rounded-2xl border border-border/80 bg-background/80 py-3 pl-4 pr-24 text-sm leading-7 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-colors [&_p]:min-h-[1.5rem] [&_p+p]:mt-3",
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

  function toggleEventNameRule() {
    onSettingsChange({
      ...settings,
      showEventNameOnlyWhenMultipleEvents:
        !settings.showEventNameOnlyWhenMultipleEvents,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[28px] border border-border/80 p-4">
        <div className="border-b border-border/70 pb-3">
          <Label>Message</Label>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">Modele</span>
          <div className="flex gap-1.5">
            {presetOptions.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.content)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                  preset.isActive
                    ? "border-foreground/30 bg-foreground text-background shadow-sm"
                    : "border-border/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-3 right-3 z-10 rounded-full border-border/70 bg-background/90 hover:bg-muted/60"
            onClick={() => applyPreset({ type: "doc", content: [] })}
          >
            Vider
          </Button>

          <div
            onDragOver={handleEditorDragOver}
            onDropCapture={handleEditorDrop}
          >
            {editor ? <EditorContent editor={editor} /> : null}
          </div>
        </div>

        {hasEventNameVariable ? (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/50 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm leading-5 text-foreground/90">
                Afficher le nom de l&apos;event seulement s&apos;il y a au moins 2 events prevus
              </p>
              <button
                type="button"
                aria-pressed={settings.showEventNameOnlyWhenMultipleEvents}
                aria-label="Afficher le nom de l'event seulement s'il y a au moins 2 events prevus"
                onClick={toggleEventNameRule}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
                  settings.showEventNameOnlyWhenMultipleEvents
                    ? "border-foreground/10 bg-foreground"
                    : "border-border/80 bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 rounded-full bg-background shadow-sm transition-transform",
                    settings.showEventNameOnlyWhenMultipleEvents
                      ? "translate-x-6"
                      : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 border-t border-border/70 pt-4">
          <p className="text-xs text-foreground">
            Cliquez sur une info pour l&apos;ajouter<span className="hidden lg:inline">, ou glissez-la directement dans le message</span>.
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
        {/* Channel preview selector — hidden when only one channel visible */}
        {PREVIEW_CHANNELS.filter((ch) => !ch.hidden).length > 1 && (
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 p-1">
            {PREVIEW_CHANNELS.filter((ch) => !ch.hidden).map((channel) => {
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
        )}

        {/* Bot/group mode toggle — hidden when only one channel visible */}
        {PREVIEW_CHANNELS.filter((ch) => !ch.hidden).length > 1 && (
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
        )}

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
