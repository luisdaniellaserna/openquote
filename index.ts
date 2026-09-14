// Server-side stub. This package's work happens in the TUI, which the host
// resolves from the "./tui" export. Keeping this entry free of renderer
// imports lets the server resolve it without loading the terminal UI.
import { PLUGIN_ID } from "./id";

export default {
  id: PLUGIN_ID,
  setup() {},
};
