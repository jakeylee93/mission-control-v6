#!/usr/bin/env node

const URL = 'http://localhost:3001/api/costs';

function usage() {
  console.error('Usage: node log-cost.js --model "..." --agent "..." --task "..." --input <n> --output <n>');
}

function parseArgs(argv) {
  const args = {
    model: '',
    agent: '',
    task: '',
    input: '',
    output: ''
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];

    switch (key) {
      case '--model':
        args.model = val ?? '';
        i += 1;
        break;
      case '--agent':
        args.agent = val ?? '';
        i += 1;
        break;
      case '--task':
        args.task = val ?? '';
        i += 1;
        break;
      case '--input':
        args.input = val ?? '';
        i += 1;
        break;
      case '--output':
        args.output = val ?? '';
        i += 1;
        break;
      case '-h':
      case '--help':
        usage();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${key}`);
        usage();
        process.exit(1);
    }
  }

  return args;
}

function isNonNegativeInt(value) {
  return /^\d+$/.test(value);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.model || !args.agent || !args.task || !args.input || !args.output) {
    console.error('Missing required arguments.');
    usage();
    process.exit(1);
  }

  if (!isNonNegativeInt(args.input) || !isNonNegativeInt(args.output)) {
    console.error('--input and --output must be non-negative integers.');
    process.exit(1);
  }

  const payload = {
    model: args.model,
    agent: args.agent,
    task: args.task,
    inputTokens: Number(args.input),
    outputTokens: Number(args.output)
  };

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
  }

  process.stdout.write(text);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
