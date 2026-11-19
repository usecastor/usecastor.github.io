/**
 * Build-time precompiler for the Castor flagship code theater.
 *
 * `getPrecompiledHeroSteps()` runs AT ASTRO BUILD TIME (called from an
 * Astro frontmatter block, so its result is inlined into the page's
 * static HTML/JS bundle as plain JSON). It tokenizes the four execution
 * frames with Shiki (`github-dark-default` / rust + bash) and converts
 * each frame into `KeyedTokensInfo` via `codeToKeyedTokens` from
 * `shiki-magic-move/core`.
 *
 * Consecutive frames are run through `syncTokenKeys(previous, next)`,
 * so tokens that matched across a morph keep their key — that is what
 * makes `<ShikiMagicMovePrecompiled />` animate an Apple-Keynote-style
 * morph on the client with ZERO Shiki JS/WASM shipped: the browser only
 * plays CSS transitions over pre-baked tokens.
 */
import { createHighlighter } from 'shiki';
import {
  codeToKeyedTokens,
  syncTokenKeys,
  type KeyedTokensInfo,
} from 'shiki-magic-move/core';

const THEME = 'github-dark-default' as const;

export interface PrecompiledHeroStep {
  /** Stable machine id, e.g. 'dispatch'. */
  id: string;
  /** Short status caption shown on the theater rim, e.g. 'WARM KV · 93.7% HIT'. */
  label: string;
  lang: 'rust' | 'bash';
  /** Raw source of the frame (kept for `aria` / copy fallbacks). */
  code: string;
  /** Precompiled Shiki tokens — plain JSON, safe to inline. */
  tokens: KeyedTokensInfo;
}

export async function getPrecompiledHeroSteps(): Promise<PrecompiledHeroStep[]> {
  const highlighter = await createHighlighter({
    themes: [THEME],
    langs: ['rust', 'bash'],
  });

  // ── Step 0 · DISPATCH ─────────────────────────────────────────────
  // Cloud Lead (Opus 5.5) dispatches the local microkernel through the
  // castor_coworker MCP tool.
  const dispatch = `# cloud lead · opus 5.5 — dispatches the local microkernel
$ castor_mcp call castor_coworker \\
    --session "auth-fix" \\
    --cwd "." \\
    --task "verify_token rejects expired tokens"
↳ session "auth-fix" spawned on rtx-3090 · kv warm · egress 0 bytes`;

  // ── Step 1 · WARM KV · 93.7% HIT ──────────────────────────────────
  // Local Qwen3.8-27B on RTX 3090 searches the tree and opens the
  // buggy file — a token read costs $0.000 (prefix cache, 93.7% hit).
  const warmKv = `// rtx-3090 · qwen3.8-27b · warm kv (93.7% prefix hit)
fn verify_token(raw: &str) -> Claims {
    let token = decode_jws(raw).unwrap();      // panic path, no expiry check
    let claims = token.claims().clone();
    if !token.verify(&key) {
        panic!("bad signature");
    }
    claims                               // expired tokens pass through
}`;

  // ── Step 2 · AST-GATED EDIT ───────────────────────────────────────
  // The exact buggy function morphs (tree-sitter Rust grammar PASS) to
  // a constant-time expiry check returning Result<Claims, AuthError>.
  const astEdit = `// rtx-3090 · qwen3.8-27b · ast-gated edit — tree-sitter pass
pub fn verify_token(raw: &str) -> Result<Claims, AuthError> {
    let token = decode_jws(raw)?;            // ? instead of unwrap
    if !token.verify(&key) {
        return Err(AuthError::BadSignature);
    }
    if token.exp() < now().as_secs() {       // constant-time expiry check
        return Err(AuthError::Expired);
    }
    Ok(token.claims().clone())
}`;

  // ── Step 3 · VERIFIED · EXIT 0 ────────────────────────────────────
  // The test loop runs locally and reports back over the :18021
  // zero-turn HTTP wait — the cloud Lead never touches a token again.
  const verified = `$ cargo test --lib
   Compiling castor v1.5.0
    Finished test [unoptimized + debuginfo]
     Running unittests src/lib.rs (target/debug/deps/castor)
test result: ok. 42 passed; 0 failed; 0 ignored; 0 filtered out; 0.41s
↳ :18021 · exit 0 · 0 cloud turns · $0.000 local api cost`;

  const frames: Array<{
    id: string;
    label: string;
    lang: 'rust' | 'bash';
    code: string;
  }> = [
    { id: 'dispatch', label: 'DISPATCH', lang: 'bash', code: dispatch },
    { id: 'warm-kv', label: 'WARM KV · 93.7% HIT', lang: 'rust', code: warmKv },
    {
      id: 'ast-edit',
      label: 'AST-GATED EDIT · TREE-SITTER PASS',
      lang: 'rust',
      code: astEdit,
    },
    { id: 'verified', label: 'VERIFIED · EXIT 0', lang: 'bash', code: verified },
  ];

  const steps: PrecompiledHeroStep[] = [];
  let previous: KeyedTokensInfo | null = null;

  for (const frame of frames) {
    // `lineNumbers: true` (4th arg) bakes a `shiki-magic-move-line-number`
    // token into every line so the precompiled theater shows line numbers —
    // the precompiled path renders exactly the tokens it is given (the
    // React `options.lineNumbers` flag only drives the live highlighter).
    let info = codeToKeyedTokens(
      highlighter,
      frame.code,
      {
        lang: frame.lang,
        theme: THEME,
      },
      true,
    );
    // Carry keys from the previous frame into this one so the client-side
    // magic-move diff sees stable identities across the morph.
    if (previous) {
      const synced = syncTokenKeys(previous, info);
      info = synced.to;
    }
    previous = info;
    steps.push({ ...frame, tokens: info });
  }

  return steps;
}
