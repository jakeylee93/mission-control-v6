#!/usr/bin/env bash
set -euo pipefail

URL="http://localhost:3001/api/costs"

MODEL=""
AGENT=""
TASK=""
INPUT_TOKENS=""
OUTPUT_TOKENS=""

usage() {
  cat <<'USAGE'
Usage:
  log-cost.sh --model <name> --agent <name> --task <task> --input-tokens <n> --output-tokens <n>

Example:
  log-cost.sh --model "claude-opus-4-6" --agent "Margarita" --task "Discord chat" --input-tokens 5000 --output-tokens 2000
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)
      MODEL="${2:-}"
      shift 2
      ;;
    --agent)
      AGENT="${2:-}"
      shift 2
      ;;
    --task)
      TASK="${2:-}"
      shift 2
      ;;
    --input-tokens)
      INPUT_TOKENS="${2:-}"
      shift 2
      ;;
    --output-tokens)
      OUTPUT_TOKENS="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$MODEL" || -z "$AGENT" || -z "$TASK" || -z "$INPUT_TOKENS" || -z "$OUTPUT_TOKENS" ]]; then
  echo "Missing required arguments." >&2
  usage
  exit 1
fi

if ! [[ "$INPUT_TOKENS" =~ ^[0-9]+$ && "$OUTPUT_TOKENS" =~ ^[0-9]+$ ]]; then
  echo "--input-tokens and --output-tokens must be non-negative integers." >&2
  exit 1
fi

payload=$(printf '{"model":"%s","agent":"%s","task":"%s","inputTokens":%s,"outputTokens":%s}' \
  "$MODEL" "$AGENT" "$TASK" "$INPUT_TOKENS" "$OUTPUT_TOKENS")

curl -sS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "$payload"
