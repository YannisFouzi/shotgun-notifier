-- Libellé Telegram pour l’UI (titre + type), en plus du chat_id

ALTER TABLE organizers ADD COLUMN telegram_chat_title TEXT NOT NULL DEFAULT '';
ALTER TABLE organizers ADD COLUMN telegram_chat_type TEXT NOT NULL DEFAULT '';
