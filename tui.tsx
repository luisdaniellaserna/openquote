/** @jsxImportSource @opentui/solid */

import { Plugin } from "@opencode/plugin/tui";
import { Show, createMemo, createSignal } from "solid-js";

import { PLUGIN_ID } from "./id";
import { type Quote, QUOTES } from "./quotes";
import { View, SOURCE_LABELS } from "./ui";
import {
  type QuoteSource,
  deduplicateQuotes,
  getQuotesForSource,
  parseQuoteInput,
  quoteKey,
} from "./utils";

interface QuoteState {
  hidden: boolean;
  source: QuoteSource;
  custom: Quote[];
}

const SOURCES = Object.keys(SOURCE_LABELS) as QuoteSource[];

function quoteOptions(quotes: Quote[]) {
  return quotes.map(q => ({
    title: quoteKey(q),
    value: q,
  }));
}

export default Plugin.define({
  id: PLUGIN_ID,
  setup(ctx) {
    const [state, setState] = ctx.storage.store<QuoteState>("state", {
      initial: { hidden: false, source: "both", custom: [] },
    });
    const [selected, setSelected] = createSignal<Quote | null>(null);
    const isHome = () => ctx.ui.router.current().type === "home";

    function QuoteBody() {
      const source = createMemo(() => state.source);
      const quotes = createMemo(() =>
        getQuotesForSource(source(), state.custom),
      );
      return (
        <View
          show={!state.hidden}
          fg={ctx.theme.text.default}
          authorFg={ctx.theme.text.feedback.warning.default}
          quotes={quotes()}
          selected={selected}
        />
      );
    }

    // `keymap.layer` is owned by the component that calls it, so the layer is
    // registered from a mounted slot rather than directly in `setup`.
    const disposeKeymap = ctx.ui.slot({
      append: "app",
      render: () => {
        ctx.keymap.layer(() => ({
          mode: "global",
          priority: 10,
          commands: [
            {
              id: "quotes.tips.toggle",
              title: state.hidden ? "Show tips" : "Hide tips",
              group: "System",
              palette: true,
              enabled: isHome,
              run: () => {
                void setState(draft => {
                  draft.hidden = !draft.hidden;
                });
              },
            },
            {
              id: "quotes.source",
              title: "Set quote source",
              group: "System",
              palette: true,
              enabled: isHome,
              run: async () => {
                const value = await ctx.ui.dialog.select<QuoteSource>({
                  title: "Quote source",
                  current: state.source,
                  options: SOURCES.map(source => ({
                    title: SOURCE_LABELS[source],
                    value: source,
                  })),
                });
                if (value === undefined) return;
                void setState(draft => {
                  draft.source = value;
                });
              },
            },
            {
              id: "quotes.add",
              title: "Add quote",
              group: "System",
              palette: true,
              enabled: isHome,
              run: async () => {
                const input = await ctx.ui.dialog.prompt({
                  title: "Add quote",
                  placeholder: '"Your quote here" - Author Name',
                });
                if (input === undefined) return;
                const parsed = parseQuoteInput(input);
                if (!parsed) {
                  ctx.ui.toast.show({
                    variant: "error",
                    message: 'Invalid format. Use: "quote" - author',
                  });
                  return;
                }
                await setState(draft => {
                  draft.custom.push(parsed);
                });
                ctx.ui.toast.show({
                  variant: "success",
                  message: "Quote added.",
                });
              },
            },
            {
              id: "quotes.remove",
              title: "Remove quote",
              group: "System",
              palette: true,
              enabled: isHome,
              run: async () => {
                if (state.custom.length === 0) {
                  ctx.ui.toast.show({
                    variant: "info",
                    message: "No custom quotes added.",
                  });
                  return;
                }
                const option = await ctx.ui.dialog.select<Quote>({
                  title: "Remove quote",
                  placeholder: "Search quotes...",
                  options: quoteOptions([...state.custom]),
                });
                if (option === undefined) return;
                await setState(draft => {
                  const index = draft.custom.findIndex(
                    q => quoteKey(q) === quoteKey(option),
                  );
                  if (index >= 0) draft.custom.splice(index, 1);
                });
                ctx.ui.toast.show({
                  variant: "success",
                  message: "Quote removed.",
                });
              },
            },
            {
              id: "quotes.select",
              title: "Select quote",
              group: "System",
              palette: true,
              enabled: isHome,
              run: async () => {
                const all = deduplicateQuotes([...QUOTES, ...state.custom]);
                const option = await ctx.ui.dialog.select<Quote>({
                  title: "Select quote",
                  placeholder: "Search quotes...",
                  options: quoteOptions(all),
                });
                if (option === undefined) return;
                setSelected(option);
              },
            },
          ],
        }));
        return null;
      },
    });

    // The home footer is pinned to the bottom of the screen (a flexGrow spacer
    // sits above it), so the quote is drawn as a centered overlay instead.
    const disposeQuote = ctx.ui.slot({
      append: "app",
      render: () => (
        <Show when={isHome()}>
          <box
            position="absolute"
            left={0}
            right={0}
            top="70%"
            width="100%"
            alignItems="center"
          >
            <QuoteBody />
          </box>
        </Show>
      ),
    });

    // Suppress the built-in home tips that would otherwise sit at the bottom.
    const disposeTips = ctx.ui.slot({
      replace: "home.footer",
      render: () => <box />,
    });

    return () => {
      disposeKeymap();
      disposeQuote();
      disposeTips();
    };
  },
});
