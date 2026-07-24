"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Notification } from "@/types";
import { toast } from "sonner";

function playChimeSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch {
    // Ignore audio context errors (e.g. user interaction policy)
  }
}

export function NotificationListener() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;

    // Request browser notification permission once mounted
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`user-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as Notification;

          // 1. Play audio chime
          playChimeSound();

          // 2. In-app toast popup
          toast(row.title, {
            description: row.body ?? undefined,
            action: row.conversation_id
              ? {
                  label: "View Inbox",
                  onClick: () =>
                    router.push(`/inbox?c=${row.conversation_id}`),
                }
              : {
                  label: "Notifications",
                  onClick: () => router.push("/notifications"),
                },
          });

          // 3. Desktop browser notification
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              const desktopNotif = new Notification(row.title, {
                body: row.body ?? undefined,
                tag: row.id,
              });

              desktopNotif.onclick = () => {
                window.focus();
                if (row.conversation_id) {
                  router.push(`/inbox?c=${row.conversation_id}`);
                } else {
                  router.push("/notifications");
                }
              };
            } catch {
              // Ignore desktop notification errors
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, router]);

  return null;
}

