/* Auto-generated from the existing Framedeck registry and Motion Studio source metadata. */
import type { MotionDesignEffectDefinition, MotionDesignTemplate } from './types';

export const motionStudioMotionDesignTemplates = [
  {
    "id": "ms-gaia-scenario",
    "source": "motion-studio",
    "motionStudioId": "GaiaScenario",
    "sourceBit": "GaiaScenario",
    "label": "GAIA",
    "category": "gaia",
    "description": "Render a GAIA chat scenario from JSON. Fills the parent canvas at any size.",
    "detail": "Render a GAIA chat scenario from JSON. Fills the parent canvas at any size. Motion Studio scene ID: GaiaScenario. Native canvas: 1920x1080 at 60fps for 1344 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Header label); theme: select (Theme); backgroundColor: color (Background color); padding: number (Padding); borderRadius: number (Border radius); scale: number (Chat scale); userAvatarUrl: image (User avatar); botAvatarUrl: image (Bot avatar (GAIA logo)); toolCallsExpanded: select (Tool calls expanded); scenarioJson: scenario (States); advanced: section (JSON). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "gaia",
      "gaia-scenario"
    ],
    "defaultDurationInFrames": 1344,
    "defaultProps": {
      "title": "",
      "theme": "dark",
      "backgroundColor": "",
      "padding": 32,
      "borderRadius": 0,
      "scale": 2.5,
      "userAvatarUrl": "https://avatars.githubusercontent.com/aryanranderiya?s=200",
      "botAvatarUrl": "/images/logos/logo.webp",
      "toolCallsExpanded": "true",
      "scenarioJson": "{\n  \"id\": \"power-morning-briefing\",\n  \"title\": \"Power Morning Briefing — Full Overview\",\n  \"viewport\": {\n    \"width\": 390,\n    \"height\": 844\n  },\n  \"settings\": {\n    \"theme\": \"dark\"\n  },\n  \"states\": [\n    {\n      \"type\": \"user_message\",\n      \"text\": \"Good morning. What do I need to know today?\",\n      \"typingSpeed\": 50,\n      \"pauseAfter\": 600\n    },\n    {\n      \"type\": \"loading\",\n      \"text\": \"Preparing your briefing...\",\n      \"toolInfo\": {\n        \"toolCategory\": \"general\",\n        \"showCategory\": false\n      },\n      \"duration\": 1000,\n      \"pauseAfter\": 100\n    },\n    {\n      \"type\": \"loading\",\n      \"text\": \"Checking today's schedule...\",\n      \"toolInfo\": {\n        \"toolCategory\": \"google_calendar\",\n        \"showCategory\": true\n      },\n      \"duration\": 1200,\n      \"pauseAfter\": 150\n    },\n    {\n      \"type\": \"tool_calls\",\n      \"entries\": [\n        {\n          \"tool_name\": \"tool_calls_data\",\n          \"tool_category\": \"google_calendar\",\n          \"data\": [\n            {\n              \"tool_name\": \"google_calendar_today\",\n              \"tool_category\": \"google_calendar\",\n              \"message\": \"Retrieved 4 events for Thursday March 13\",\n              \"inputs\": {\n                \"date\": \"2026-03-13\",\n                \"calendars\": [\n                  \"primary\",\n                  \"work\"\n                ]\n              },\n              \"output\": \"4 events today: 9:30am Team standup (30 min), 11:00am Client call with Acme Corp (45 min, Google Meet), 2:00pm Design review (1 hr, Conf Room B), 4:00pm 1:1 with Sarah (30 min). 2 hours of focus time available: 12pm-2pm.\"\n            }\n          ],\n          \"timestamp\": null\n        }\n      ],\n      \"pauseAfter\": 300\n    },\n    {\n      \"type\": \"loading\",\n      \"text\": \"Reviewing your tasks...\",\n      \"toolInfo\": {\n        \"toolCategory\": \"todoist\",\n        \"showCategory\": true\n      },\n      \"duration\": 1100,\n      \"pauseAfter\": 150\n    },\n    {\n      \"type\": \"tool_calls\",\n      \"entries\": [\n        {\n          \"tool_name\": \"tool_calls_data\",\n          \"tool_category\": \"todoist\",\n          \"data\": [\n            {\n              \"tool_name\": \"todoist_today\",\n              \"tool_category\": \"todoist\",\n              \"message\": \"Found 5 tasks due today, 1 overdue from yesterday\",\n              \"inputs\": {\n                \"filter\": \"today | overdue\",\n                \"include_priority\": true\n              },\n              \"output\": \"5 tasks due today: Finalize pricing proposal (high), review Alex's PR (high), update roadmap doc (medium), send weekly metrics (medium), order team lunch for Friday (low). 1 overdue from yesterday: respond to investor email.\"\n            }\n          ],\n          \"timestamp\": null\n        }\n      ],\n      \"pauseAfter\": 300\n    },\n    {\n      \"type\": \"loading\",\n      \"text\": \"Scanning your inbox...\",\n      \"toolInfo\": {\n        \"toolCategory\": \"gmail\",\n        \"showCategory\": true\n      },\n      \"duration\": 1200,\n      \"pauseAfter\": 150\n    },\n    {\n      \"type\": \"tool_calls\",\n      \"entries\": [\n        {\n          \"tool_name\": \"tool_calls_data\",\n          \"tool_category\": \"gmail\",\n          \"data\": [\n            {\n              \"tool_name\": \"gmail_inbox_scan\",\n              \"tool_category\": \"gmail\",\n              \"message\": \"Scanned 12 new emails, flagged 2 as urgent\",\n              \"inputs\": {\n                \"filter\": \"is:unread newer_than:12h\",\n                \"categorize\": true\n              },\n              \"output\": \"12 new emails since last night. Urgent: 1) CFO Rachel Kim needs Q1 budget approval by noon today — sent at 7:15am. 2) Board member David Park requesting investor update deck by Friday. Also: 3 PR review notifications, 2 newsletters, 4 automated alerts, 1 team thread.\"\n            }\n          ],\n          \"timestamp\": null\n        }\n      ],\n      \"pauseAfter\": 300\n    },\n    {\n      \"type\": \"loading\",\n      \"text\": \"Getting relevant news...\",\n      \"toolInfo\": {\n        \"toolCategory\": \"search\",\n        \"showCategory\": true\n      },\n      \"duration\": 1000,\n      \"pauseAfter\": 100\n    },\n    {\n      \"type\": \"tool_calls\",\n      \"entries\": [\n        {\n          \"tool_name\": \"tool_calls_data\",\n          \"tool_category\": \"search\",\n          \"data\": [\n            {\n              \"tool_name\": \"web_search\",\n              \"tool_category\": \"search\",\n              \"message\": \"Found 2 relevant industry news items\",\n              \"inputs\": {\n                \"query\": \"AI assistant startup funding news March 2026\",\n                \"recency\": \"24h\"\n              },\n              \"output\": \"1) Competitor Nexus AI raised $50M Series B led by Sequoia — announced this morning. Valued at $400M. 2) Gartner published 2026 AI Assistant Magic Quadrant — your category growing 34% YoY.\"\n            }\n          ],\n          \"timestamp\": null\n        }\n      ],\n      \"pauseAfter\": 1500\n    },\n    {\n      \"type\": \"bot_message\",\n      \"text\": \"Good morning! Here's your **Thursday briefing**.\\n\\n**Weather**: 62°F, partly cloudy. Rain expected after 5pm — grab an umbrella.\\n\\n**Today's schedule** — 4 meetings:\\n- **9:30am** Team standup\\n- **11:00am** Client call with Acme Corp\\n- **2:00pm** Design review\\n- **4:00pm** 1:1 with Sarah\\n\\n**Priority tasks** (5 due today):\\nFinalize pricing proposal (high), review Alex's PR (high), update roadmap doc (medium), send weekly metrics (medium), order team lunch for Friday (low).\\n\\n**Inbox highlights:**\\n12 new emails. **Urgent**: CFO Rachel needs budget approval by noon. Board member David Park requesting investor update by Friday.\\n\\n**Relevant news:**\\nYour competitor Nexus AI just raised $50M Series B — worth discussing in the design review.\\n\\nBiggest priority: **Get that budget approval to Rachel before your 11am call.**\",\n      \"streamingSpeed\": 5,\n      \"tool_data\": [\n        {\n          \"tool_name\": \"calendar_options\",\n          \"tool_category\": \"google_calendar\",\n          \"data\": [\n            {\n              \"summary\": \"Team Standup\",\n              \"start\": \"2026-03-13T09:30:00\",\n              \"end\": \"2026-03-13T10:00:00\",\n              \"description\": \"Daily team standup. Share blockers and priorities for the day.\",\n              \"attendees\": [\n                \"team@company.com\"\n              ]\n            },\n            {\n              \"summary\": \"Client Call — Acme Corp\",\n              \"start\": \"2026-03-13T11:00:00\",\n              \"end\": \"2026-03-13T11:45:00\",\n              \"description\": \"Quarterly check-in with Sarah Chen and Mike Torres. Review contract renewal and expansion opportunity.\",\n              \"attendees\": [\n                \"sarah.chen@acmecorp.com\",\n                \"mike.torres@acmecorp.com\"\n              ]\n            },\n            {\n              \"summary\": \"Design Review — v2.0 Features\",\n              \"start\": \"2026-03-13T14:00:00\",\n              \"end\": \"2026-03-13T15:00:00\",\n              \"description\": \"Review design mocks for v2.0 dashboard, mobile app onboarding, and notification preferences.\",\n              \"attendees\": [\n                \"design@company.com\",\n                \"product@company.com\"\n              ]\n            },\n            {\n              \"summary\": \"1:1 with Sarah\",\n              \"start\": \"2026-03-13T16:00:00\",\n              \"end\": \"2026-03-13T16:30:00\",\n              \"description\": \"Weekly sync with Sarah. Topics: Q2 hiring plan, project Phoenix timeline, team feedback.\",\n              \"attendees\": [\n                \"sarah@company.com\"\n              ]\n            }\n          ],\n          \"timestamp\": null\n        },\n        {\n          \"tool_name\": \"todo_data\",\n          \"tool_category\": \"todoist\",\n          \"data\": {\n            \"action\": \"list\",\n            \"todos\": [\n              {\n                \"id\": \"mb1\",\n                \"title\": \"Finalize pricing proposal for enterprise tier\",\n                \"completed\": false,\n                \"priority\": \"high\",\n                \"due_date\": \"2026-03-13\",\n                \"labels\": [\n                  \"sales\",\n                  \"urgent\"\n                ],\n                \"subtasks\": [],\n                \"created_at\": \"2026-03-10T09:00:00Z\",\n                \"updated_at\": \"2026-03-12T16:00:00Z\"\n              },\n              {\n                \"id\": \"mb2\",\n                \"title\": \"Review Alex's PR #247 — auth middleware refactor\",\n                \"completed\": false,\n                \"priority\": \"high\",\n                \"due_date\": \"2026-03-13\",\n                \"labels\": [\n                  \"engineering\",\n                  \"review\"\n                ],\n                \"subtasks\": [],\n                \"created_at\": \"2026-03-12T11:00:00Z\",\n                \"updated_at\": \"2026-03-12T11:00:00Z\"\n              },\n              {\n                \"id\": \"mb3\",\n                \"title\": \"Update Q2 product roadmap doc\",\n                \"completed\": false,\n                \"priority\": \"medium\",\n                \"due_date\": \"2026-03-13\",\n                \"labels\": [\n                  \"product\",\n                  \"planning\"\n                ],\n                \"subtasks\": [],\n                \"created_at\": \"2026-03-09T14:00:00Z\",\n                \"updated_at\": \"2026-03-11T10:00:00Z\"\n              },\n              {\n                \"id\": \"mb4\",\n                \"title\": \"Send weekly metrics dashboard to leadership\",\n                \"completed\": false,\n                \"priority\": \"medium\",\n                \"due_date\": \"2026-03-13\",\n                \"labels\": [\n                  \"reporting\"\n                ],\n                \"subtasks\": [],\n                \"created_at\": \"2026-03-06T09:00:00Z\",\n                \"updated_at\": \"2026-03-06T09:00:00Z\"\n              },\n              {\n                \"id\": \"mb5\",\n                \"title\": \"Order team lunch for Friday all-hands\",\n                \"completed\": false,\n                \"priority\": \"low\",\n                \"due_date\": \"2026-03-13\",\n                \"labels\": [\n                  \"team\",\n                  \"admin\"\n                ],\n                \"subtasks\": [],\n                \"created_at\": \"2026-03-11T15:00:00Z\",\n                \"updated_at\": \"2026-03-11T15:00:00Z\"\n              },\n              {\n                \"id\": \"mb6\",\n                \"title\": \"Respond to investor email from David Park\",\n                \"completed\": false,\n                \"priority\": \"high\",\n                \"due_date\": \"2026-03-12\",\n                \"labels\": [\n                  \"investors\",\n                  \"overdue\"\n                ],\n                \"subtasks\": [],\n                \"created_at\": \"2026-03-11T08:00:00Z\",\n                \"updated_at\": \"2026-03-11T08:00:00Z\"\n              }\n            ],\n            \"stats\": {\n              \"total\": 6,\n              \"completed\": 0,\n              \"pending\": 6,\n              \"overdue\": 1,\n              \"today\": 5,\n              \"upcoming\": 0\n            }\n          },\n          \"timestamp\": null\n        },\n        {\n          \"tool_name\": \"search_results\",\n          \"tool_category\": \"search\",\n          \"data\": {\n            \"results\": [\n              {\n                \"title\": \"Nexus AI Raises $50M Series B Led by Sequoia Capital\",\n                \"url\": \"https://techcrunch.com/2026/03/13/nexus-ai-series-b\",\n                \"snippet\": \"AI assistant startup Nexus AI announced a $50M Series B at a $400M valuation. The round was led by Sequoia Capital with participation from a16z. The company plans to expand into enterprise market with new agent capabilities.\"\n              },\n              {\n                \"title\": \"Gartner 2026 AI Assistant Magic Quadrant Published\",\n                \"url\": \"https://gartner.com/reviews/market/ai-assistants-2026\",\n                \"snippet\": \"The AI personal assistant market is projected to grow 34% YoY to $12.8B by end of 2026. Key trends: proactive intelligence, multi-modal interaction, and deep enterprise integrations driving adoption.\"\n              }\n            ]\n          },\n          \"timestamp\": null\n        }\n      ],\n      \"follow_up_actions\": [\n        \"Block prep time for Acme call\",\n        \"Handle budget approval now\",\n        \"Show full inbox\",\n        \"Deep dive on competitor news\"\n      ],\n      \"pauseAfter\": 5000\n    }\n  ]\n}"
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Header label",
        "placeholder": "Optional small header above the chat",
        "type": "text"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "dark",
            "label": "Dark"
          },
          {
            "value": "light",
            "label": "Light"
          }
        ],
        "type": "select"
      },
      {
        "kind": "color",
        "key": "backgroundColor",
        "label": "Background color",
        "type": "color"
      },
      {
        "kind": "number",
        "key": "padding",
        "label": "Padding",
        "min": 0,
        "max": 200,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "borderRadius",
        "label": "Border radius",
        "min": 0,
        "max": 200,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "scale",
        "label": "Chat scale",
        "min": 1,
        "max": 5,
        "type": "number"
      },
      {
        "kind": "image",
        "key": "userAvatarUrl",
        "label": "User avatar",
        "placeholder": "https://avatars.githubusercontent.com/aryanranderiya?s=200",
        "type": "image"
      },
      {
        "kind": "image",
        "key": "botAvatarUrl",
        "label": "Bot avatar (GAIA logo)",
        "placeholder": "/images/logos/logo.webp",
        "type": "image"
      },
      {
        "kind": "select",
        "key": "toolCallsExpanded",
        "label": "Tool calls expanded",
        "options": [
          {
            "value": "true",
            "label": "Yes (default)"
          },
          {
            "value": "false",
            "label": "No (collapsed)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "scenario",
        "key": "scenarioJson",
        "label": "States",
        "type": "scenario"
      },
      {
        "kind": "section",
        "key": "advanced",
        "label": "JSON",
        "defaultOpen": false,
        "fields": [
          {
            "kind": "textarea",
            "key": "scenarioJson",
            "label": "Scenario JSON",
            "rows": 24
          }
        ],
        "type": "section"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-title-slide-up",
    "source": "motion-studio",
    "motionStudioId": "TitleSlideUp",
    "sourceBit": "TitleSlideUp",
    "label": "Slide Up",
    "category": "text",
    "description": "An Apple-style intro: a bold headline that rises from a baseline word-by-word, with an optional subtitle that fades in below.",
    "detail": "An Apple-style intro: a bold headline that rises from a baseline word-by-word, with an optional subtitle that fades in below. Motion Studio scene ID: TitleSlideUp. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "title-slide-up"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Designed in California",
      "subtitle": "Assembled with care"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-title-type",
    "source": "motion-studio",
    "motionStudioId": "TitleType",
    "sourceBit": "TitleType",
    "label": "Typewriter",
    "category": "text",
    "description": "A monospaced typewriter intro: characters reveal one at a time with a blinking caret, ending with an optional subtitle that fades in below.",
    "detail": "A monospaced typewriter intro: characters reveal one at a time with a blinking caret, ending with an optional subtitle that fades in below. Motion Studio scene ID: TitleType. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "title-type"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "hello, world.",
      "subtitle": "now typing live"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-title-popup",
    "source": "motion-studio",
    "motionStudioId": "TitlePopup",
    "sourceBit": "TitlePopup",
    "label": "Pop In",
    "category": "text",
    "description": "A punchy spring-driven title: the headline scales and bounces in as a single unit. Best for short, high-impact one-liners.",
    "detail": "A punchy spring-driven title: the headline scales and bounces in as a single unit. Best for short, high-impact one-liners. Motion Studio scene ID: TitlePopup. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "title-popup"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Boom.",
      "subtitle": "Just like that."
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-title-fade",
    "source": "motion-studio",
    "motionStudioId": "TitleFade",
    "sourceBit": "TitleFade",
    "label": "Fade In",
    "category": "text",
    "description": "The simplest, most restrained intro: the headline fades up and the subtitle follows. Reach for this when the words should do the work.",
    "detail": "The simplest, most restrained intro: the headline fades up and the subtitle follows. Reach for this when the words should do the work. Motion Studio scene ID: TitleFade. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "title-fade"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Quietly perfect",
      "subtitle": "No fanfare needed"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-typing-search",
    "source": "motion-studio",
    "motionStudioId": "TypingSearch",
    "sourceBit": "TypingSearch",
    "label": "Typing Search",
    "category": "chat",
    "description": "A search bar that types out a query character-by-character, then a mouse cursor flies in and clicks the search button.",
    "detail": "A search bar that types out a query character-by-character, then a mouse cursor flies in and clicks the search button. Motion Studio scene ID: TypingSearch. Native canvas: 1920x1080 at 60fps for 200 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: query: text (Query); placeholder: text (Placeholder). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "typing-search"
    ],
    "defaultDurationInFrames": 200,
    "defaultProps": {
      "query": "best new tech of 2025",
      "placeholder": "Search the web…"
    },
    "controls": [
      {
        "kind": "text",
        "key": "query",
        "label": "Query",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "placeholder",
        "label": "Placeholder",
        "type": "text"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-typing-composer",
    "source": "motion-studio",
    "motionStudioId": "TypingComposer",
    "sourceBit": "TypingComposer",
    "label": "Typing Composer",
    "category": "chat",
    "description": "A GAIA-style chat composer that types out a prompt character-by-character, then a mouse cursor flies in and clicks the send button.",
    "detail": "A GAIA-style chat composer that types out a prompt character-by-character, then a mouse cursor flies in and clicks the send button. Motion Studio scene ID: TypingComposer. Native canvas: 1920x1080 at 60fps for 260 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: query: text (Query); placeholder: text (Placeholder). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "typing-composer"
    ],
    "defaultDurationInFrames": 260,
    "defaultProps": {
      "query": "Plan a 3-day trip to Tokyo with a $2000 budget",
      "placeholder": "What can I do for you today? (Type '/' for tools)"
    },
    "controls": [
      {
        "kind": "text",
        "key": "query",
        "label": "Query",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "placeholder",
        "label": "Placeholder",
        "type": "text"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-cursor-walkthrough",
    "source": "motion-studio",
    "motionStudioId": "CursorWalkthrough",
    "sourceBit": "CursorWalkthrough",
    "label": "Cursor Walkthrough",
    "category": "frames",
    "description": "A cursor that demonstrates a click → type → click flow over a screenshot. Drop in a background image and pin the click coordinates.",
    "detail": "A cursor that demonstrates a click → type → click flow over a screenshot. Drop in a background image and pin the click coordinates. Motion Studio scene ID: CursorWalkthrough. Native canvas: 1920x1080 at 60fps for 280 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: backgroundImageUrl: text (Background image URL); firstClickX: number (First click X); firstClickY: number (First click Y); firstClickLabel: text (First click label); inputText: text (Text to type); secondClickX: number (Second click X); secondClickY: number (Second click Y); secondClickLabel: text (Second click label). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "frames",
      "cursor-walkthrough"
    ],
    "defaultDurationInFrames": 280,
    "defaultProps": {
      "backgroundImageUrl": "",
      "firstClickX": 720,
      "firstClickY": 480,
      "firstClickLabel": "Open the search",
      "inputText": "best new tech of 2025",
      "secondClickX": 1280,
      "secondClickY": 720,
      "secondClickLabel": "Hit search"
    },
    "controls": [
      {
        "kind": "text",
        "key": "backgroundImageUrl",
        "label": "Background image URL",
        "type": "text"
      },
      {
        "kind": "number",
        "key": "firstClickX",
        "label": "First click X",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "firstClickY",
        "label": "First click Y",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "text",
        "key": "firstClickLabel",
        "label": "First click label",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "inputText",
        "label": "Text to type",
        "type": "text"
      },
      {
        "kind": "number",
        "key": "secondClickX",
        "label": "Second click X",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "secondClickY",
        "label": "Second click Y",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "text",
        "key": "secondClickLabel",
        "label": "Second click label",
        "type": "text"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-browser-window",
    "source": "motion-studio",
    "motionStudioId": "BrowserWindow",
    "sourceBit": "BrowserWindow",
    "label": "Browser Window",
    "category": "frames",
    "description": "A Mac-style browser frame. The URL types into the address bar, then your page content fades in below.",
    "detail": "A Mac-style browser frame. The URL types into the address bar, then your page content fades in below. Motion Studio scene ID: BrowserWindow. Native canvas: 1920x1080 at 60fps for 130 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: url: text (URL); pageImageUrl: text (Page screenshot URL); pageBackgroundColor: text (Page background color). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "frames",
      "browser-window"
    ],
    "defaultDurationInFrames": 130,
    "defaultProps": {
      "url": "https://aesthetic.dev",
      "pageImageUrl": "",
      "pageBackgroundColor": "#fafafa"
    },
    "controls": [
      {
        "kind": "text",
        "key": "url",
        "label": "URL",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "pageImageUrl",
        "label": "Page screenshot URL",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "pageBackgroundColor",
        "label": "Page background color",
        "type": "text"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-caption-track",
    "source": "motion-studio",
    "motionStudioId": "CaptionTrack",
    "sourceBit": "CaptionTrack",
    "label": "Caption Track",
    "category": "frames",
    "description": "Word-by-word caption track. Each word springs into place at the configured cadence — set the words-per-second to match your VO.",
    "detail": "Word-by-word caption track. Each word springs into place at the configured cadence — set the words-per-second to match your VO. Motion Studio scene ID: CaptionTrack. Native canvas: 1920x1080 at 60fps for 160 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: text: textarea (Caption text); wordsPerSecond: number (Words per second). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "frames",
      "caption-track"
    ],
    "defaultDurationInFrames": 160,
    "defaultProps": {
      "text": "this is the future of motion graphics",
      "wordsPerSecond": 3
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "text",
        "label": "Caption text",
        "rows": 3,
        "type": "textarea"
      },
      {
        "kind": "number",
        "key": "wordsPerSecond",
        "label": "Words per second",
        "min": 1,
        "max": 8,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-stat-counter",
    "source": "motion-studio",
    "motionStudioId": "StatCounter",
    "sourceBit": "StatCounter",
    "label": "Stat Counter",
    "category": "data",
    "description": "An animated number that ticks from 0 up to a target value, with a label fading in below.",
    "detail": "An animated number that ticks from 0 up to a target value, with a label fading in below. Motion Studio scene ID: StatCounter. Native canvas: 1920x1080 at 60fps for 170 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: target: number (Target value); label: text (Label); prefix: text (Prefix (e.g. $)); suffix: text (Suffix (e.g. +, %)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "data",
      "stat-counter"
    ],
    "defaultDurationInFrames": 170,
    "defaultProps": {
      "target": 12847,
      "label": "developers",
      "prefix": "",
      "suffix": "+"
    },
    "controls": [
      {
        "kind": "number",
        "key": "target",
        "label": "Target value",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "text",
        "key": "label",
        "label": "Label",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "prefix",
        "label": "Prefix (e.g. $)",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "suffix",
        "label": "Suffix (e.g. +, %)",
        "type": "text"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-tweet-card",
    "source": "motion-studio",
    "motionStudioId": "TweetCard",
    "sourceBit": "TweetCard",
    "label": "Tweet Card",
    "category": "social",
    "description": "An animated X / Twitter post card. Customize the author, copy, theme, and engagement counts.",
    "detail": "An animated X / Twitter post card. Customize the author, copy, theme, and engagement counts. Motion Studio scene ID: TweetCard. Native canvas: 1920x1080 at 60fps for 140 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Editable fields: displayName: text (Display name); handle: text (Handle); avatarUrl: text (Avatar URL); verified: select (Verified); text: textarea (Tweet text); timestamp: text (Timestamp); replies: number (Replies); retweets: number (Retweets); likes: number (Likes); views: number (Views); theme: select (Theme); backgroundColor: color (Background color). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "social",
      "tweet-card",
      "locked"
    ],
    "defaultDurationInFrames": 140,
    "defaultProps": {
      "displayName": "sanku",
      "handle": "@sankalpa_02",
      "avatarUrl": "https://avatars.githubusercontent.com/sankalpaacharya?s=200",
      "verified": "yes",
      "text": "Oh boy, we have a lot to talk about today.",
      "timestamp": "10:30 PM · Mar 15, 2025",
      "replies": 248,
      "retweets": 1924,
      "likes": 18432,
      "views": 412000,
      "theme": "light",
      "backgroundColor": "#ffffff"
    },
    "controls": [
      {
        "kind": "text",
        "key": "displayName",
        "label": "Display name",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "handle",
        "label": "Handle",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "avatarUrl",
        "label": "Avatar URL",
        "type": "text"
      },
      {
        "kind": "select",
        "key": "verified",
        "label": "Verified",
        "options": [
          {
            "value": "yes",
            "label": "Verified"
          },
          {
            "value": "no",
            "label": "Not verified"
          }
        ],
        "type": "select"
      },
      {
        "kind": "textarea",
        "key": "text",
        "label": "Tweet text",
        "rows": 3,
        "type": "textarea"
      },
      {
        "kind": "text",
        "key": "timestamp",
        "label": "Timestamp",
        "type": "text"
      },
      {
        "kind": "number",
        "key": "replies",
        "label": "Replies",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "retweets",
        "label": "Retweets",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "likes",
        "label": "Likes",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "views",
        "label": "Views",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      },
      {
        "kind": "color",
        "key": "backgroundColor",
        "label": "Background color",
        "type": "color"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "brandMode": "locked",
    "supportsEffects": true
  },
  {
    "id": "ms-twitter-follow",
    "source": "motion-studio",
    "motionStudioId": "TwitterFollow",
    "sourceBit": "TwitterFollow",
    "label": "Twitter Follow",
    "category": "social",
    "description": "An animated X / Twitter profile card with a Follow button click and follower count bump.",
    "detail": "An animated X / Twitter profile card with a Follow button click and follower count bump. Motion Studio scene ID: TwitterFollow. Native canvas: 1920x1080 at 60fps for 140 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Editable fields: handle: text (Handle); displayName: text (Display name); avatarUrl: text (Avatar URL); bio: textarea (Bio); followers: number (Followers); following: number (Following); verified: select (Verified); theme: select (Theme); backgroundColor: color (Background color). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "social",
      "twitter-follow",
      "locked"
    ],
    "defaultDurationInFrames": 140,
    "defaultProps": {
      "handle": "@sankalpa_02",
      "displayName": "sanku",
      "avatarUrl": "https://avatars.githubusercontent.com/sankalpaacharya?s=400",
      "bio": "Silly humour and programming 🤓",
      "followers": 482103,
      "following": 2014,
      "verified": "yes",
      "theme": "light",
      "backgroundColor": "#f7f9fa"
    },
    "controls": [
      {
        "kind": "text",
        "key": "handle",
        "label": "Handle",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "displayName",
        "label": "Display name",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "avatarUrl",
        "label": "Avatar URL",
        "type": "text"
      },
      {
        "kind": "textarea",
        "key": "bio",
        "label": "Bio",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "number",
        "key": "followers",
        "label": "Followers",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "following",
        "label": "Following",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "select",
        "key": "verified",
        "label": "Verified",
        "options": [
          {
            "value": "yes",
            "label": "Verified"
          },
          {
            "value": "no",
            "label": "Not verified"
          }
        ],
        "type": "select"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      },
      {
        "kind": "color",
        "key": "backgroundColor",
        "label": "Background color",
        "type": "color"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "brandMode": "locked",
    "supportsEffects": true
  },
  {
    "id": "ms-instagram-post",
    "source": "motion-studio",
    "motionStudioId": "InstagramPost",
    "sourceBit": "InstagramPost",
    "label": "Instagram Post",
    "category": "social",
    "description": "An animated Instagram post card. Customize the author, photo, caption, and like count.",
    "detail": "An animated Instagram post card. Customize the author, photo, caption, and like count. Motion Studio scene ID: InstagramPost. Native canvas: 1920x1080 at 60fps for 140 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Editable fields: username: text (Username); location: text (Location); avatarUrl: text (Avatar URL); verified: select (Verified); imageUrl: image (Photo URL); caption: textarea (Caption); likes: number (Likes); timestamp: text (Timestamp); theme: select (Theme); backgroundColor: color (Background color). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "social",
      "instagram-post",
      "locked"
    ],
    "defaultDurationInFrames": 140,
    "defaultProps": {
      "username": "sanku",
      "location": "Mumbai, India",
      "avatarUrl": "https://avatars.githubusercontent.com/sankalpaacharya?s=200",
      "verified": "yes",
      "imageUrl": "",
      "caption": "golden hour hits different 🌇",
      "likes": 18432,
      "timestamp": "2 hours ago",
      "theme": "light",
      "backgroundColor": "#fafafa"
    },
    "controls": [
      {
        "kind": "text",
        "key": "username",
        "label": "Username",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "location",
        "label": "Location",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "avatarUrl",
        "label": "Avatar URL",
        "type": "text"
      },
      {
        "kind": "select",
        "key": "verified",
        "label": "Verified",
        "options": [
          {
            "value": "yes",
            "label": "Verified"
          },
          {
            "value": "no",
            "label": "Not verified"
          }
        ],
        "type": "select"
      },
      {
        "kind": "image",
        "key": "imageUrl",
        "label": "Photo URL",
        "type": "image"
      },
      {
        "kind": "textarea",
        "key": "caption",
        "label": "Caption",
        "rows": 3,
        "type": "textarea"
      },
      {
        "kind": "number",
        "key": "likes",
        "label": "Likes",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "text",
        "key": "timestamp",
        "label": "Timestamp",
        "type": "text"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      },
      {
        "kind": "color",
        "key": "backgroundColor",
        "label": "Background color",
        "type": "color"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "brandMode": "locked",
    "supportsEffects": true
  },
  {
    "id": "ms-message-bubbles",
    "source": "motion-studio",
    "motionStudioId": "MessageBubbles",
    "sourceBit": "MessageBubbles",
    "label": "Message Bubbles",
    "category": "chat",
    "description": "An animated iMessage-style chat conversation with grouped bubble corners, tails, and spring-stacked rows.",
    "detail": "An animated iMessage-style chat conversation with grouped bubble corners, tails, and spring-stacked rows. Motion Studio scene ID: MessageBubbles. Native canvas: 1280x720 at 60fps for 660 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Phone frame fit mode: cover. Editable fields: contactName: text (Contact name); contactAvatar: text (Avatar URL); messages: chat (Messages); orientation: select (Orientation); scale: number (UI scale (landscape)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "message-bubbles",
      "locked"
    ],
    "defaultDurationInFrames": 660,
    "defaultProps": {
      "contactName": "sanku",
      "contactAvatar": "https://avatars.githubusercontent.com/aryanranderiya?s=200",
      "messages": [
        {
          "text": "hey, you up?",
          "side": "left",
          "typingFrames": 50,
          "delay": 30
        },
        {
          "text": "yeah whats up",
          "side": "right",
          "typingFrames": 55,
          "delay": 150
        },
        {
          "text": "wanna grab food?",
          "side": "right",
          "typingFrames": 55,
          "delay": 270
        },
        {
          "text": "always 🍕",
          "side": "left",
          "typingFrames": 50,
          "delay": 400
        },
        {
          "text": "on my way ❤️",
          "side": "left",
          "typingFrames": 55,
          "delay": 530
        }
      ],
      "orientation": "landscape",
      "scale": 1.6
    },
    "controls": [
      {
        "kind": "text",
        "key": "contactName",
        "label": "Contact name",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "contactAvatar",
        "label": "Avatar URL",
        "type": "text"
      },
      {
        "kind": "chat",
        "key": "messages",
        "label": "Messages",
        "type": "chat"
      },
      {
        "kind": "select",
        "key": "orientation",
        "label": "Orientation",
        "options": [
          {
            "value": "landscape",
            "label": "Landscape"
          },
          {
            "value": "portrait",
            "label": "Portrait (phone)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "number",
        "key": "scale",
        "label": "UI scale (landscape)",
        "min": 0.5,
        "max": 3,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "brandMode": "locked",
    "phoneFitMode": "cover",
    "supportsEffects": true
  },
  {
    "id": "ms-whats-app-messages",
    "source": "motion-studio",
    "motionStudioId": "WhatsAppMessages",
    "sourceBit": "WhatsAppMessages",
    "label": "WhatsApp Messages",
    "category": "chat",
    "description": "An animated WhatsApp-style chat conversation with green bubbles, read receipts, and stacking spring physics.",
    "detail": "An animated WhatsApp-style chat conversation with green bubbles, read receipts, and stacking spring physics. Motion Studio scene ID: WhatsAppMessages. Native canvas: 1280x720 at 60fps for 660 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Phone frame fit mode: cover. Editable fields: contactName: text (Contact name); contactAvatar: text (Avatar URL); messages: chat (Messages); theme: select (Theme); orientation: select (Orientation); scale: number (UI scale (landscape)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "whats-app-messages",
      "locked"
    ],
    "defaultDurationInFrames": 660,
    "defaultProps": {
      "contactName": "sanku",
      "contactAvatar": "https://avatars.githubusercontent.com/aryanranderiya?s=200",
      "messages": [
        {
          "text": "hey, you up?",
          "side": "left",
          "typingFrames": 50,
          "delay": 30
        },
        {
          "text": "yeah whats up",
          "side": "right",
          "typingFrames": 55,
          "delay": 150
        },
        {
          "text": "wanna grab food?",
          "side": "left",
          "typingFrames": 55,
          "delay": 290
        },
        {
          "text": "always 🍕",
          "side": "right",
          "typingFrames": 48,
          "delay": 430
        },
        {
          "text": "on my way 🛵",
          "side": "left",
          "typingFrames": 50,
          "delay": 560
        }
      ],
      "theme": "light",
      "orientation": "landscape",
      "scale": 1.6
    },
    "controls": [
      {
        "kind": "text",
        "key": "contactName",
        "label": "Contact name",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "contactAvatar",
        "label": "Avatar URL",
        "type": "text"
      },
      {
        "kind": "chat",
        "key": "messages",
        "label": "Messages",
        "type": "chat"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      },
      {
        "kind": "select",
        "key": "orientation",
        "label": "Orientation",
        "options": [
          {
            "value": "landscape",
            "label": "Landscape"
          },
          {
            "value": "portrait",
            "label": "Portrait (phone)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "number",
        "key": "scale",
        "label": "UI scale (landscape)",
        "min": 0.5,
        "max": 3,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "brandMode": "locked",
    "phoneFitMode": "cover",
    "supportsEffects": true
  },
  {
    "id": "ms-telegram-messages",
    "source": "motion-studio",
    "motionStudioId": "TelegramMessages",
    "sourceBit": "TelegramMessages",
    "label": "Telegram Messages",
    "category": "chat",
    "description": "An animated Telegram-style chat conversation with tailed bubbles, in-bubble timestamps, and the signature blue check marks.",
    "detail": "An animated Telegram-style chat conversation with tailed bubbles, in-bubble timestamps, and the signature blue check marks. Motion Studio scene ID: TelegramMessages. Native canvas: 1280x720 at 60fps for 660 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Phone frame fit mode: cover. Editable fields: contactName: text (Contact name); contactAvatar: text (Avatar URL); messages: chat (Messages); orientation: select (Orientation); scale: number (UI scale (landscape)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "telegram-messages",
      "locked"
    ],
    "defaultDurationInFrames": 660,
    "defaultProps": {
      "contactName": "sanku",
      "contactAvatar": "https://avatars.githubusercontent.com/aryanranderiya?s=200",
      "messages": [
        {
          "text": "you free tonight?",
          "side": "left",
          "typingFrames": 50,
          "delay": 30
        },
        {
          "text": "yeah, what's up",
          "side": "right",
          "typingFrames": 55,
          "delay": 150
        },
        {
          "text": "wanna watch the new episode?",
          "side": "left",
          "typingFrames": 60,
          "delay": 270
        },
        {
          "text": "always 🍿",
          "side": "right",
          "typingFrames": 48,
          "delay": 400
        },
        {
          "text": "coming over in 10",
          "side": "left",
          "typingFrames": 55,
          "delay": 530
        }
      ],
      "orientation": "landscape",
      "scale": 1.6
    },
    "controls": [
      {
        "kind": "text",
        "key": "contactName",
        "label": "Contact name",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "contactAvatar",
        "label": "Avatar URL",
        "type": "text"
      },
      {
        "kind": "chat",
        "key": "messages",
        "label": "Messages",
        "type": "chat"
      },
      {
        "kind": "select",
        "key": "orientation",
        "label": "Orientation",
        "options": [
          {
            "value": "landscape",
            "label": "Landscape"
          },
          {
            "value": "portrait",
            "label": "Portrait (phone)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "number",
        "key": "scale",
        "label": "UI scale (landscape)",
        "min": 0.5,
        "max": 3,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "brandMode": "locked",
    "phoneFitMode": "cover",
    "supportsEffects": true
  },
  {
    "id": "ms-slack-messages",
    "source": "motion-studio",
    "motionStudioId": "SlackMessages",
    "sourceBit": "SlackMessages",
    "label": "Slack Messages",
    "category": "chat",
    "description": "An animated Slack-style channel conversation with avatars, sender names, and a typing indicator.",
    "detail": "An animated Slack-style channel conversation with avatars, sender names, and a typing indicator. Motion Studio scene ID: SlackMessages. Native canvas: 1280x720 at 60fps for 660 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Phone frame fit mode: cover. Editable fields: contactName: text (Channel name); messages: chat (Messages); theme: select (Theme); orientation: select (Orientation); scale: number (UI scale (landscape)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "slack-messages",
      "locked"
    ],
    "defaultDurationInFrames": 660,
    "defaultProps": {
      "contactName": "design",
      "messages": [
        {
          "text": "ship it tomorrow?",
          "side": "left",
          "typingFrames": 50,
          "delay": 30
        },
        {
          "text": "lgtm 🚀",
          "side": "right",
          "typingFrames": 45,
          "delay": 150
        },
        {
          "text": "QA signed off this morning",
          "side": "left",
          "typingFrames": 60,
          "delay": 290
        },
        {
          "text": "merging now",
          "side": "right",
          "typingFrames": 48,
          "delay": 430
        },
        {
          "text": "🎉🎉🎉",
          "side": "left",
          "typingFrames": 45,
          "delay": 560
        }
      ],
      "theme": "light",
      "orientation": "landscape",
      "scale": 1.5
    },
    "controls": [
      {
        "kind": "text",
        "key": "contactName",
        "label": "Channel name",
        "type": "text"
      },
      {
        "kind": "chat",
        "key": "messages",
        "label": "Messages",
        "type": "chat"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      },
      {
        "kind": "select",
        "key": "orientation",
        "label": "Orientation",
        "options": [
          {
            "value": "landscape",
            "label": "Landscape"
          },
          {
            "value": "portrait",
            "label": "Portrait (phone)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "number",
        "key": "scale",
        "label": "UI scale (landscape)",
        "min": 0.5,
        "max": 3,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "brandMode": "locked",
    "phoneFitMode": "cover",
    "supportsEffects": true
  },
  {
    "id": "ms-discord-messages",
    "source": "motion-studio",
    "motionStudioId": "DiscordMessages",
    "sourceBit": "DiscordMessages",
    "label": "Discord Messages",
    "category": "chat",
    "description": "An animated Discord-style channel conversation in the dark theme with colored usernames and typing indicator.",
    "detail": "An animated Discord-style channel conversation in the dark theme with colored usernames and typing indicator. Motion Studio scene ID: DiscordMessages. Native canvas: 1280x720 at 60fps for 660 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Phone frame fit mode: cover. Editable fields: contactName: text (Channel name); messages: chat (Messages); orientation: select (Orientation); scale: number (UI scale (landscape)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "discord-messages",
      "locked"
    ],
    "defaultDurationInFrames": 660,
    "defaultProps": {
      "contactName": "general",
      "messages": [
        {
          "text": "anyone playing tonight?",
          "side": "left",
          "typingFrames": 50,
          "delay": 30
        },
        {
          "text": "im down",
          "side": "right",
          "typingFrames": 40,
          "delay": 150
        },
        {
          "text": "ranked or casual?",
          "side": "left",
          "typingFrames": 55,
          "delay": 290
        },
        {
          "text": "ranked. lets go",
          "side": "right",
          "typingFrames": 50,
          "delay": 430
        },
        {
          "text": "joining vc",
          "side": "left",
          "typingFrames": 45,
          "delay": 560
        }
      ],
      "orientation": "landscape",
      "scale": 1.5
    },
    "controls": [
      {
        "kind": "text",
        "key": "contactName",
        "label": "Channel name",
        "type": "text"
      },
      {
        "kind": "chat",
        "key": "messages",
        "label": "Messages",
        "type": "chat"
      },
      {
        "kind": "select",
        "key": "orientation",
        "label": "Orientation",
        "options": [
          {
            "value": "landscape",
            "label": "Landscape"
          },
          {
            "value": "portrait",
            "label": "Portrait (phone)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "number",
        "key": "scale",
        "label": "UI scale (landscape)",
        "min": 0.5,
        "max": 3,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "brandMode": "locked",
    "phoneFitMode": "cover",
    "supportsEffects": true
  },
  {
    "id": "ms-instagram-messages",
    "source": "motion-studio",
    "motionStudioId": "InstagramMessages",
    "sourceBit": "InstagramMessages",
    "label": "Instagram Messages",
    "category": "chat",
    "description": "An animated Instagram DM conversation with the gradient sent bubble, typing dots, and stacking spring physics.",
    "detail": "An animated Instagram DM conversation with the gradient sent bubble, typing dots, and stacking spring physics. Motion Studio scene ID: InstagramMessages. Native canvas: 1280x720 at 60fps for 660 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Phone frame fit mode: cover. Editable fields: contactName: text (Contact name); contactAvatar: text (Avatar URL); messages: chat (Messages); theme: select (Theme); orientation: select (Orientation). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "instagram-messages",
      "locked"
    ],
    "defaultDurationInFrames": 660,
    "defaultProps": {
      "contactName": "sanku",
      "contactAvatar": "https://avatars.githubusercontent.com/aryanranderiya?s=200",
      "messages": [
        {
          "text": "saw your story 👀",
          "side": "left",
          "typingFrames": 50,
          "delay": 30
        },
        {
          "text": "haha what about it",
          "side": "right",
          "typingFrames": 55,
          "delay": 150
        },
        {
          "text": "where was that shot?",
          "side": "left",
          "typingFrames": 55,
          "delay": 290
        },
        {
          "text": "bandra rooftop 🌇",
          "side": "right",
          "typingFrames": 48,
          "delay": 430
        },
        {
          "text": "take me next time",
          "side": "left",
          "typingFrames": 50,
          "delay": 560
        }
      ],
      "theme": "light",
      "orientation": "landscape"
    },
    "controls": [
      {
        "kind": "text",
        "key": "contactName",
        "label": "Contact name",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "contactAvatar",
        "label": "Avatar URL",
        "type": "text"
      },
      {
        "kind": "chat",
        "key": "messages",
        "label": "Messages",
        "type": "chat"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      },
      {
        "kind": "select",
        "key": "orientation",
        "label": "Orientation",
        "options": [
          {
            "value": "landscape",
            "label": "Landscape"
          },
          {
            "value": "portrait",
            "label": "Portrait (phone)"
          }
        ],
        "type": "select"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "brandMode": "locked",
    "phoneFitMode": "cover",
    "supportsEffects": true
  },
  {
    "id": "ms-message-popup",
    "source": "motion-studio",
    "motionStudioId": "MessagePopup",
    "sourceBit": "MessagePopup",
    "label": "Message Popup",
    "category": "chat",
    "description": "An animated iOS-style notification banner. Edit the fields below to preview, then download an MP4.",
    "detail": "An animated iOS-style notification banner. Edit the fields below to preview, then download an MP4. Motion Studio scene ID: MessagePopup. Native canvas: 1280x720 at 60fps for 100 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Editable fields: sender: text (Sender); time: text (Time); body: textarea (Body); theme: select (Theme); iconPreset: iconPreset (App Icon). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "chat",
      "message-popup",
      "locked"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "sender": "her 💕",
      "time": "now",
      "body": "babe what is this claude code?",
      "theme": "light",
      "iconPreset": "",
      "iconCustom": ""
    },
    "controls": [
      {
        "kind": "text",
        "key": "sender",
        "label": "Sender",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "time",
        "label": "Time",
        "type": "text"
      },
      {
        "kind": "textarea",
        "key": "body",
        "label": "Body",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      },
      {
        "kind": "iconPreset",
        "key": "iconPreset",
        "customKey": "iconCustom",
        "label": "App Icon",
        "presetSet": "macos",
        "type": "iconPreset"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "brandMode": "locked",
    "supportsEffects": true
  },
  {
    "id": "ms-phone-frame",
    "source": "motion-studio",
    "motionStudioId": "PhoneFrame",
    "sourceBit": "PhoneFrame",
    "label": "Phone Frame",
    "category": "frames",
    "description": "Wraps any other composition inside a realistic iPhone mockup with a drop-in entrance.",
    "detail": "Wraps any other composition inside a realistic iPhone mockup with a drop-in entrance. Motion Studio scene ID: PhoneFrame. Native canvas: 1920x1080 at 60fps for 780 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: device: select (Device); screenImage: image (Screen image); innerCompositionId: composition (Screen content); innerProps: innerProps (Inner content). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "frames",
      "phone-frame"
    ],
    "defaultDurationInFrames": 780,
    "defaultProps": {
      "device": "dynamic-island",
      "innerCompositionId": "MessageBubbles",
      "screenImage": ""
    },
    "controls": [
      {
        "kind": "select",
        "key": "device",
        "label": "Device",
        "options": [
          {
            "value": "dynamic-island",
            "label": "iPhone (Dynamic Island)"
          },
          {
            "value": "notch",
            "label": "iPhone (Notch)"
          },
          {
            "value": "plain",
            "label": "Plain (no chrome)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "image",
        "key": "screenImage",
        "label": "Screen image",
        "placeholder": "Or paste an image URL",
        "type": "image"
      },
      {
        "kind": "composition",
        "key": "innerCompositionId",
        "label": "Screen content",
        "exclude": [
          "PhoneFrame"
        ],
        "type": "composition"
      },
      {
        "kind": "innerProps",
        "key": "innerProps",
        "label": "Inner content",
        "compositionKey": "innerCompositionId",
        "type": "innerProps"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-laptop-frame",
    "source": "motion-studio",
    "motionStudioId": "LaptopFrame",
    "sourceBit": "LaptopFrame",
    "label": "Laptop Frame",
    "category": "frames",
    "description": "Wraps any other composition inside a realistic laptop mockup with a drop-in entrance.",
    "detail": "Wraps any other composition inside a realistic laptop mockup with a drop-in entrance. Motion Studio scene ID: LaptopFrame. Native canvas: 1920x1080 at 60fps for 780 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: chassis: select (Chassis); screenImage: image (Screen image); innerCompositionId: composition (Screen content); innerProps: innerProps (Inner content). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "frames",
      "laptop-frame"
    ],
    "defaultDurationInFrames": 780,
    "defaultProps": {
      "chassis": "space-gray",
      "innerCompositionId": "BrowserWindow",
      "screenImage": ""
    },
    "controls": [
      {
        "kind": "select",
        "key": "chassis",
        "label": "Chassis",
        "options": [
          {
            "value": "space-gray",
            "label": "Space Gray"
          },
          {
            "value": "silver",
            "label": "Silver"
          }
        ],
        "type": "select"
      },
      {
        "kind": "image",
        "key": "screenImage",
        "label": "Screen image",
        "placeholder": "Or paste an image URL",
        "type": "image"
      },
      {
        "kind": "composition",
        "key": "innerCompositionId",
        "label": "Screen content",
        "exclude": [
          "LaptopFrame",
          "PhoneFrame"
        ],
        "type": "composition"
      },
      {
        "kind": "innerProps",
        "key": "innerProps",
        "label": "Inner content",
        "compositionKey": "innerCompositionId",
        "type": "innerProps"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-split-scene",
    "source": "motion-studio",
    "motionStudioId": "SplitScene",
    "sourceBit": "SplitScene",
    "label": "Split Scene",
    "category": "frames",
    "description": "Combine multiple compositions in one frame using a preset layout — stacked, side-by-side, picture-in-picture, or 2×2 grid.",
    "detail": "Combine multiple compositions in one frame using a preset layout — stacked, side-by-side, picture-in-picture, or 2×2 grid. Motion Studio scene ID: SplitScene. Native canvas: 1920x1080 at 60fps for 600 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: layout: select (Layout); slots: slots (Slots); gap: number (Gap (px)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "frames",
      "split-scene"
    ],
    "defaultDurationInFrames": 600,
    "defaultProps": {
      "layout": "side-by-side",
      "slots": [
        "TweetCard",
        "StatCounter"
      ],
      "gap": 16
    },
    "controls": [
      {
        "kind": "select",
        "key": "layout",
        "label": "Layout",
        "options": [
          {
            "value": "side-by-side",
            "label": "Side by side"
          },
          {
            "value": "stacked",
            "label": "Stacked"
          },
          {
            "value": "pip",
            "label": "Picture in picture"
          },
          {
            "value": "grid-2x2",
            "label": "Grid 2×2"
          }
        ],
        "type": "select"
      },
      {
        "kind": "slots",
        "key": "slots",
        "label": "Slots",
        "layoutKey": "layout",
        "counts": {
          "stacked": 2,
          "side-by-side": 2,
          "pip": 2,
          "grid-2x2": 4
        },
        "exclude": [
          "SplitScene"
        ],
        "type": "slots"
      },
      {
        "kind": "number",
        "key": "gap",
        "label": "Gap (px)",
        "min": 0,
        "max": 80,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-micro-scale-fade",
    "source": "motion-studio",
    "motionStudioId": "TextMicroScaleFade",
    "sourceBit": "TextMicroScaleFade",
    "label": "Scale Fade",
    "category": "text",
    "description": "A calm, tiny scale pop used as subtle premium polish for labels and headings.",
    "detail": "A calm, tiny scale pop used as subtle premium polish for labels and headings. Motion Studio scene ID: TextMicroScaleFade. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-micro-scale-fade"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Quietly brilliant",
      "subtitle": "Subtle is powerful"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-shimmer-sweep",
    "source": "motion-studio",
    "motionStudioId": "TextShimmerSweep",
    "sourceBit": "TextShimmerSweep",
    "label": "Shimmer Sweep",
    "category": "text",
    "description": "A subtle sweep across a clean headline, blending in while gliding from left to center.",
    "detail": "A subtle sweep across a clean headline, blending in while gliding from left to center. Motion Studio scene ID: TextShimmerSweep. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-shimmer-sweep"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Sweeping clarity",
      "subtitle": "A premium micro-transition"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-fade-through",
    "source": "motion-studio",
    "motionStudioId": "TextFadeThrough",
    "sourceBit": "TextFadeThrough",
    "label": "Fade Through",
    "category": "text",
    "description": "A Material-style content transition: old fades out, new fades in with a soft delay.",
    "detail": "A Material-style content transition: old fades out, new fades in with a soft delay. Motion Studio scene ID: TextFadeThrough. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-fade-through"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Content transitions",
      "subtitle": "Material-inspired motion"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-shared-axis-z",
    "source": "motion-studio",
    "motionStudioId": "TextSharedAxisZ",
    "sourceBit": "TextSharedAxisZ",
    "label": "Depth Fade",
    "category": "text",
    "description": "Scale-based shared-axis transition for focus shifts and context depth.",
    "detail": "Scale-based shared-axis transition for focus shifts and context depth. Motion Studio scene ID: TextSharedAxisZ. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-shared-axis-z"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Focus and depth",
      "subtitle": "Context through scale"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-scale-down-fade",
    "source": "motion-studio",
    "motionStudioId": "TextScaleDownFade",
    "sourceBit": "TextScaleDownFade",
    "label": "Settle In",
    "category": "text",
    "description": "Subtle premium settle-in with a restrained scale-down fade on exit.",
    "detail": "Subtle premium settle-in with a restrained scale-down fade on exit. Motion Studio scene ID: TextScaleDownFade. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-scale-down-fade"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Premium settle",
      "subtitle": "Restrained and precise"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-focus-blur-resolve",
    "source": "motion-studio",
    "motionStudioId": "TextFocusBlurResolve",
    "sourceBit": "TextFocusBlurResolve",
    "label": "Focus Pull",
    "category": "text",
    "description": "A premium focus pull from heavy blur to crisp text, then a soft blur-out exit.",
    "detail": "A premium focus pull from heavy blur to crisp text, then a soft blur-out exit. Motion Studio scene ID: TextFocusBlurResolve. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-focus-blur-resolve"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Sharp resolve",
      "subtitle": "From blur to clarity"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-shared-axis-x",
    "source": "motion-studio",
    "motionStudioId": "TextSharedAxisX",
    "sourceBit": "TextSharedAxisX",
    "label": "Slide In",
    "category": "text",
    "description": "Horizontal shared-axis transition for sibling destinations with continuity.",
    "detail": "Horizontal shared-axis transition for sibling destinations with continuity. Motion Studio scene ID: TextSharedAxisX. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-shared-axis-x"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Moving forward",
      "subtitle": "Horizontal continuity"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-mask-reveal-up",
    "source": "motion-studio",
    "motionStudioId": "TextMaskRevealUp",
    "sourceBit": "TextMaskRevealUp",
    "label": "Line Reveal",
    "category": "text",
    "description": "Lines reveal upward with a soft masked feel and compact stagger.",
    "detail": "Lines reveal upward with a soft masked feel and compact stagger. Motion Studio scene ID: TextMaskRevealUp. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-mask-reveal-up"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Line one\nLine two\nLine three",
      "subtitle": "Lines rise together"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-line-by-line-slide",
    "source": "motion-studio",
    "motionStudioId": "TextLineByLineSlide",
    "sourceBit": "TextLineByLineSlide",
    "label": "Line Slide In",
    "category": "text",
    "description": "Each line enters from the left with a staggered slide and exits to the right for a flowing paragraph reveal.",
    "detail": "Each line enters from the left with a staggered slide and exits to the right for a flowing paragraph reveal. Motion Studio scene ID: TextLineByLineSlide. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-line-by-line-slide"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "First comes clarity\nThen comes conviction\nThen comes change",
      "subtitle": "Line by line"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-soft-blur-in",
    "source": "motion-studio",
    "motionStudioId": "TextSoftBlurIn",
    "sourceBit": "TextSoftBlurIn",
    "label": "Soft Blur In",
    "category": "text",
    "description": "Per-character fade-in with a gentle blur and upward motion. Apple's signature hero-title reveal.",
    "detail": "Per-character fade-in with a gentle blur and upward motion. Apple's signature hero-title reveal. Motion Studio scene ID: TextSoftBlurIn. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-soft-blur-in"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Precision in motion",
      "subtitle": "Character by character"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-per-character-rise",
    "source": "motion-studio",
    "motionStudioId": "TextPerCharacterRise",
    "sourceBit": "TextPerCharacterRise",
    "label": "Character Rise",
    "category": "text",
    "description": "Letters slide up from below with no blur — crisp, deliberate, kinetic. Apple's clean tvOS-style reveal.",
    "detail": "Letters slide up from below with no blur — crisp, deliberate, kinetic. Apple's clean tvOS-style reveal. Motion Studio scene ID: TextPerCharacterRise. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-per-character-rise"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Rise and shine",
      "subtitle": "Clean and crisp"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-bottom-up-letters",
    "source": "motion-studio",
    "motionStudioId": "TextBottomUpLetters",
    "sourceBit": "TextBottomUpLetters",
    "label": "Letters Rise Up",
    "category": "text",
    "description": "Letters rise from below in a pronounced staircase, one symbol at a time, with zero blur.",
    "detail": "Letters rise from below in a pronounced staircase, one symbol at a time, with zero blur. Motion Studio scene ID: TextBottomUpLetters. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-bottom-up-letters"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "ASCEND",
      "subtitle": "One letter at a time"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-top-down-letters",
    "source": "motion-studio",
    "motionStudioId": "TextTopDownLetters",
    "sourceBit": "TextTopDownLetters",
    "label": "Letters Drop Down",
    "category": "text",
    "description": "Letters descend from above in a pronounced staircase, one symbol at a time, with zero blur.",
    "detail": "Letters descend from above in a pronounced staircase, one symbol at a time, with zero blur. Motion Studio scene ID: TextTopDownLetters. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-top-down-letters"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "DESCEND",
      "subtitle": "From above"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-stagger-from-center",
    "source": "motion-studio",
    "motionStudioId": "TextStaggerFromCenter",
    "sourceBit": "TextStaggerFromCenter",
    "label": "Center Stagger",
    "category": "text",
    "description": "Characters reveal from the center outward to emphasize the keyword core.",
    "detail": "Characters reveal from the center outward to emphasize the keyword core. Motion Studio scene ID: TextStaggerFromCenter. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-stagger-from-center"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Centered focus",
      "subtitle": "From the core outward"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-stagger-from-edges",
    "source": "motion-studio",
    "motionStudioId": "TextStaggerFromEdges",
    "sourceBit": "TextStaggerFromEdges",
    "label": "Edge Stagger",
    "category": "text",
    "description": "Characters start from both edges and converge toward the center.",
    "detail": "Characters start from both edges and converge toward the center. Motion Studio scene ID: TextStaggerFromEdges. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-stagger-from-edges"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Converging text",
      "subtitle": "Edges meet center"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-typewriter",
    "source": "motion-studio",
    "motionStudioId": "TextTypewriter",
    "sourceBit": "TextTypewriter",
    "label": "Typewriter",
    "category": "text",
    "description": "Per-character stepped reveal with a minimal editorial typing rhythm.",
    "detail": "Per-character stepped reveal with a minimal editorial typing rhythm. Motion Studio scene ID: TextTypewriter. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-typewriter"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Type it out",
      "subtitle": "Editorial rhythm"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-per-word-crossfade",
    "source": "motion-studio",
    "motionStudioId": "TextPerWordCrossfade",
    "sourceBit": "TextPerWordCrossfade",
    "label": "Word Crossfade",
    "category": "text",
    "description": "Words gently fade into place one after another, with a short vertical drift for a calm keynote rhythm.",
    "detail": "Words gently fade into place one after another, with a short vertical drift for a calm keynote rhythm. Motion Studio scene ID: TextPerWordCrossfade. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-per-word-crossfade"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Move the world forward",
      "subtitle": "One word at a time"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-spring-scale-in",
    "source": "motion-studio",
    "motionStudioId": "TextSpringScaleIn",
    "sourceBit": "TextSpringScaleIn",
    "label": "Spring Pop",
    "category": "text",
    "description": "Words pop in with a soft overshoot scale, like a physical spring settling into place.",
    "detail": "Words pop in with a soft overshoot scale, like a physical spring settling into place. Motion Studio scene ID: TextSpringScaleIn. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-spring-scale-in"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Bold and alive",
      "subtitle": "Spring into action"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-blur-out-up",
    "source": "motion-studio",
    "motionStudioId": "TextBlurOutUp",
    "sourceBit": "TextBlurOutUp",
    "label": "Blur Rise",
    "category": "text",
    "description": "Words arrive clean and depart upward with increasing blur for airy exits.",
    "detail": "Words arrive clean and depart upward with increasing blur for airy exits. Motion Studio scene ID: TextBlurOutUp. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-blur-out-up"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Light as air",
      "subtitle": "Words arrive clean"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-shared-axis-y",
    "source": "motion-studio",
    "motionStudioId": "TextSharedAxisY",
    "sourceBit": "TextSharedAxisY",
    "label": "Word Staircase",
    "category": "text",
    "description": "Per-word hard-cut transition with staircase timing for sharp editorial swaps.",
    "detail": "Per-word hard-cut transition with staircase timing for sharp editorial swaps. Motion Studio scene ID: TextSharedAxisY. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-shared-axis-y"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Sharp and direct",
      "subtitle": "Word by word"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-depth-parallax-words",
    "source": "motion-studio",
    "motionStudioId": "TextDepthParallaxWords",
    "sourceBit": "TextDepthParallaxWords",
    "label": "Word Parallax",
    "category": "text",
    "description": "Per-word depth motion with scale and vertical drift for layered readability.",
    "detail": "Per-word depth motion with scale and vertical drift for layered readability. Motion Studio scene ID: TextDepthParallaxWords. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-depth-parallax-words"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Depth of meaning",
      "subtitle": "Layer upon layer"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-short-slide-right",
    "source": "motion-studio",
    "motionStudioId": "TextShortSlideRight",
    "sourceBit": "TextShortSlideRight",
    "label": "Short Slide Right",
    "category": "text",
    "description": "The whole phrase glides in from the left as one compact move, while the words themselves are revealed in sequence only through opacity.",
    "detail": "The whole phrase glides in from the left as one compact move, while the words themselves are revealed in sequence only through opacity. Motion Studio scene ID: TextShortSlideRight. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-short-slide-right"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Words slide into place",
      "subtitle": "One shared motion"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-kinetic-center-build",
    "source": "motion-studio",
    "motionStudioId": "TextKineticCenterBuild",
    "sourceBit": "TextKineticCenterBuild",
    "label": "Kinetic Center Build",
    "category": "text",
    "description": "A word appears in the center; each new word enters from right to left with a soft blur and pushes the existing line until the full phrase locks centered.",
    "detail": "A word appears in the center; each new word enters from right to left with a soft blur and pushes the existing line until the full phrase locks centered. Motion Studio scene ID: TextKineticCenterBuild. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-kinetic-center-build"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Words push left",
      "subtitle": "Kinetic center build"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-text-short-slide-down",
    "source": "motion-studio",
    "motionStudioId": "TextShortSlideDown",
    "sourceBit": "TextShortSlideDown",
    "label": "Short Slide Down",
    "category": "text",
    "description": "Each new word drops in from above into its own line and pushes the existing stack downward until a centered three-line composition locks in place.",
    "detail": "Each new word drops in from above into its own line and pushes the existing stack downward until a centered three-line composition locks in place. Motion Studio scene ID: TextShortSlideDown. Native canvas: 1920x1080 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: textarea (Headline); subtitle: textarea (Subtitle (optional)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "text",
      "text-short-slide-down"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Drop it down",
      "subtitle": "Top-down kinetic build"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "headline",
        "label": "Headline",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "textarea",
        "key": "subtitle",
        "label": "Subtitle (optional)",
        "rows": 2,
        "type": "textarea"
      }
    ],
    "defaultBox": "center",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-feature-card",
    "source": "motion-studio",
    "motionStudioId": "FeatureCard",
    "sourceBit": "FeatureCard",
    "label": "Feature Card",
    "category": "showcase",
    "description": "A clean Linear/Vercel-style feature card with icon, title, and body — staggered reveal animation.",
    "detail": "A clean Linear/Vercel-style feature card with icon, title, and body — staggered reveal animation. Motion Studio scene ID: FeatureCard. Native canvas: 1280x720 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: icon: text (Icon (emoji)); title: text (Title); body: textarea (Body); theme: select (Theme). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "showcase",
      "feature-card"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "icon": "⚡",
      "title": "Lightning fast",
      "body": "Built for speed. Every interaction takes under 50ms — your users never wait.",
      "theme": "light"
    },
    "controls": [
      {
        "kind": "text",
        "key": "icon",
        "label": "Icon (emoji)",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "textarea",
        "key": "body",
        "label": "Body",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-metric-card",
    "source": "motion-studio",
    "motionStudioId": "MetricCard",
    "sourceBit": "MetricCard",
    "label": "Metric Card",
    "category": "data",
    "description": "A polished card that counts up to a big number with a label and sublabel — perfect for 'by the numbers' sections.",
    "detail": "A polished card that counts up to a big number with a label and sublabel — perfect for 'by the numbers' sections. Motion Studio scene ID: MetricCard. Native canvas: 1280x720 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: value: number (Value); prefix: text (Prefix (e.g. $)); suffix: text (Suffix (e.g. x, %, K)); label: text (Label); sublabel: text (Sublabel); theme: select (Theme). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "data",
      "metric-card"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "value": 10,
      "prefix": "",
      "suffix": "x",
      "label": "faster than ever",
      "sublabel": "Average response time vs. last quarter",
      "theme": "light"
    },
    "controls": [
      {
        "kind": "number",
        "key": "value",
        "label": "Value",
        "type": "number"
      },
      {
        "kind": "text",
        "key": "prefix",
        "label": "Prefix (e.g. $)",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "suffix",
        "label": "Suffix (e.g. x, %, K)",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "label",
        "label": "Label",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "sublabel",
        "label": "Sublabel",
        "type": "text"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-testimonial-card",
    "source": "motion-studio",
    "motionStudioId": "TestimonialCard",
    "sourceBit": "TestimonialCard",
    "label": "Testimonial Card",
    "category": "showcase",
    "description": "A polished testimonial — quote with scaling quote mark, avatar, name, role, and company.",
    "detail": "A polished testimonial — quote with scaling quote mark, avatar, name, role, and company. Motion Studio scene ID: TestimonialCard. Native canvas: 1280x720 at 60fps for 110 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: quote: textarea (Quote); avatarUrl: text (Avatar URL); name: text (Name); role: text (Role); company: text (Company); theme: select (Theme). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "showcase",
      "testimonial-card"
    ],
    "defaultDurationInFrames": 110,
    "defaultProps": {
      "quote": "We replaced three tools with this and shipped our launch in half the time. It's the most thoughtful product we've used all year.",
      "avatarUrl": "https://avatars.githubusercontent.com/t3dotgg?s=200",
      "name": "Theo Browne",
      "role": "Founder",
      "company": "Ping",
      "theme": "light"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "quote",
        "label": "Quote",
        "rows": 4,
        "type": "textarea"
      },
      {
        "kind": "text",
        "key": "avatarUrl",
        "label": "Avatar URL",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "name",
        "label": "Name",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "role",
        "label": "Role",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "company",
        "label": "Company",
        "type": "text"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-logo-cloud",
    "source": "motion-studio",
    "motionStudioId": "LogoCloud",
    "sourceBit": "LogoCloud",
    "label": "Logo Cloud",
    "category": "showcase",
    "description": "A 'trusted by' section with a row of company logos that stagger in.",
    "detail": "A 'trusted by' section with a row of company logos that stagger in. Motion Studio scene ID: LogoCloud. Native canvas: 1280x720 at 60fps for 100 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: headline: text (Headline); theme: select (Theme); logos: imageList (Logos). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "showcase",
      "logo-cloud"
    ],
    "defaultDurationInFrames": 100,
    "defaultProps": {
      "headline": "Trusted by teams at",
      "logos": [
        {
          "name": "Vercel",
          "url": "https://cdn.simpleicons.org/vercel/0f1014"
        },
        {
          "name": "Linear",
          "url": "https://cdn.simpleicons.org/linear/0f1014"
        },
        {
          "name": "Stripe",
          "url": "https://cdn.simpleicons.org/stripe/0f1014"
        },
        {
          "name": "Notion",
          "url": "https://cdn.simpleicons.org/notion/0f1014"
        },
        {
          "name": "Figma",
          "url": "https://cdn.simpleicons.org/figma/0f1014"
        }
      ],
      "theme": "light"
    },
    "controls": [
      {
        "kind": "text",
        "key": "headline",
        "label": "Headline",
        "type": "text"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      },
      {
        "kind": "imageList",
        "key": "logos",
        "label": "Logos",
        "itemLabel": "Logo",
        "max": 12,
        "type": "imageList"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-pricing-card",
    "source": "motion-studio",
    "motionStudioId": "PricingCard",
    "sourceBit": "PricingCard",
    "label": "Pricing Card",
    "category": "showcase",
    "description": "A pricing tier card with title, big price, feature list with checkmarks, and CTA — supports a 'most popular' highlighted variant.",
    "detail": "A pricing tier card with title, big price, feature list with checkmarks, and CTA — supports a 'most popular' highlighted variant. Motion Studio scene ID: PricingCard. Native canvas: 1280x720 at 60fps for 130 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: tier: text (Tier name); price: text (Price); period: text (Period (e.g. / month)); features: textarea (Features (one per line)); cta: text (CTA label); highlighted: select (Highlighted); theme: select (Theme). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "showcase",
      "pricing-card"
    ],
    "defaultDurationInFrames": 130,
    "defaultProps": {
      "tier": "Pro",
      "price": "$24",
      "period": "/ month",
      "features": "Unlimited projects\nUnlimited renders\n4K exports\nPriority support\nCustom branding",
      "cta": "Start free trial",
      "highlighted": "yes",
      "theme": "light"
    },
    "controls": [
      {
        "kind": "text",
        "key": "tier",
        "label": "Tier name",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "price",
        "label": "Price",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "period",
        "label": "Period (e.g. / month)",
        "type": "text"
      },
      {
        "kind": "textarea",
        "key": "features",
        "label": "Features (one per line)",
        "rows": 6,
        "type": "textarea"
      },
      {
        "kind": "text",
        "key": "cta",
        "label": "CTA label",
        "type": "text"
      },
      {
        "kind": "select",
        "key": "highlighted",
        "label": "Highlighted",
        "options": [
          {
            "value": "yes",
            "label": "Yes — most popular"
          },
          {
            "value": "no",
            "label": "No"
          }
        ],
        "type": "select"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1280,
      "height": 720,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-terminal",
    "source": "motion-studio",
    "motionStudioId": "Terminal",
    "sourceBit": "Terminal",
    "label": "Terminal",
    "category": "showcase",
    "description": "A macOS-style terminal that types out CLI commands line by line. Highly configurable: chrome style, cursor, font size, padding, line kinds.",
    "detail": "A macOS-style terminal that types out CLI commands line by line. Highly configurable: chrome style, cursor, font size, padding, line kinds. Motion Studio scene ID: Terminal. Native canvas: 1920x1080 at 60fps for 360 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Window title); prompt: text (Prompt symbol); lines: terminalLines (Lines); chromeStyle: select (Window chrome); cursorStyle: select (Cursor); charactersPerSecond: number (Type speed (cps)); fontSize: number (Font size); lineGap: number (Line gap (px)); paddingX: number (Padding X (px)); paddingY: number (Padding Y (px)); cornerRadius: number (Window radius); maxWidth: number (Window max width); successColor: color (Success row color); outputOpacity: number (Output opacity (0–1)); commentOpacity: number (Comment opacity (0–1)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "showcase",
      "terminal"
    ],
    "defaultDurationInFrames": 360,
    "defaultProps": {
      "title": "~/projects/motion-studio",
      "prompt": "❯",
      "lines": [
        {
          "kind": "comment",
          "text": "# Install the CLI"
        },
        {
          "kind": "command",
          "text": "npm install -g motion-studio"
        },
        {
          "kind": "output",
          "text": "added 247 packages in 3.2s"
        },
        {
          "kind": "success",
          "text": "ready"
        },
        {
          "kind": "comment",
          "text": ""
        },
        {
          "kind": "comment",
          "text": "# Scaffold a project"
        },
        {
          "kind": "command",
          "text": "motion-studio init my-video"
        },
        {
          "kind": "output",
          "text": "created my-video/"
        }
      ],
      "charactersPerSecond": 28,
      "lineGap": 6,
      "chromeStyle": "mac",
      "cursorStyle": "block",
      "fontSize": 26,
      "paddingX": 32,
      "paddingY": 28,
      "cornerRadius": 16,
      "successColor": "#34d399",
      "outputOpacity": 0.62,
      "commentOpacity": 0.38,
      "showShadow": true,
      "maxWidth": 1280
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Window title",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "prompt",
        "label": "Prompt symbol",
        "type": "text"
      },
      {
        "kind": "terminalLines",
        "key": "lines",
        "label": "Lines",
        "type": "terminalLines"
      },
      {
        "kind": "select",
        "key": "chromeStyle",
        "label": "Window chrome",
        "options": [
          {
            "value": "mac",
            "label": "macOS (traffic lights)"
          },
          {
            "value": "linux",
            "label": "Linux (grey dots)"
          },
          {
            "value": "windows",
            "label": "Windows (right buttons)"
          },
          {
            "value": "none",
            "label": "None"
          }
        ],
        "type": "select"
      },
      {
        "kind": "select",
        "key": "cursorStyle",
        "label": "Cursor",
        "options": [
          {
            "value": "block",
            "label": "Block"
          },
          {
            "value": "underline",
            "label": "Underline"
          },
          {
            "value": "bar",
            "label": "Bar (|)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "number",
        "key": "charactersPerSecond",
        "label": "Type speed (cps)",
        "min": 4,
        "max": 120,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "fontSize",
        "label": "Font size",
        "min": 14,
        "max": 64,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "lineGap",
        "label": "Line gap (px)",
        "min": 0,
        "max": 40,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "paddingX",
        "label": "Padding X (px)",
        "min": 0,
        "max": 120,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "paddingY",
        "label": "Padding Y (px)",
        "min": 0,
        "max": 120,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "cornerRadius",
        "label": "Window radius",
        "min": 0,
        "max": 48,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "maxWidth",
        "label": "Window max width",
        "min": 600,
        "max": 1800,
        "type": "number"
      },
      {
        "kind": "color",
        "key": "successColor",
        "label": "Success row color",
        "type": "color"
      },
      {
        "kind": "number",
        "key": "outputOpacity",
        "label": "Output opacity (0–1)",
        "min": 0,
        "max": 1,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "commentOpacity",
        "label": "Comment opacity (0–1)",
        "min": 0,
        "max": 1,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-git-hub-star-button",
    "source": "motion-studio",
    "motionStudioId": "GitHubStarButton",
    "sourceBit": "GitHubStarButton",
    "label": "GitHub Star Button",
    "category": "social",
    "description": "A pixel-faithful GitHub 'Star' button that animates a click, fills the star, bursts particles, and rolls the star count.",
    "detail": "A pixel-faithful GitHub 'Star' button that animates a click, fills the star, bursts particles, and rolls the star count. Motion Studio scene ID: GitHubStarButton. Native canvas: 1920x1080 at 60fps for 180 frames. Brand-locked scene: preserve the recognizable product look and avoid forcing brand colors. Editable fields: owner: text (Owner); repo: text (Repo); startCount: number (Starting star count); endCount: number (Ending star count); theme: select (Theme). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "social",
      "git-hub-star-button",
      "locked"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "owner": "theexperiencecompany",
      "repo": "motion-studio",
      "startCount": 1240,
      "endCount": 1289,
      "theme": "light"
    },
    "controls": [
      {
        "kind": "text",
        "key": "owner",
        "label": "Owner",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "repo",
        "label": "Repo",
        "type": "text"
      },
      {
        "kind": "number",
        "key": "startCount",
        "label": "Starting star count",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "endCount",
        "label": "Ending star count",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "select",
        "key": "theme",
        "label": "Theme",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "dark",
            "label": "Dark"
          }
        ],
        "type": "select"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "brandMode": "locked",
    "supportsEffects": true
  },
  {
    "id": "ms-toast",
    "source": "motion-studio",
    "motionStudioId": "Toast",
    "sourceBit": "Toast",
    "label": "Toast",
    "category": "showcase",
    "description": "A configurable notification toast that slides in from any corner with a spring, holds, then fades out.",
    "detail": "A configurable notification toast that slides in from any corner with a spring, holds, then fades out. Motion Studio scene ID: Toast. Native canvas: 1920x1080 at 60fps for 180 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Title); description: textarea (Description); position: select (Position); variant: select (Variant); durationVisibleSec: number (Visible duration (s)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "showcase",
      "toast"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "title": "Render complete",
      "description": "Your 30-second video is ready to download.",
      "position": "bottom-right",
      "variant": "success",
      "showIcon": true,
      "durationVisibleSec": 2
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "textarea",
        "key": "description",
        "label": "Description",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "select",
        "key": "position",
        "label": "Position",
        "options": [
          {
            "value": "top-left",
            "label": "Top left"
          },
          {
            "value": "top-center",
            "label": "Top center"
          },
          {
            "value": "top-right",
            "label": "Top right"
          },
          {
            "value": "bottom-left",
            "label": "Bottom left"
          },
          {
            "value": "bottom-center",
            "label": "Bottom center"
          },
          {
            "value": "bottom-right",
            "label": "Bottom right"
          }
        ],
        "type": "select"
      },
      {
        "kind": "select",
        "key": "variant",
        "label": "Variant",
        "options": [
          {
            "value": "info",
            "label": "Info"
          },
          {
            "value": "success",
            "label": "Success"
          },
          {
            "value": "warning",
            "label": "Warning"
          },
          {
            "value": "error",
            "label": "Error"
          }
        ],
        "type": "select"
      },
      {
        "kind": "number",
        "key": "durationVisibleSec",
        "label": "Visible duration (s)",
        "min": 0.5,
        "max": 10,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-perspective-marquee",
    "source": "motion-studio",
    "motionStudioId": "PerspectiveMarquee",
    "sourceBit": "PerspectiveMarquee",
    "label": "Perspective Marquee",
    "category": "showcase",
    "description": "A single tilted row of display type that scrolls toward a vanishing point with per-item depth-of-field blur.",
    "detail": "A single tilted row of display type that scrolls toward a vanishing point with per-item depth-of-field blur. Motion Studio scene ID: PerspectiveMarquee. Native canvas: 1920x1080 at 60fps for 240 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: items: textarea (Items (comma-separated)); speedPxPerFrame: number (Speed (px/frame)); perspective: number (Perspective (px)); rotateY: number (Tilt Y (deg)); rotateX: number (Tilt X (deg)); fontSize: number (Font size); fontWeight: number (Font weight); textTransform: select (Case). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "showcase",
      "perspective-marquee"
    ],
    "defaultDurationInFrames": 240,
    "defaultProps": {
      "items": "Cinematic, Open source, Browser-rendered, 60fps, MIT, Copy-paste, Remotion, Typed, Composable, Zero-config, Production-ready",
      "speedPxPerFrame": 2,
      "perspective": 1200,
      "rotateY": -28,
      "rotateX": 8,
      "fontSize": 168,
      "fontWeight": 700,
      "textTransform": "none"
    },
    "controls": [
      {
        "kind": "textarea",
        "key": "items",
        "label": "Items (comma-separated)",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "number",
        "key": "speedPxPerFrame",
        "label": "Speed (px/frame)",
        "min": 0.25,
        "max": 8,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "perspective",
        "label": "Perspective (px)",
        "min": 400,
        "max": 3000,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "rotateY",
        "label": "Tilt Y (deg)",
        "min": -60,
        "max": 60,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "rotateX",
        "label": "Tilt X (deg)",
        "min": -30,
        "max": 30,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "fontSize",
        "label": "Font size",
        "min": 60,
        "max": 400,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "fontWeight",
        "label": "Font weight",
        "min": 100,
        "max": 900,
        "type": "number"
      },
      {
        "kind": "select",
        "key": "textTransform",
        "label": "Case",
        "options": [
          {
            "value": "none",
            "label": "As typed"
          },
          {
            "value": "uppercase",
            "label": "UPPERCASE"
          }
        ],
        "type": "select"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-bar-chart",
    "source": "motion-studio",
    "motionStudioId": "BarChart",
    "sourceBit": "BarChart",
    "label": "Bar Chart",
    "category": "data",
    "description": "An animated bar chart with staggered grow-up bars, optional axes, gridlines, and value labels.",
    "detail": "An animated bar chart with staggered grow-up bars, optional axes, gridlines, and value labels. Motion Studio scene ID: BarChart. Native canvas: 1920x1080 at 60fps for 180 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Title); caption: text (Caption); labels: text (Labels (comma-separated)); values: text (Values (comma-separated numbers)); showAxes: switch (Show axes); showGrid: switch (Show grid); showValues: switch (Show values). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "data",
      "bar-chart"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "title": "Monthly active users",
      "caption": "Past 6 months · in thousands",
      "labels": "Jan, Feb, Mar, Apr, May, Jun",
      "values": "42, 58, 49, 73, 84, 96",
      "showAxes": true,
      "showGrid": true,
      "showValues": true
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "caption",
        "label": "Caption",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "labels",
        "label": "Labels (comma-separated)",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "values",
        "label": "Values (comma-separated numbers)",
        "type": "text"
      },
      {
        "kind": "switch",
        "key": "showAxes",
        "label": "Show axes",
        "type": "switch"
      },
      {
        "kind": "switch",
        "key": "showGrid",
        "label": "Show grid",
        "type": "switch"
      },
      {
        "kind": "switch",
        "key": "showValues",
        "label": "Show values",
        "type": "switch"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-line-chart",
    "source": "motion-studio",
    "motionStudioId": "LineChart",
    "sourceBit": "LineChart",
    "label": "Line Chart",
    "category": "data",
    "description": "A smooth line chart that draws itself in left-to-right with springy data point dots and optional gridlines.",
    "detail": "A smooth line chart that draws itself in left-to-right with springy data point dots and optional gridlines. Motion Studio scene ID: LineChart. Native canvas: 1920x1080 at 60fps for 200 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Title); caption: text (Caption); labels: text (Labels (comma-separated)); values: text (Values (comma-separated)); showAxes: switch (Show axes); showGrid: switch (Show grid); showDots: switch (Show dots). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "data",
      "line-chart"
    ],
    "defaultDurationInFrames": 200,
    "defaultProps": {
      "title": "Revenue",
      "caption": "Last 12 weeks · USD",
      "labels": "W1, W2, W3, W4, W5, W6, W7, W8, W9, W10, W11, W12",
      "values": "12, 18, 24, 22, 31, 38, 44, 49, 55, 62, 71, 88",
      "showAxes": true,
      "showGrid": true,
      "showDots": true
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "caption",
        "label": "Caption",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "labels",
        "label": "Labels (comma-separated)",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "values",
        "label": "Values (comma-separated)",
        "type": "text"
      },
      {
        "kind": "switch",
        "key": "showAxes",
        "label": "Show axes",
        "type": "switch"
      },
      {
        "kind": "switch",
        "key": "showGrid",
        "label": "Show grid",
        "type": "switch"
      },
      {
        "kind": "switch",
        "key": "showDots",
        "label": "Show dots",
        "type": "switch"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-area-chart",
    "source": "motion-studio",
    "motionStudioId": "AreaChart",
    "sourceBit": "AreaChart",
    "label": "Area Chart",
    "category": "data",
    "description": "A line chart filled with a soft gradient underneath, sweeping up from the baseline as the data reveals.",
    "detail": "A line chart filled with a soft gradient underneath, sweeping up from the baseline as the data reveals. Motion Studio scene ID: AreaChart. Native canvas: 1920x1080 at 60fps for 180 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Title); caption: text (Caption); labels: text (Labels); values: text (Values); showAxes: switch (Show axes); showGrid: switch (Show grid). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "data",
      "area-chart"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "title": "Signups",
      "caption": "Last 8 weeks",
      "labels": "W1, W2, W3, W4, W5, W6, W7, W8",
      "values": "120, 145, 132, 168, 195, 224, 270, 312",
      "showAxes": true,
      "showGrid": true
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "caption",
        "label": "Caption",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "labels",
        "label": "Labels",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "values",
        "label": "Values",
        "type": "text"
      },
      {
        "kind": "switch",
        "key": "showAxes",
        "label": "Show axes",
        "type": "switch"
      },
      {
        "kind": "switch",
        "key": "showGrid",
        "label": "Show grid",
        "type": "switch"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-pie-chart",
    "source": "motion-studio",
    "motionStudioId": "PieChart",
    "sourceBit": "PieChart",
    "label": "Pie Chart",
    "category": "data",
    "description": "A pie / donut chart that sweeps each slice in clockwise, with a legend and an optional total in the center.",
    "detail": "A pie / donut chart that sweeps each slice in clockwise, with a legend and an optional total in the center. Motion Studio scene ID: PieChart. Native canvas: 1920x1080 at 60fps for 200 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Title); caption: text (Caption); labels: text (Labels); values: text (Values); donut: switch (Donut); showLegend: switch (Show legend). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "data",
      "pie-chart"
    ],
    "defaultDurationInFrames": 200,
    "defaultProps": {
      "title": "Traffic sources",
      "caption": "Last 30 days",
      "labels": "Organic, Direct, Referral, Social, Paid",
      "values": "42, 24, 14, 12, 8",
      "donut": true,
      "showLegend": true
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "caption",
        "label": "Caption",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "labels",
        "label": "Labels",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "values",
        "label": "Values",
        "type": "text"
      },
      {
        "kind": "switch",
        "key": "donut",
        "label": "Donut",
        "type": "switch"
      },
      {
        "kind": "switch",
        "key": "showLegend",
        "label": "Show legend",
        "type": "switch"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-radar-chart",
    "source": "motion-studio",
    "motionStudioId": "RadarChart",
    "sourceBit": "RadarChart",
    "label": "Radar Chart",
    "category": "data",
    "description": "A radar chart that expands each axis outward simultaneously to reveal a filled polygon footprint.",
    "detail": "A radar chart that expands each axis outward simultaneously to reveal a filled polygon footprint. Motion Studio scene ID: RadarChart. Native canvas: 1920x1080 at 60fps for 200 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Title); caption: text (Caption); labels: text (Axes (comma-separated)); values: text (Values (comma-separated)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "data",
      "radar-chart"
    ],
    "defaultDurationInFrames": 200,
    "defaultProps": {
      "title": "Engineering audit",
      "caption": "Score by category · out of 100",
      "labels": "Speed, Quality, Reliability, Tests, Docs, DX",
      "values": "78, 92, 84, 65, 70, 88"
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "caption",
        "label": "Caption",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "labels",
        "label": "Axes (comma-separated)",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "values",
        "label": "Values (comma-separated)",
        "type": "text"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-radial-chart",
    "source": "motion-studio",
    "motionStudioId": "RadialChart",
    "sourceBit": "RadialChart",
    "label": "Radial Chart",
    "category": "data",
    "description": "A single-stat radial gauge that sweeps an arc to a target percentage with the count rolling up in the middle.",
    "detail": "A single-stat radial gauge that sweeps an arc to a target percentage with the count rolling up in the middle. Motion Studio scene ID: RadialChart. Native canvas: 1920x1080 at 60fps for 180 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: title: text (Title); caption: text (Caption); label: text (Centered label); value: number (Value); max: number (Max); unit: text (Unit (e.g. %)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "data",
      "radial-chart"
    ],
    "defaultDurationInFrames": 180,
    "defaultProps": {
      "title": "Conversion rate",
      "caption": "Q4 target · in progress",
      "label": "of monthly goal",
      "value": 76,
      "max": 100,
      "unit": "%"
    },
    "controls": [
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "caption",
        "label": "Caption",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "label",
        "label": "Centered label",
        "type": "text"
      },
      {
        "kind": "number",
        "key": "value",
        "label": "Value",
        "min": 0,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "max",
        "label": "Max",
        "min": 1,
        "type": "number"
      },
      {
        "kind": "text",
        "key": "unit",
        "label": "Unit (e.g. %)",
        "type": "text"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  },
  {
    "id": "ms-showcase",
    "source": "motion-studio",
    "motionStudioId": "Showcase",
    "sourceBit": "Showcase",
    "label": "Showcase Frame",
    "category": "frames",
    "description": "A presentation frame with eyebrow, title, caption, and a configurable backdrop — wraps any other scene inside a video / browser / minimal / floating frame.",
    "detail": "A presentation frame with eyebrow, title, caption, and a configurable backdrop — wraps any other scene inside a video / browser / minimal / floating frame. Motion Studio scene ID: Showcase. Native canvas: 1920x1080 at 60fps for 240 frames. Brandable scene: prefer backgroundColor, textColor, accentColor, and fontFamily when available. Editable fields: eyebrow: text (Eyebrow); title: text (Title); caption: textarea (Caption); childCompositionId: composition (Showcased component); frameStyle: select (Frame style); backdrop: select (Backdrop); backdropImage: image (Backdrop image); backdropColorA: color (Backdrop color A); backdropColorB: color (Backdrop color B); borderColor: color (Frame border); cornerRadius: number (Frame radius); innerScale: number (Frame size (0–1)); shadowIntensity: number (Shadow intensity (0–1)). Use the exact prop keys from fields/defaultProps. For unknown complex props, fetch details and update only the relevant nested data.",
    "tags": [
      "motion-studio",
      "frames",
      "showcase"
    ],
    "defaultDurationInFrames": 240,
    "defaultProps": {
      "eyebrow": "Featured component",
      "title": "Built for shipping reels.",
      "caption": "Wrap any scene inside a configurable showcase frame.",
      "childCompositionId": "BarChart",
      "frameStyle": "video",
      "backdrop": "dotted",
      "backdropImage": "",
      "backdropColorA": "#f6f8fa",
      "backdropColorB": "#e9ecef",
      "innerScale": 0.74,
      "cornerRadius": 20,
      "shadowIntensity": 0.6,
      "borderColor": "#e5e7eb"
    },
    "controls": [
      {
        "kind": "text",
        "key": "eyebrow",
        "label": "Eyebrow",
        "type": "text"
      },
      {
        "kind": "text",
        "key": "title",
        "label": "Title",
        "type": "text"
      },
      {
        "kind": "textarea",
        "key": "caption",
        "label": "Caption",
        "rows": 2,
        "type": "textarea"
      },
      {
        "kind": "composition",
        "key": "childCompositionId",
        "label": "Showcased component",
        "exclude": [
          "Showcase",
          "PhoneFrame",
          "LaptopFrame",
          "SplitScene"
        ],
        "type": "composition"
      },
      {
        "kind": "select",
        "key": "frameStyle",
        "label": "Frame style",
        "options": [
          {
            "value": "video",
            "label": "Video player"
          },
          {
            "value": "browser",
            "label": "Browser window"
          },
          {
            "value": "minimal",
            "label": "Minimal (just rounded)"
          },
          {
            "value": "floating",
            "label": "Floating (no border)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "select",
        "key": "backdrop",
        "label": "Backdrop",
        "options": [
          {
            "value": "dotted",
            "label": "Dotted pattern"
          },
          {
            "value": "grid",
            "label": "Grid pattern"
          },
          {
            "value": "gradient",
            "label": "Gradient"
          },
          {
            "value": "image",
            "label": "Image"
          },
          {
            "value": "solid",
            "label": "Solid (no pattern)"
          }
        ],
        "type": "select"
      },
      {
        "kind": "image",
        "key": "backdropImage",
        "label": "Backdrop image",
        "placeholder": "Used when Backdrop = Image",
        "type": "image"
      },
      {
        "kind": "color",
        "key": "backdropColorA",
        "label": "Backdrop color A",
        "type": "color"
      },
      {
        "kind": "color",
        "key": "backdropColorB",
        "label": "Backdrop color B",
        "type": "color"
      },
      {
        "kind": "color",
        "key": "borderColor",
        "label": "Frame border",
        "type": "color"
      },
      {
        "kind": "number",
        "key": "cornerRadius",
        "label": "Frame radius",
        "min": 0,
        "max": 80,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "innerScale",
        "label": "Frame size (0–1)",
        "min": 0.3,
        "max": 1,
        "type": "number"
      },
      {
        "kind": "number",
        "key": "shadowIntensity",
        "label": "Shadow intensity (0–1)",
        "min": 0,
        "max": 1,
        "type": "number"
      }
    ],
    "defaultBox": "full-frame",
    "nativeSize": {
      "width": 1920,
      "height": 1080,
      "fps": 60
    },
    "supportsEffects": true
  }
] as const satisfies readonly MotionDesignTemplate[];

export const motionStudioEffects = [
  {
    "id": "Pop",
    "title": "Pop in",
    "description": "Spring-overshoot scale entrance.",
    "trigger": "enter",
    "defaultProps": {
      "intensity": 0.5,
      "durationInFrames": 24,
      "delayInFrames": 0
    },
    "fields": [
      {
        "kind": "number",
        "key": "intensity",
        "label": "Intensity",
        "min": 0,
        "max": 1
      },
      {
        "kind": "number",
        "key": "durationInFrames",
        "label": "Duration (frames)",
        "min": 4,
        "max": 120
      },
      {
        "kind": "number",
        "key": "delayInFrames",
        "label": "Delay (frames)",
        "min": 0,
        "max": 240
      }
    ]
  },
  {
    "id": "SlideOut",
    "title": "Slide out",
    "description": "Slide off-screen at the end of the clip.",
    "trigger": "exit",
    "defaultProps": {
      "direction": "up",
      "distance": 240,
      "durationInFrames": 24
    },
    "fields": [
      {
        "kind": "select",
        "key": "direction",
        "label": "Direction",
        "options": [
          {
            "value": "up",
            "label": "Up"
          },
          {
            "value": "down",
            "label": "Down"
          },
          {
            "value": "left",
            "label": "Left"
          },
          {
            "value": "right",
            "label": "Right"
          }
        ]
      },
      {
        "kind": "number",
        "key": "distance",
        "label": "Distance (px)",
        "min": 0,
        "max": 2000
      },
      {
        "kind": "number",
        "key": "durationInFrames",
        "label": "Duration (frames)",
        "min": 4,
        "max": 240
      }
    ]
  },
  {
    "id": "ZoomOut",
    "title": "Zoom out",
    "description": "Scale and fade at the end. Set toScale greater than 1 to zoom forward.",
    "trigger": "exit",
    "defaultProps": {
      "toScale": 0.6,
      "durationInFrames": 24
    },
    "fields": [
      {
        "kind": "number",
        "key": "toScale",
        "label": "To scale",
        "min": 0.1,
        "max": 4
      },
      {
        "kind": "number",
        "key": "durationInFrames",
        "label": "Duration (frames)",
        "min": 4,
        "max": 240
      }
    ]
  },
  {
    "id": "FadeOut",
    "title": "Fade out",
    "description": "Fade to transparent at the end of the clip.",
    "trigger": "exit",
    "defaultProps": {
      "durationInFrames": 18
    },
    "fields": [
      {
        "kind": "number",
        "key": "durationInFrames",
        "label": "Duration (frames)",
        "min": 2,
        "max": 240
      }
    ]
  },
  {
    "id": "Shake",
    "title": "Shake",
    "description": "Continuous wiggle on x, y, or both axes.",
    "trigger": "loop",
    "defaultProps": {
      "intensity": 8,
      "frequency": 6,
      "axis": "both"
    },
    "fields": [
      {
        "kind": "number",
        "key": "intensity",
        "label": "Intensity (px)",
        "min": 0,
        "max": 60
      },
      {
        "kind": "number",
        "key": "frequency",
        "label": "Frequency (Hz)",
        "min": 1,
        "max": 30
      },
      {
        "kind": "select",
        "key": "axis",
        "label": "Axis",
        "options": [
          {
            "value": "both",
            "label": "Both"
          },
          {
            "value": "x",
            "label": "Horizontal"
          },
          {
            "value": "y",
            "label": "Vertical"
          }
        ]
      }
    ]
  },
  {
    "id": "KenBurns",
    "title": "Ken Burns",
    "description": "Slow scale and pan over the clip duration.",
    "trigger": "range",
    "defaultProps": {
      "fromScale": 1,
      "toScale": 1.15,
      "panX": 0,
      "panY": 0
    },
    "fields": [
      {
        "kind": "number",
        "key": "fromScale",
        "label": "From scale",
        "min": 0.5,
        "max": 3
      },
      {
        "kind": "number",
        "key": "toScale",
        "label": "To scale",
        "min": 0.5,
        "max": 3
      },
      {
        "kind": "number",
        "key": "panX",
        "label": "Pan X (px)",
        "min": -400,
        "max": 400
      },
      {
        "kind": "number",
        "key": "panY",
        "label": "Pan Y (px)",
        "min": -400,
        "max": 400
      }
    ]
  }
] as const satisfies readonly MotionDesignEffectDefinition[];
