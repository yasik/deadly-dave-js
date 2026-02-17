export type UiMode = "intro" | "gameplay" | "quit_confirm";
export type UiEvent = "start" | "request_quit" | "confirm_quit" | "cancel_quit" | "game_over";

export function reduceUiMode(mode: UiMode, event: UiEvent): UiMode {
  if (mode === "intro" && event === "start") {
    return "gameplay";
  }

  if (mode === "gameplay" && event === "request_quit") {
    return "quit_confirm";
  }

  if (mode === "quit_confirm" && event === "confirm_quit") {
    return "intro";
  }

  if (mode === "quit_confirm" && event === "cancel_quit") {
    return "gameplay";
  }

  if (mode === "gameplay" && event === "game_over") {
    return "intro";
  }

  return mode;
}
