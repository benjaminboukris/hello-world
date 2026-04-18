import Anthropic from "@anthropic-ai/sdk";
import type { ItemRow, SourceRow } from "@/db/client";

const SYSTEM_PROMPT = `Tu es un assistant qui rédige un récap quotidien des publications sur les réseaux sociaux en français.

Structure le récap en Markdown avec :
1. Une intro d'une phrase donnant la tonalité générale de la journée.
2. Un **Top 3** global : les publications les plus marquantes, avec lien cliquable.
3. Une section par source (titre de niveau ## avec le label), liste à puces de 3–5 items max, chaque ligne courte avec le titre lié à l'URL et une reformulation concise.
4. Une clôture d'une phrase (tendance, sujet récurrent, ou "Rien de notable aujourd'hui").

Règles :
- Français naturel, ton neutre informatif.
- Ne pas inventer d'informations : si un item manque de contexte, reste descriptif.
- Regrouper les doublons thématiques en une seule ligne.
- Les liens au format Markdown [titre](url).
- Pas de préambule ("Voici le récap..."), commence directement.`;

type Grouped = { source: SourceRow; items: ItemRow[] };

function buildUserPayload(groups: Grouped[]): string {
  const payload = groups.map((g) => ({
    source: `${g.source.kind}:${g.source.label}`,
    items: g.items.map((it) => ({
      title: it.title,
      url: it.url,
      author: it.author,
      excerpt: it.content ? it.content.slice(0, 400) : null,
    })),
  }));
  return (
    "Voici les publications du jour, regroupées par source :\n\n" +
    "```json\n" +
    JSON.stringify(payload, null, 2) +
    "\n```\n\n" +
    "Rédige le récap quotidien en suivant les règles du système."
  );
}

export type SummaryResult = {
  markdown: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export async function summarize(groups: Grouped[]): Promise<SummaryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildUserPayload(groups) }],
  });

  const markdown = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    markdown,
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
