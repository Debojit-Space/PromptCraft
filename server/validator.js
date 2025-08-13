// validator.js

// Configuration object for validation behavior
class ValidationConfig {
    constructor({
      trimTrailingNewline = true,
      caseMode = "exact",                 // "exact" | "lower"
      whitespace = "exact",               // "exact" | "trim_edges" | "collapse_internal" | "normalize_unicode_spaces"
      punctuation = "exact",              // "exact" | "normalize_quotes" | "normalize_dashes"
      unicodeNorm = null,                 // null | "NFC" | "NFKC"
      allowLocaleNumberNorm = false       // optional number format relaxations (usually false)
    } = {}) {
      this.trimTrailingNewline = trimTrailingNewline;
      this.caseMode = caseMode;
      this.whitespace = whitespace;
      this.punctuation = punctuation;
      this.unicodeNorm = unicodeNorm;
      this.allowLocaleNumberNorm = allowLocaleNumberNorm;
    }
  }
  
  // Unicode normalization via Intl (Node 12+ / modern browsers support String.prototype.normalize)
  function unicodeNormalize(str, form) {
    if (!form) return str;
    try {
      return str.normalize(form);
    } catch {
      return str; // fallback if environment lacks support
    }
  }
  
  // Replace curly quotes with straight quotes
  function normalizeQuotes(s) {
    return s
      .replace(/[\u201C\u201D]/g, '"')   // " "
      .replace(/[\u2018\u2019]/g, "'");  // ' '
  }
  
  // Normalize dashes (example: map en/em/minus to simple hyphen)
  function normalizeDashes(s) {
    return s
      .replace(/\u2013/g, "-")  // en dash
      .replace(/\u2014/g, "-")  // em dash
      .replace(/\u2212/g, "-"); // minus sign
  }
  
  // Replace all unicode whitespace with ASCII space
  function normalizeUnicodeSpaces(s) {
    return s.replace(/\s/g, " ");
  }
  
  // Collapse runs of spaces into a single space (internal)
  function collapseInternalSpaces(s) {
    return s.split(/\s+/).join(" ").trim();
  }
  
  function applyNormalization(str, cfg) {
    let s = String(str);
  
    if (cfg.trimTrailingNewline && s.endsWith("\n")) {
      s = s.slice(0, -1);
    }
  
    if (cfg.unicodeNorm) {
      s = unicodeNormalize(s, cfg.unicodeNorm);
    }
  
    if (cfg.whitespace === "normalize_unicode_spaces") {
      s = normalizeUnicodeSpaces(s);
    }
  
    if (cfg.whitespace === "trim_edges") {
      s = s.trim();
    }
  
    if (cfg.whitespace === "collapse_internal") {
      s = collapseInternalSpaces(s);
    }
  
    if (cfg.punctuation === "normalize_quotes") {
      s = normalizeQuotes(s);
    }
  
    if (cfg.punctuation === "normalize_dashes") {
      s = normalizeDashes(s);
    }
  
    if (cfg.caseMode === "lower") {
      s = s.toLowerCase();
    }
  
    // Locale number normalization hook (optional; not implemented by default)
    if (cfg.allowLocaleNumberNorm) {
      // Implement if needed (e.g., replace thin space separators with commas)
    }
  
    return s;
  }
  
  // Show spaces and newlines visually for diffs
  function visualizeSpaces(s) {
    return s.replace(/ /g, "·").replace(/\n/g, "↵");
  }
  
  // Character-by-character diff with code point diagnostics and summary hints
  function generateDiffReport(got, expected) {
    const maxlen = Math.max(got.length, expected.length);
    const issues = [];
  
    for (let i = 0; i < maxlen; i++) {
      const chGot = i < got.length ? got[i] : null;
      const chExp = i < expected.length ? expected[i] : null;
      if (chGot !== chExp) {
        issues.push({
          index: i,
          got: chGot,
          expected: chExp,
          got_codepoint: chGot == null ? null : "U+" + chGot.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"),
          exp_codepoint: chExp == null ? null : "U+" + chExp.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")
        });
      }
    }
  
    // Summary hints
    const hintDash = issues.some(x => ["-", "\u2013", "\u2014"].includes(x.got) || ["-", "\u2013", "\u2014"].includes(x.expected));
    const hintQuotes = issues.some(x => ["'", "\u2019", "\u2018", '"', "\u201C", "\u201D"].includes(x.got) || ["'", "\u2019", "\u2018", '"', "\u201C", "\u201D"].includes(x.expected));
    const hintSpace = issues.some(x => x.got === " " || x.expected === " ");
    const hintCombining = issues.some(x => x.got_codepoint && x.got_codepoint.startsWith("U+030")); // combining diacritics
  
    const hints = [];
    if (hintDash) hints.push("Dash type mismatch (hyphen vs en/em dash).");
    if (hintQuotes) hints.push("Quote style mismatch (straight vs curly).");
    if (hintSpace) hints.push("Whitespace count/placement differs.");
    if (hintCombining) hints.push("Possible missing/extra combining diacritic; consider Unicode normalization.");
  
    return {
      length_got: got.length,
      length_expected: expected.length,
      visual_got: visualizeSpaces(got),
      visual_expected: visualizeSpaces(expected),
      issues,
      hints
    };
  }
  
  // Main validator
  function validateOutput(modelOutput, target, cfg = new ValidationConfig()) {
    const rawOutput = String(modelOutput);
    const rawTarget = String(target);
  
    const normalizedOutput = applyNormalization(rawOutput, cfg);
    const normalizedTarget = applyNormalization(rawTarget, cfg);
  
    const passed = normalizedOutput === normalizedTarget;
    const diff = passed ? null : generateDiffReport(normalizedOutput, normalizedTarget);
  
    return {
      pass: passed,
      raw_output: rawOutput,
      normalized_output: normalizedOutput,
      normalized_target: normalizedTarget,
      diff
    };
  }
  
  // Suggested level preset helpers
  const Presets = {
    Beginner: new ValidationConfig({
      trimTrailingNewline: true,
      caseMode: "exact",
      whitespace: "exact",
      punctuation: "exact",
      unicodeNorm: null
    }),
    Intermediate: new ValidationConfig({
      trimTrailingNewline: true,
      caseMode: "exact",
      whitespace: "exact",
      punctuation: "exact",
      unicodeNorm: null
    }),
    Advanced: new ValidationConfig({
      trimTrailingNewline: true,
      caseMode: "exact",
      whitespace: "exact",
      punctuation: "exact",
      unicodeNorm: "NFC"
    }),
    Expert: new ValidationConfig({
      trimTrailingNewline: true,
      caseMode: "exact",
      whitespace: "exact",
      punctuation: "exact",
      unicodeNorm: null
    })
  };
  
  // Export for ES modules
  export {
    ValidationConfig,
    validateOutput,
    applyNormalization,
    generateDiffReport,
    Presets
  };
  