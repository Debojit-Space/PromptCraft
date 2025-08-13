// antiCheat.js

// Minimal confusables map (use a full TR39 confusables table in production)
const CONFUSABLES_MAP = {
    "а": "a", // Cyrillic a -> Latin a
    "е": "e", // Cyrillic e -> Latin e
    // Add more mappings as needed
  };
  
  const ZERO_WIDTH = [ "\u200B", "\u200C", "\u200D", "\u2060" ];
  
  function stripZeroWidth(s) {
    return s.split("").filter(ch => !ZERO_WIDTH.includes(ch)).join("");
  }
  
  function mapConfusables(s) {
    return s.split("").map(ch => CONFUSABLES_MAP[ch] || ch).join("");
  }
  
  function normalizedForCheck(s) {
    let out = stripZeroWidth(String(s));
    out = out.normalize("NFKC");
    out = mapConfusables(out);
    return out;
  }
  
  function containsTargetOrVariant(userPrompt, target) {
    const up = normalizedForCheck(userPrompt);
    const tgt = normalizedForCheck(target);
  
    if (up.toLowerCase().includes(tgt.toLowerCase())) return true;
  
    // Surrounding variants (basic)
    const surrounds = ['"', "'", "“", "”", "[", "]", "(", ")", "{", "}", " "];
    for (const s of surrounds) {
      const variant = (s + tgt + s).toLowerCase();
      if (up.toLowerCase().includes(variant)) return true;
    }
    return false;
  }
  
  function looksLikeEncodedFullTarget(userPrompt, target) {
    try {
      const tgtBytes = new TextEncoder().encode(target);
  
      // Base64
      const b64 = (typeof btoa === "function")
        ? btoa(String.fromCharCode(...tgtBytes))
        : Buffer.from(tgtBytes).toString("base64");
      if (userPrompt.includes(b64)) return true;
  
      // Hex
      const hexLower = Array.from(tgtBytes).map(b => b.toString(16).padStart(2, "0")).join("");
      if (userPrompt.toLowerCase().includes(hexLower)) return true;
  
      // URL percent-encoding (very naive)
      const urlHex = Array.from(target).map(c => "%" + c.codePointAt(0).toString(16).toUpperCase()).join("");
      if (userPrompt.toUpperCase().includes(urlHex)) return true;
  
      // Unicode codepoints
      const cps = Array.from(target).map(c => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")).join(" ");
      if (userPrompt.toUpperCase().includes(cps)) return true;
  
    } catch {
      // ignore encoding errors
    }
    return false;
  }
  
  const BANNED_PHRASES = [
    "ignore previous instructions",
    "reveal the target",
    "print the exact target",
    "use the word displayed",
    "output the sentence shown above",
    "show me the hidden answer"
  ];
  
  function promptAllowed(userPrompt, target, level) {
    const p = String(userPrompt).toLowerCase();
  
    // Meta-instruction ban
    for (const phrase of BANNED_PHRASES) {
      if (p.includes(phrase)) {
        return { ok: false, reason: "Meta-instruction detected." };
      }
    }
  
    // Direct/variant target ban
    if (containsTargetOrVariant(userPrompt, target)) {
      return { ok: false, reason: "Prompt contains the target or a trivial variant." };
      }
  
    // Progressive encoding bans
    if (level >= 6 && looksLikeEncodedFullTarget(userPrompt, target)) {
      return { ok: false, reason: "Encoded or codepoint representation of the full target detected." };
    }
  
    return { ok: true, reason: "OK" };
  }
  
  // Export for ES modules
  export {
    promptAllowed,
    containsTargetOrVariant,
    looksLikeEncodedFullTarget
  };
  