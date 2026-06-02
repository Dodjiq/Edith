/* Auto-generated from the existing Edith registry and Motion Studio source metadata. */
import type { MotionDesignTemplate, MotionDesignTemplateId } from './types';

export const legacyMotionDesignTemplates = [
  {
    "id": "blur-word-title",
    "sourceBit": "bit-blur-slide-word",
    "label": "Blur Word Title",
    "category": "text",
    "description": "Words fade, unblur, and rise into place.",
    "tags": [
      "animated-text",
      "word",
      "title"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "text": "Motion title",
      "primaryColor": "#ffffff",
      "accentColor": "#7dd3fc",
      "fontSize": 92,
      "staggerFrames": 3
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for a polished hero title, chapter opener, or short important phrase that should feel cinematic and premium.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "fade-in-text",
    "sourceBit": "bit-fade-in",
    "label": "Fade In Text",
    "category": "text",
    "description": "A simple readable text fade.",
    "tags": [
      "animated-text",
      "fade"
    ],
    "defaultDurationInFrames": 90,
    "defaultProps": {
      "text": "Fade in",
      "primaryColor": "#ffffff",
      "accentColor": "#a7f3d0",
      "fontSize": 84,
      "staggerFrames": 3
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for the safest readable text overlay when the user asks for something subtle, clean, minimal, or non-distracting.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "word-by-word",
    "sourceBit": "bit-word-by-word",
    "label": "Word by Word",
    "category": "text",
    "description": "Text appears one word at a time.",
    "tags": [
      "animated-text",
      "stagger"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "text": "One word at a time",
      "primaryColor": "#ffffff",
      "accentColor": "#facc15",
      "fontSize": 76,
      "staggerFrames": 3
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for quotes, hooks, punchlines, or educational text where each word should land with spoken pacing.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "character-by-character",
    "sourceBit": "bit-char-by-char",
    "label": "Character by Character",
    "category": "text",
    "description": "Characters reveal with a tight stagger.",
    "tags": [
      "animated-text",
      "character"
    ],
    "defaultDurationInFrames": 110,
    "defaultProps": {
      "text": "Character reveal",
      "primaryColor": "#ffffff",
      "accentColor": "#f0abfc",
      "fontSize": 70,
      "staggerFrames": 3
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for short labels, passwords, tech words, or reveals that should feel precise and mechanical.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "slide-from-left",
    "sourceBit": "bit-slide-from-left",
    "label": "Slide From Left",
    "category": "text",
    "description": "Text slides in from the left with fade.",
    "tags": [
      "text",
      "slide",
      "motion"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "text": "Slide from left",
      "primaryColor": "#ffffff",
      "accentColor": "#60a5fa",
      "fontSize": 78,
      "direction": "left",
      "staggerFrames": 3
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for a title, label, or annotation that should enter from the edge and point attention into the frame.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "glitch-in",
    "sourceBit": "bit-glitch-in",
    "label": "Glitch In",
    "category": "text",
    "description": "A punchy digital glitch reveal.",
    "tags": [
      "text",
      "glitch"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "text": "Signal locked",
      "primaryColor": "#ffffff",
      "accentColor": "#22d3ee",
      "fontSize": 82,
      "intensity": 1
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose for cyber, AI, hacking, digital error, signal lock, or high-energy tech reveals.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "glitch-cycle",
    "sourceBit": "bit-glitch-cycle",
    "label": "Glitch Cycle",
    "category": "text",
    "description": "Cycling text with glitch transitions.",
    "tags": [
      "text",
      "glitch",
      "cycle"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "text": "Draft / Edit / Publish",
      "primaryColor": "#ffffff",
      "accentColor": "#fb7185",
      "fontSize": 72,
      "intensity": 1
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose when several short phrases should rotate through the same position with a digital glitch transition.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "matrix-rain",
    "sourceBit": "bit-matrix-rain",
    "label": "Matrix Rain",
    "category": "text",
    "description": "Digital rain background texture.",
    "tags": [
      "text",
      "background",
      "matrix"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "primaryColor": "#86efac",
      "backgroundColor": "#020617",
      "density": 1
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "density",
        "label": "Density",
        "type": "number",
        "min": 0.2,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose as a background texture for coding, cybersecurity, AI, data, or futuristic scenes; keep foreground text readable.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "lower-third-slide",
    "sourceBit": "bit-slide-from-left",
    "label": "Lower Third Slide",
    "category": "text",
    "description": "Animated name and role lower third.",
    "tags": [
      "lower-third",
      "title",
      "overlay"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "text": "Alex Morgan",
      "secondaryText": "Founder",
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "backgroundColor": "#0f172a",
      "fontSize": 52
    },
    "controls": [
      {
        "key": "text",
        "label": "Name",
        "type": "text"
      },
      {
        "key": "secondaryText",
        "label": "Role",
        "type": "text"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for speaker names, roles, interview identifiers, guest introductions, and professional lower-third overlays.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "basic-typewriter",
    "sourceBit": "basic-typewriter",
    "label": "Basic Typewriter",
    "category": "typewriter",
    "description": "Simple typing animation with cursor.",
    "tags": [
      "typewriter",
      "cursor"
    ],
    "defaultDurationInFrames": 140,
    "defaultProps": {
      "text": "Typing a precise thought.",
      "primaryColor": "#e5e7eb",
      "accentColor": "#38bdf8",
      "backgroundColor": "#111827",
      "fontSize": 50,
      "typingSpeed": 1
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "typingSpeed",
        "label": "Typing speed",
        "type": "number",
        "min": 0.25,
        "max": 6,
        "step": 0.25
      }
    ],
    "source": "edith",
    "detail": "Choose for one sentence or thought that should appear as typed text with a simple cursor.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "cli-simulation",
    "sourceBit": "cli-simulation",
    "label": "CLI Simulation",
    "category": "typewriter",
    "description": "Terminal-like commands and output.",
    "tags": [
      "terminal",
      "cli",
      "typewriter"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "commandLines": [
        "pnpm build",
        "render complete"
      ],
      "primaryColor": "#d1fae5",
      "accentColor": "#34d399",
      "backgroundColor": "#020617",
      "fontSize": 36,
      "typingSpeed": 1
    },
    "controls": [
      {
        "key": "commandLines",
        "label": "Lines",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "typingSpeed",
        "label": "Typing speed",
        "type": "number",
        "min": 0.25,
        "max": 6,
        "step": 0.25
      }
    ],
    "source": "edith",
    "detail": "Choose for terminal commands, build logs, developer workflows, install steps, or command-line storytelling.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "multitext-typewriter",
    "sourceBit": "multitext-typewriter",
    "label": "Multi Text Typewriter",
    "category": "typewriter",
    "description": "Several phrases typed in sequence.",
    "tags": [
      "typewriter",
      "sequence"
    ],
    "defaultDurationInFrames": 170,
    "defaultProps": {
      "text": "First idea|Second idea|Final idea",
      "primaryColor": "#ffffff",
      "accentColor": "#fbbf24",
      "fontSize": 54,
      "typingSpeed": 1
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "typingSpeed",
        "label": "Typing speed",
        "type": "number",
        "min": 0.25,
        "max": 6,
        "step": 0.25
      }
    ],
    "source": "edith",
    "detail": "Choose when multiple phrases should type one after another, such as benefits, alternatives, or quick examples.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "variable-speed-typewriter",
    "sourceBit": "variable-speed-typewriter",
    "label": "Variable Speed Typewriter",
    "category": "typewriter",
    "description": "Typewriter with varied rhythm.",
    "tags": [
      "typewriter",
      "speed"
    ],
    "defaultDurationInFrames": 170,
    "defaultProps": {
      "text": "Typing with human rhythm.",
      "primaryColor": "#ffffff",
      "accentColor": "#c084fc",
      "fontSize": 54,
      "intensity": 1,
      "typingSpeed": 1
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      },
      {
        "key": "typingSpeed",
        "label": "Typing speed",
        "type": "number",
        "min": 0.25,
        "max": 6,
        "step": 0.25
      }
    ],
    "source": "edith",
    "detail": "Choose for a typewriter effect that should feel less robotic and more like human typing rhythm.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "basic-code-block",
    "sourceBit": "bit-basic-code-block",
    "label": "Code Block Reveal",
    "category": "code",
    "description": "Syntax-style code block with line reveal.",
    "tags": [
      "code",
      "reveal"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "code": "const title = \"Edith\";\\nrender(title);",
      "primaryColor": "#e5e7eb",
      "accentColor": "#60a5fa",
      "backgroundColor": "#111827",
      "fontSize": 34,
      "lineRevealIntervalFrames": 12
    },
    "controls": [
      {
        "key": "code",
        "label": "Code",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "lineRevealIntervalFrames",
        "label": "Line interval",
        "type": "number",
        "min": 1,
        "max": 30,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for readable code snippets that should reveal line by line while staying stable on screen.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "typing-code-block",
    "sourceBit": "bit-typing-code-block",
    "label": "Typing Code Block",
    "category": "code",
    "description": "Code appears as if typed.",
    "tags": [
      "code",
      "typewriter"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "code": "await editor.addMotionDesign();",
      "primaryColor": "#e5e7eb",
      "accentColor": "#34d399",
      "backgroundColor": "#111827",
      "fontSize": 34,
      "typingSpeed": 1
    },
    "controls": [
      {
        "key": "code",
        "label": "Code",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "typingSpeed",
        "label": "Typing speed",
        "type": "number",
        "min": 0.25,
        "max": 6,
        "step": 0.25
      }
    ],
    "source": "edith",
    "detail": "Choose when code should appear as if it is being written live during a tutorial or technical demo.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "counter-pop",
    "sourceBit": "bit-basic-counter",
    "label": "Counter Pop",
    "category": "data",
    "description": "Animated counter that pops into place.",
    "tags": [
      "counter",
      "metric"
    ],
    "defaultDurationInFrames": 110,
    "defaultProps": {
      "label": "Views",
      "endValue": 1000,
      "suffix": "+",
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "fontSize": 96
    },
    "controls": [
      {
        "key": "label",
        "label": "Label",
        "type": "text"
      },
      {
        "key": "endValue",
        "label": "Value",
        "type": "number",
        "min": 0,
        "max": 1000000,
        "step": 1
      },
      {
        "key": "suffix",
        "label": "Suffix",
        "type": "text"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for KPIs, stats, revenue, views, percentages, follower counts, or any metric that should count upward clearly.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "counter-confetti",
    "sourceBit": "bit-counter-confetti",
    "label": "Counter Confetti",
    "category": "data",
    "description": "Counter with celebratory particle burst.",
    "tags": [
      "counter",
      "confetti"
    ],
    "defaultDurationInFrames": 130,
    "defaultProps": {
      "label": "Milestone",
      "endValue": 1000,
      "suffix": "+",
      "primaryColor": "#ffffff",
      "accentColor": "#facc15",
      "fontSize": 90,
      "intensity": 1
    },
    "controls": [
      {
        "key": "label",
        "label": "Label",
        "type": "text"
      },
      {
        "key": "endValue",
        "label": "Value",
        "type": "number",
        "min": 0,
        "max": 1000000,
        "step": 1
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose for milestone metrics, launch wins, achievements, celebrations, or success moments that need extra energy.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "linear-gradient",
    "sourceBit": "bit-linear-gradient",
    "label": "Linear Gradient",
    "category": "gradient",
    "description": "Smooth linear gradient transition.",
    "tags": [
      "gradient",
      "background"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "primaryColor": "#0ea5e9",
      "accentColor": "#f97316",
      "backgroundColor": "#111827"
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for a smooth branded background, calm transition plate, or abstract full-frame color movement.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "radial-gradient",
    "sourceBit": "bit-radial-gradient",
    "label": "Radial Gradient",
    "category": "gradient",
    "description": "Radial gradient pulse transition.",
    "tags": [
      "gradient",
      "radial"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "primaryColor": "#a78bfa",
      "accentColor": "#34d399",
      "backgroundColor": "#0f172a"
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for a centered glow, spotlight, reveal around a subject, or soft emphasis behind text.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "conic-gradient",
    "sourceBit": "bit-conic-gradient",
    "label": "Conic Gradient",
    "category": "gradient",
    "description": "Rotating conic gradient wash.",
    "tags": [
      "gradient",
      "conic"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "primaryColor": "#38bdf8",
      "accentColor": "#f472b6",
      "backgroundColor": "#111827"
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for energetic circular color motion, modern abstract backgrounds, or spinning transition accents.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "gradient-wash",
    "sourceBit": "bit-linear-gradient",
    "label": "Gradient Wash",
    "category": "gradient",
    "description": "Full-frame transition wash.",
    "tags": [
      "transition",
      "gradient"
    ],
    "defaultDurationInFrames": 90,
    "defaultProps": {
      "primaryColor": "#0284c7",
      "accentColor": "#f59e0b",
      "backgroundColor": "#0f172a",
      "intensity": 1
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose for a quick full-frame transition between sections, scenes, or ideas without adding literal objects.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "particles-snow",
    "sourceBit": "bit-particles-snow",
    "label": "Falling Snow",
    "category": "particles",
    "description": "Soft falling particle field.",
    "tags": [
      "particles",
      "snow"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "primaryColor": "#e0f2fe",
      "accentColor": "#bae6fd",
      "density": 1
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "density",
        "label": "Density",
        "type": "number",
        "min": 0.2,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose for soft ambience, calm scenes, winter mood, dreamy overlays, or gentle visual texture.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "particles-fountain",
    "sourceBit": "bit-particles-fountain",
    "label": "Fountain Burst",
    "category": "particles",
    "description": "Particles burst upward from the center.",
    "tags": [
      "particles",
      "burst"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "primaryColor": "#fb923c",
      "accentColor": "#facc15",
      "density": 1,
      "intensity": 1
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose for an upward burst, reveal hit, product moment, impact beat, or energetic accent from the center.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "particles-grid",
    "sourceBit": "bit-particles-grid",
    "label": "Grid Snap Particles",
    "category": "particles",
    "description": "Dots resolve into a grid.",
    "tags": [
      "particles",
      "grid"
    ],
    "defaultDurationInFrames": 140,
    "defaultProps": {
      "primaryColor": "#93c5fd",
      "accentColor": "#c4b5fd",
      "density": 1
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for data, systems, dashboards, structure, alignment, or particles resolving into an ordered pattern.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "fireflies",
    "sourceBit": "bit-fireflies",
    "label": "Fireflies",
    "category": "particles",
    "description": "Wandering glow particles.",
    "tags": [
      "particles",
      "glow"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "primaryColor": "#fde68a",
      "accentColor": "#bef264",
      "density": 1
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for warm magical ambience, organic glow, night scenes, soft celebration, or subtle background motion.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "confetti-hit",
    "sourceBit": "bit-counter-confetti",
    "label": "Confetti Hit",
    "category": "particles",
    "description": "A compact celebratory confetti burst.",
    "tags": [
      "confetti",
      "burst"
    ],
    "defaultDurationInFrames": 90,
    "defaultProps": {
      "primaryColor": "#facc15",
      "accentColor": "#fb7185",
      "density": 1,
      "intensity": 1
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose for a short celebration burst on a button press, milestone, CTA, achievement, or reveal beat.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "particle-accent",
    "sourceBit": "bit-fireflies",
    "label": "Particle Accent",
    "category": "particles",
    "description": "Light particles around a focal point.",
    "tags": [
      "particles",
      "accent"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "primaryColor": "#93c5fd",
      "accentColor": "#f0abfc",
      "density": 0.8,
      "intensity": 0.8
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      }
    ],
    "source": "edith",
    "detail": "Choose to add light decorative motion around an existing subject without taking over the whole frame.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "flying-through-words",
    "sourceBit": "bit-flying-through-words",
    "label": "Flying Through Words",
    "category": "particles",
    "description": "Words fly past the camera.",
    "tags": [
      "words",
      "particles",
      "3d"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "text": "Design|Edit|Publish|Share",
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "fontSize": 46
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for immersive keyword clouds, fast conceptual montages, AI brainstorms, or words moving through depth.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "scrolling-columns",
    "sourceBit": "bit-scrolling-columns",
    "label": "Scrolling Columns",
    "category": "particles",
    "description": "Columns drift at different speeds.",
    "tags": [
      "columns",
      "scroll"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "primaryColor": "#1f2937",
      "accentColor": "#60a5fa",
      "backgroundColor": "#020617",
      "density": 1
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for background columns, credits-like movement, data streams, social proof lists, or repeating visual texture.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "staggered-fade-in",
    "sourceBit": "bit-staggered-fade-in",
    "label": "Staggered Fade In",
    "category": "motion",
    "description": "Elements fade in sequentially.",
    "tags": [
      "stagger",
      "fade"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "items": [
        "Plan",
        "Edit",
        "Render"
      ],
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "staggerFrames": 8
    },
    "controls": [
      {
        "key": "items",
        "label": "Items",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for a small group of items, benefits, steps, or labels that should appear one after another.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "grid-stagger",
    "sourceBit": "bit-grid-stagger",
    "label": "Grid Stagger",
    "category": "motion",
    "description": "A grid reveals from the center.",
    "tags": [
      "grid",
      "stagger"
    ],
    "defaultDurationInFrames": 120,
    "defaultProps": {
      "primaryColor": "#334155",
      "accentColor": "#38bdf8",
      "density": 1,
      "staggerFrames": 2
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for dashboards, grids, galleries, feature tiles, or any structured layout that should reveal rhythmically.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "list-reveal",
    "sourceBit": "bit-list-reveal",
    "label": "List Reveal",
    "category": "motion",
    "description": "Vertical list items find their place.",
    "tags": [
      "list",
      "stagger"
    ],
    "defaultDurationInFrames": 140,
    "defaultProps": {
      "items": [
        "Cut silence",
        "Add captions",
        "Export"
      ],
      "primaryColor": "#ffffff",
      "accentColor": "#34d399",
      "staggerFrames": 8
    },
    "controls": [
      {
        "key": "items",
        "label": "Items",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for checklists, process steps, takeaways, todo lists, or stacked points that need clean vertical sequencing.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "easings-visualizer",
    "sourceBit": "bit-easings-visualizer",
    "label": "Easings Visualizer",
    "category": "motion",
    "description": "Sliding bars compare easing curves.",
    "tags": [
      "easing",
      "motion"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "primaryColor": "#60a5fa",
      "accentColor": "#f59e0b",
      "backgroundColor": "#0f172a",
      "staggerFrames": 2
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for explaining animation, speed curves, timing, performance, or comparing movement styles.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "fracture-reassemble",
    "sourceBit": "bit-fracture-reassemble",
    "label": "Fracture Reassemble",
    "category": "motion",
    "description": "Tiles fracture and reassemble.",
    "tags": [
      "fracture",
      "transition"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "primaryColor": "#64748b",
      "accentColor": "#f97316",
      "backgroundColor": "#111827",
      "intensity": 1,
      "staggerFrames": 2
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "intensity",
        "label": "Intensity",
        "type": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for dramatic transition moments where a frame, topic, or visual idea breaks apart and reforms.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "mosaic-reframe",
    "sourceBit": "bit-mosaic-reframe",
    "label": "Mosaic Reframe",
    "category": "motion",
    "description": "Tiles morph into a feature mosaic.",
    "tags": [
      "mosaic",
      "grid"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "primaryColor": "#334155",
      "accentColor": "#38bdf8",
      "backgroundColor": "#020617",
      "staggerFrames": 2
    },
    "controls": [
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for multi-tile reveals, collage moments, feature mosaics, or reframing several ideas into one composition.",
    "defaultBox": "full-frame",
    "supportsEffects": false
  },
  {
    "id": "card-stack-3d",
    "sourceBit": "bit-card-stack",
    "label": "3D Card Stack",
    "category": "3d",
    "description": "A stack of cards spreads in 3D space.",
    "tags": [
      "cards",
      "3d"
    ],
    "defaultDurationInFrames": 140,
    "defaultProps": {
      "items": [
        "Hook",
        "Story",
        "CTA"
      ],
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "backgroundColor": "#111827",
      "staggerFrames": 8
    },
    "controls": [
      {
        "key": "items",
        "label": "Cards",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for stacked concepts, cards, chapters, product features, or storytelling beats with depth.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "basic-3d-scene",
    "sourceBit": "bit-3d-basic",
    "label": "Basic 3D Scene",
    "category": "3d",
    "description": "Camera-like 3D scene transition.",
    "tags": [
      "3d",
      "scene"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "text": "Scene depth",
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "backgroundColor": "#0f172a"
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for a simple depth-based scene intro when the user asks for a 3D feel without specific objects.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "elements-3d-scene",
    "sourceBit": "bit-3d-elements",
    "label": "3D Elements Scene",
    "category": "3d",
    "description": "Elements placed in 3D space.",
    "tags": [
      "3d",
      "elements"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "items": [
        "A",
        "B",
        "C"
      ],
      "primaryColor": "#ffffff",
      "accentColor": "#a78bfa",
      "backgroundColor": "#111827",
      "staggerFrames": 8
    },
    "controls": [
      {
        "key": "items",
        "label": "Elements",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for several elements floating in depth, such as labels, tokens, icons, or conceptual building blocks.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "carousel-3d",
    "sourceBit": "bit-carousel-3d",
    "label": "3D Carousel",
    "category": "3d",
    "description": "Cards rotate around a carousel.",
    "tags": [
      "3d",
      "carousel"
    ],
    "defaultDurationInFrames": 160,
    "defaultProps": {
      "items": [
        "One",
        "Two",
        "Three",
        "Four"
      ],
      "primaryColor": "#ffffff",
      "accentColor": "#f59e0b",
      "backgroundColor": "#0f172a",
      "staggerFrames": 8
    },
    "controls": [
      {
        "key": "items",
        "label": "Cards",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for rotating through cards, options, testimonials, features, products, or examples in a compact 3D layout.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "cube-navigation-3d",
    "sourceBit": "bit-scene-3d-cube-nav",
    "label": "Cube Navigation",
    "category": "3d",
    "description": "Cube-face navigation movement.",
    "tags": [
      "3d",
      "cube"
    ],
    "defaultDurationInFrames": 160,
    "defaultProps": {
      "items": [
        "North",
        "East",
        "South",
        "West"
      ],
      "primaryColor": "#ffffff",
      "accentColor": "#34d399",
      "backgroundColor": "#111827",
      "staggerFrames": 8
    },
    "controls": [
      {
        "key": "items",
        "label": "Faces",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for directional navigation, multiple sections, app screens, chapters, or cube-like scene changes.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "cursor-flyover",
    "sourceBit": "bit-cursor-flyover",
    "label": "Cursor Flyover",
    "category": "3d",
    "description": "Cursor highlights regions during a flyover.",
    "tags": [
      "cursor",
      "3d"
    ],
    "defaultDurationInFrames": 150,
    "defaultProps": {
      "text": "Focus area",
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "backgroundColor": "#111827"
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for product demos, UI walkthroughs, focus highlights, and moments where a cursor should guide attention.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "ken-burns",
    "sourceBit": "bit-ken-burns",
    "label": "Ken Burns",
    "category": "3d",
    "description": "Slow camera push over visual content.",
    "tags": [
      "photo",
      "camera"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "text": "Slow push",
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "backgroundColor": "#020617"
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for slow photo-like push, calm emphasis, documentary pacing, or giving static content camera movement.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "step-timing-context",
    "sourceBit": "bit-3d-step-timing-context",
    "label": "Step Timing Context",
    "category": "3d",
    "description": "Step-aware motion timing showcase.",
    "tags": [
      "3d",
      "timing"
    ],
    "defaultDurationInFrames": 160,
    "defaultProps": {
      "items": [
        "Step 1",
        "Step 2",
        "Step 3"
      ],
      "primaryColor": "#ffffff",
      "accentColor": "#c084fc",
      "backgroundColor": "#111827",
      "staggerFrames": 8
    },
    "controls": [
      {
        "key": "items",
        "label": "Steps",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "staggerFrames",
        "label": "Stagger frames",
        "type": "number",
        "min": 0,
        "max": 24,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for explaining a step-by-step process where timing and progression matter visually.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "terminal-3d",
    "sourceBit": "bit-terminal-3d",
    "label": "3D Terminal",
    "category": "3d",
    "description": "Layered terminal windows in depth.",
    "tags": [
      "terminal",
      "3d"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "commandLines": [
        "git status",
        "pnpm render",
        "done"
      ],
      "primaryColor": "#d1fae5",
      "accentColor": "#34d399",
      "backgroundColor": "#020617",
      "fontSize": 34,
      "typingSpeed": 1
    },
    "controls": [
      {
        "key": "commandLines",
        "label": "Commands",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      },
      {
        "key": "typingSpeed",
        "label": "Typing speed",
        "type": "number",
        "min": 0.25,
        "max": 6,
        "step": 0.25
      }
    ],
    "source": "edith",
    "detail": "Choose for layered terminal windows, developer demos, infra topics, logs, or technical command sequences with depth.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "transform3d-showcase",
    "sourceBit": "bit-transform3d-showcase",
    "label": "Transform3D Showcase",
    "category": "3d",
    "description": "Matrix-like 3D transform showcase.",
    "tags": [
      "3d",
      "transform"
    ],
    "defaultDurationInFrames": 170,
    "defaultProps": {
      "text": "Transform",
      "primaryColor": "#ffffff",
      "accentColor": "#f472b6",
      "backgroundColor": "#0f172a"
    },
    "controls": [
      {
        "key": "text",
        "label": "Text",
        "type": "textarea"
      },
      {
        "key": "primaryColor",
        "label": "Text color",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "fontSize",
        "label": "Size",
        "type": "number",
        "min": 16,
        "max": 220,
        "step": 1
      }
    ],
    "source": "edith",
    "detail": "Choose for showcasing 3D transforms, spatial movement, technical motion design, or matrix-like rotations.",
    "defaultBox": "center",
    "supportsEffects": false
  },
  {
    "id": "remotion-bits-promo",
    "sourceBit": "bit-remotion-bits-promo",
    "label": "Remotion Bits Promo",
    "category": "showcase",
    "description": "Compact showcase of motion primitives.",
    "tags": [
      "showcase",
      "promo"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "text": "Motion design",
      "secondaryText": "Powered by Remotion",
      "primaryColor": "#ffffff",
      "accentColor": "#38bdf8",
      "backgroundColor": "#111827"
    },
    "controls": [
      {
        "key": "text",
        "label": "Title",
        "type": "text"
      },
      {
        "key": "secondaryText",
        "label": "Subtitle",
        "type": "text"
      },
      {
        "key": "primaryColor",
        "label": "Primary",
        "type": "color"
      },
      {
        "key": "accentColor",
        "label": "Accent",
        "type": "color"
      },
      {
        "key": "backgroundColor",
        "label": "Background",
        "type": "color"
      }
    ],
    "source": "edith",
    "detail": "Choose for a compact montage that showcases multiple motion primitives, intros, outros, or meta motion-design demos.",
    "defaultBox": "center",
    "supportsEffects": false
  }
] as const satisfies readonly MotionDesignTemplate[];

export const legacyMotionDesignTemplateAgentDescriptions = {
  "blur-word-title": "Choose for a polished hero title, chapter opener, or short important phrase that should feel cinematic and premium.",
  "fade-in-text": "Choose for the safest readable text overlay when the user asks for something subtle, clean, minimal, or non-distracting.",
  "word-by-word": "Choose for quotes, hooks, punchlines, or educational text where each word should land with spoken pacing.",
  "character-by-character": "Choose for short labels, passwords, tech words, or reveals that should feel precise and mechanical.",
  "slide-from-left": "Choose for a title, label, or annotation that should enter from the edge and point attention into the frame.",
  "glitch-in": "Choose for cyber, AI, hacking, digital error, signal lock, or high-energy tech reveals.",
  "glitch-cycle": "Choose when several short phrases should rotate through the same position with a digital glitch transition.",
  "matrix-rain": "Choose as a background texture for coding, cybersecurity, AI, data, or futuristic scenes; keep foreground text readable.",
  "lower-third-slide": "Choose for speaker names, roles, interview identifiers, guest introductions, and professional lower-third overlays.",
  "basic-typewriter": "Choose for one sentence or thought that should appear as typed text with a simple cursor.",
  "cli-simulation": "Choose for terminal commands, build logs, developer workflows, install steps, or command-line storytelling.",
  "multitext-typewriter": "Choose when multiple phrases should type one after another, such as benefits, alternatives, or quick examples.",
  "variable-speed-typewriter": "Choose for a typewriter effect that should feel less robotic and more like human typing rhythm.",
  "basic-code-block": "Choose for readable code snippets that should reveal line by line while staying stable on screen.",
  "typing-code-block": "Choose when code should appear as if it is being written live during a tutorial or technical demo.",
  "counter-pop": "Choose for KPIs, stats, revenue, views, percentages, follower counts, or any metric that should count upward clearly.",
  "counter-confetti": "Choose for milestone metrics, launch wins, achievements, celebrations, or success moments that need extra energy.",
  "linear-gradient": "Choose for a smooth branded background, calm transition plate, or abstract full-frame color movement.",
  "radial-gradient": "Choose for a centered glow, spotlight, reveal around a subject, or soft emphasis behind text.",
  "conic-gradient": "Choose for energetic circular color motion, modern abstract backgrounds, or spinning transition accents.",
  "gradient-wash": "Choose for a quick full-frame transition between sections, scenes, or ideas without adding literal objects.",
  "particles-snow": "Choose for soft ambience, calm scenes, winter mood, dreamy overlays, or gentle visual texture.",
  "particles-fountain": "Choose for an upward burst, reveal hit, product moment, impact beat, or energetic accent from the center.",
  "particles-grid": "Choose for data, systems, dashboards, structure, alignment, or particles resolving into an ordered pattern.",
  "fireflies": "Choose for warm magical ambience, organic glow, night scenes, soft celebration, or subtle background motion.",
  "confetti-hit": "Choose for a short celebration burst on a button press, milestone, CTA, achievement, or reveal beat.",
  "particle-accent": "Choose to add light decorative motion around an existing subject without taking over the whole frame.",
  "flying-through-words": "Choose for immersive keyword clouds, fast conceptual montages, AI brainstorms, or words moving through depth.",
  "scrolling-columns": "Choose for background columns, credits-like movement, data streams, social proof lists, or repeating visual texture.",
  "staggered-fade-in": "Choose for a small group of items, benefits, steps, or labels that should appear one after another.",
  "grid-stagger": "Choose for dashboards, grids, galleries, feature tiles, or any structured layout that should reveal rhythmically.",
  "list-reveal": "Choose for checklists, process steps, takeaways, todo lists, or stacked points that need clean vertical sequencing.",
  "easings-visualizer": "Choose for explaining animation, speed curves, timing, performance, or comparing movement styles.",
  "fracture-reassemble": "Choose for dramatic transition moments where a frame, topic, or visual idea breaks apart and reforms.",
  "mosaic-reframe": "Choose for multi-tile reveals, collage moments, feature mosaics, or reframing several ideas into one composition.",
  "card-stack-3d": "Choose for stacked concepts, cards, chapters, product features, or storytelling beats with depth.",
  "basic-3d-scene": "Choose for a simple depth-based scene intro when the user asks for a 3D feel without specific objects.",
  "elements-3d-scene": "Choose for several elements floating in depth, such as labels, tokens, icons, or conceptual building blocks.",
  "carousel-3d": "Choose for rotating through cards, options, testimonials, features, products, or examples in a compact 3D layout.",
  "cube-navigation-3d": "Choose for directional navigation, multiple sections, app screens, chapters, or cube-like scene changes.",
  "cursor-flyover": "Choose for product demos, UI walkthroughs, focus highlights, and moments where a cursor should guide attention.",
  "ken-burns": "Choose for slow photo-like push, calm emphasis, documentary pacing, or giving static content camera movement.",
  "step-timing-context": "Choose for explaining a step-by-step process where timing and progression matter visually.",
  "terminal-3d": "Choose for layered terminal windows, developer demos, infra topics, logs, or technical command sequences with depth.",
  "transform3d-showcase": "Choose for showcasing 3D transforms, spatial movement, technical motion design, or matrix-like rotations.",
  "remotion-bits-promo": "Choose for a compact montage that showcases multiple motion primitives, intros, outros, or meta motion-design demos."
} as const satisfies Record<MotionDesignTemplateId, string>;
