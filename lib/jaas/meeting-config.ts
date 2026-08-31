/** Resolve JaaS app id from API response or public env (must match BE `JaaS:AppId`). */
export function resolveJaasAppId(apiAppId?: string | null): string | null {
  const fromApi = apiAppId?.trim();
  if (fromApi) return fromApi;
  const fromEnv = process.env.NEXT_PUBLIC_JAAS_APP_ID?.trim();
  return fromEnv || null;
}

const STUDENT_TOOLBAR = [
  "microphone",
  "camera",
  "chat",
  "raisehand",
  "tileview",
  "fullscreen",
  "hangup",
] as const;

const MODERATOR_TOOLBAR = [
  "microphone",
  "camera",
  "desktop",
  "chat",
  "raisehand",
  "participants-pane",
  "tileview",
  "fullscreen",
  "hangup",
] as const;

/** Jitsi `configOverwrite` — free-tier classroom defaults; no recording/livestream. */
export function buildJaasConfigOverwrite(isModerator: boolean): Record<string, unknown> {
  return {
    prejoinPageEnabled: false,
    disableDeepLinking: true,
    startWithAudioMuted: !isModerator,
    startWithVideoMuted: false,
    disableRecording: true,
    liveStreamingEnabled: false,
    transcribingEnabled: false,
    disableInviteFunctions: true,
    ...(isModerator
      ? {}
      : {
          disableRemoteMute: true,
          remoteVideoMenu: {
            disableKick: true,
            disableGrantModerator: true,
          },
        }),
  };
}

/** Hide paid / admin toolbar actions; mentors get participant list + screen share. */
export function buildJaasInterfaceConfigOverwrite(
  isModerator: boolean,
): Record<string, unknown> {
  return {
    MOBILE_APP_PROMO: false,
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
    TOOLBAR_BUTTONS: isModerator
      ? [...MODERATOR_TOOLBAR]
      : [...STUDENT_TOOLBAR],
  };
}
