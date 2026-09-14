/** @jsxImportSource @opentui/solid */

import type { ColorInput } from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/solid";
import type { Accessor } from "solid-js";
import { createMemo, For, Show } from "solid-js";

import type { Quote } from "./quotes";
import type { QuoteSource } from "./utils";
import { wordWrap } from "./utils";

export const MAX_QUOTES_WIDTH = 66;

export const SOURCE_LABELS: Record<QuoteSource, string> = {
  builtin: "Built-in",
  custom: "Custom",
  both: "Both",
};

/**
 * Presentational quote block.
 *
 * Colors are resolved `ColorInput` values taken from the V2 theme (`RGBA`).
 */
function Quotes(props: {
  fg: ColorInput;
  authorFg: ColorInput;
  quotes: Quote[];
  selected: Accessor<Quote | null>;
}) {
  const display = createMemo(() => {
    const q = props.selected() ?? props.quotes[Math.floor(Math.random() * props.quotes.length)];
    return {
      text: q?.quote ?? "No custom quotes configured.",
      author: q?.author ?? "Add a custom quote via the `Add quote` command.",
    };
  });

  const dimensions = useTerminalDimensions();
  const lines = createMemo(() =>
    wordWrap(display().text, Math.min(MAX_QUOTES_WIDTH, dimensions().width - 8)),
  );
  const firstLine = lines()[0];
  const lastLine = lines()[lines().length - 1];
  return (
    <box width="100%" flexDirection="column" flexShrink={0}>
      <For each={lines()}>
        {line => (
          <text alignSelf="center" fg={props.fg} attributes={TextAttributes.ITALIC}>
            {lines().length === 1 ? `“${line}”` : `${firstLine === line ? `“` : ``}${line}${lastLine === line ? `”` : ``}`}
          </text>
        )}
      </For>
      <text
        alignSelf="center"
        fg={props.authorFg}
      >
        {`- ${display().author}`}
      </text>
    </box> 
  );
}
export function View(props: {
  show: boolean;
  fg: ColorInput;
  authorFg: ColorInput;
  quotes: Quote[];
  selected: Accessor<Quote | null>;
}) {
  return (
    <box
      minHeight={4}
      width="100%"
      alignItems="center"
      justifyContent="center"
      paddingY={2}
    >
      <Show when={props.show}>
        <Quotes fg={props.fg} authorFg={props.authorFg} quotes={props.quotes} selected={props.selected} />
      </Show>
    </box>
  );
}
