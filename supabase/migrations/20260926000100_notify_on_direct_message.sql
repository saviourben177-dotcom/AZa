-- Extends the existing new-message notification trigger so direct
-- (conversation_id) messages also notify the other participant.
-- The join_request_id branch is unchanged from the previous definition.
-- Applied directly to the Supabase project (2026-09-26).
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_idea_owner uuid;
  v_requester_id uuid;
  v_recipient uuid;
  v_sender_name text;
  v_user_a uuid;
  v_user_b uuid;
BEGIN
  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;

  IF NEW.conversation_id IS NOT NULL THEN
    SELECT c.user_a_id, c.user_b_id
    INTO v_user_a, v_user_b
    FROM public.conversations c
    WHERE c.id = NEW.conversation_id;

    v_recipient := CASE WHEN NEW.sender_id = v_user_a THEN v_user_b ELSE v_user_a END;

    IF v_recipient IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link_path)
      VALUES (
        v_recipient,
        'new_message',
        'New message from ' || v_sender_name,
        left(NEW.body, 140),
        '/messages/' || NEW.conversation_id
      );
    END IF;

    RETURN NEW;
  END IF;

  SELECT jr.requester_id, i.user_id
  INTO v_requester_id, v_idea_owner
  FROM public.join_requests jr
  JOIN public.ideas i ON i.id = jr.idea_id
  WHERE jr.id = NEW.join_request_id;

  v_recipient := CASE WHEN NEW.sender_id = v_requester_id THEN v_idea_owner ELSE v_requester_id END;

  IF v_recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link_path)
    VALUES (
      v_recipient,
      'new_message',
      'New message from ' || v_sender_name,
      left(NEW.body, 140),
      '/team-finder/messages/' || NEW.join_request_id
    );
  END IF;
  RETURN NEW;
END;
$function$;
