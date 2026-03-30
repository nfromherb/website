#!/usr/bin/env node

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an elite resume copywriter and markdown architect. Your job is to take raw resume content — notes, bullet points, stream-of-consciousness descriptions, or rough drafts — and transform them into a polished, high-impact professional markdown document.

Rules:
1. **Structure**: Use clean markdown hierarchy (h1 for name, h2 for sections, h3 for subsections). Use horizontal rules to separate major sections.
2. **Formatting**: Bold key terms, use bullet lists for skills/tools, use blockquotes for testimonial-style callouts. Use tables where data is comparative.
3. **Voice**: Confident, direct, operator-level. No fluff. No buzzword salad. Write like someone who ships, not someone who decks.
4. **Impact**: Lead every section with the strongest claim. Quantify where possible. Show don't tell — specifics over generalities.
5. **Flow**: The document should read top-to-bottom as a narrative arc: who you are → what you've done → how you think → what you bring → how to engage.
6. **Sections to include** (adapt as needed based on input):
   - Header (name, title, location, availability)
   - Headline / Value Proposition
   - Executive Summary
   - Core Competencies (skills matrix or grouped list)
   - Deep-Dive sections (detailed expertise areas)
   - Technical Stack / Tools
   - Career Highlights or Case Studies
   - Contact / Engagement CTA
7. **Markdown quality**: Output must be valid GitHub-flavored markdown. Use consistent spacing. No trailing whitespace. No broken links.
8. **Length**: Be thorough. This is a showcase document, not a one-pager. Include everything that demonstrates value.

Output ONLY the markdown content. No preamble, no explanation, no code fences wrapping the entire document.`;

async function buildResume(inputText) {
  console.log("\n🔨 Building your resume...\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is my raw resume content. Transform this into a polished, high-impact professional markdown resume:\n\n${inputText}`,
      },
    ],
  });

  const markdown = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return markdown;
}

async function refineResume(currentMarkdown, feedback) {
  console.log("\n🔄 Refining based on your feedback...\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is the current resume markdown:\n\n${currentMarkdown}\n\n---\n\nApply the following feedback and return the full updated markdown:\n\n${feedback}`,
      },
    ],
  });

  const markdown = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return markdown;
}

async function main() {
  const args = process.argv.slice(2);

  // Determine input source
  let inputText;
  let outputPath = "resume-output.md";

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Resume Agent — Transform raw resume content into polished markdown

Usage:
  node resume-agent.mjs <input-file> [options]
  echo "raw content" | node resume-agent.mjs - [options]

Options:
  <input-file>          Path to a text file with raw resume content
  -                     Read from stdin
  -o, --output <path>   Output file path (default: resume-output.md)
  --refine <resume.md>  Refine an existing resume with feedback from stdin or input file
  -h, --help            Show this help

Examples:
  node resume-agent.mjs raw-notes.txt
  node resume-agent.mjs raw-notes.txt -o nick-resume.md
  node resume-agent.mjs feedback.txt --refine resume-output.md
  echo "Nick, Klaviyo expert, 10 years cannabis DTC..." | node resume-agent.mjs -
`);
    process.exit(0);
  }

  // Parse --output flag
  const outputIdx = args.findIndex((a) => a === "-o" || a === "--output");
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    outputPath = args[outputIdx + 1];
    args.splice(outputIdx, 2);
  }

  // Parse --refine flag
  const refineIdx = args.findIndex((a) => a === "--refine");
  let refineResumePath = null;
  if (refineIdx !== -1 && args[refineIdx + 1]) {
    refineResumePath = args[refineIdx + 1];
    args.splice(refineIdx, 2);
  }

  const inputArg = args[0];

  if (!inputArg) {
    console.error(
      "Error: Provide an input file path or use - for stdin. Run with --help for usage."
    );
    process.exit(1);
  }

  if (inputArg === "-") {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    inputText = Buffer.concat(chunks).toString("utf-8");
  } else {
    if (!existsSync(inputArg)) {
      console.error(`Error: File not found: ${inputArg}`);
      process.exit(1);
    }
    inputText = readFileSync(inputArg, "utf-8");
  }

  if (!inputText.trim()) {
    console.error("Error: Input is empty.");
    process.exit(1);
  }

  let result;

  if (refineResumePath) {
    if (!existsSync(refineResumePath)) {
      console.error(`Error: Resume file not found: ${refineResumePath}`);
      process.exit(1);
    }
    const currentMarkdown = readFileSync(refineResumePath, "utf-8");
    result = await refineResume(currentMarkdown, inputText);
  } else {
    result = await buildResume(inputText);
  }

  writeFileSync(outputPath, result, "utf-8");
  console.log(`✅ Resume written to ${outputPath}`);
  console.log(
    `\nTo refine, create a feedback file and run:\n  node resume-agent.mjs feedback.txt --refine ${outputPath}`
  );
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
