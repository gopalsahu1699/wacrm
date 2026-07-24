-- ============================================================
-- Migration 037: New message notifications for inbox received messages
-- ============================================================

-- 1. Widen type check constraint to include 'new_message'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('conversation_assigned', 'new_message'));

-- 2. Trigger function to create a notification when a new customer message arrives
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_contact_id UUID;
  v_assigned_agent_id UUID;
  v_contact_name TEXT;
  v_title TEXT;
  v_body TEXT;
  v_agent RECORD;
BEGIN
  -- Only notify for incoming messages from customers
  IF NEW.sender_type != 'customer' THEN
    RETURN NEW;
  END IF;

  -- Fetch conversation details
  SELECT account_id, contact_id, assigned_agent_id
  INTO v_account_id, v_contact_id, v_assigned_agent_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  IF v_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch contact display name
  SELECT COALESCE(NULLIF(name, ''), phone, 'Contact')
  INTO v_contact_name
  FROM contacts
  WHERE id = v_contact_id;

  v_title := 'New message from ' || COALESCE(v_contact_name, 'Contact');
  v_body := COALESCE(NULLIF(NEW.content_text, ''), '[' || NEW.content_type || ']');

  -- If conversation is assigned to a specific agent, notify that agent
  IF v_assigned_agent_id IS NOT NULL THEN
    INSERT INTO notifications (
      account_id, user_id, type, conversation_id, contact_id, title, body
    ) VALUES (
      v_account_id, v_assigned_agent_id, 'new_message', NEW.conversation_id, v_contact_id, v_title, v_body
    );
  ELSE
    -- If unassigned, notify all agents in the account
    FOR v_agent IN SELECT user_id FROM profiles WHERE account_id = v_account_id LOOP
      INSERT INTO notifications (
        account_id, user_id, type, conversation_id, contact_id, title, body
      ) VALUES (
        v_account_id, v_agent.user_id, 'new_message', NEW.conversation_id, v_contact_id, v_title, v_body
      );
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Do not block message insertion if notification creation fails
  RAISE WARNING 'Failed to create new message notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION notify_new_message() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_new_message_received ON messages;
CREATE TRIGGER on_new_message_received
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

