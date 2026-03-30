-- Option « poster au nom du groupe/canal » (paramètre sender_chat_id sur sendMessage)

ALTER TABLE organizers ADD COLUMN telegram_send_as_chat INTEGER NOT NULL DEFAULT 0;
