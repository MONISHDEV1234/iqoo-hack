# MemCode React Dashboard Implementation Plan

We will build the **MemCode Dashboard** shown in the reference image step-by-step using **Vite + React (JavaScript)**. To support incremental commits, we will build, import, and render one layout section at a time.

## Feature Milestones for Incremental Commits

1. **Step 1: Layout scaffolding and Core CSS System**
   - Customize `src/index.css` with global design tokens (Deep dark theme colors, premium typography, scrolling behaviors).
   - Scaffold outer layouts in `src/App.jsx` (outer Grid framework wrapping Left Sidebar, main action header, content center, and content right).
   - Remove default Vite layout files like `src/App.css`.
   - *Commit target:* `feat: layout scaffolding and core css design system`

2. **Step 2: Sidebar Navigation Component (`src/components/Sidebar.jsx`)**
   - Brand logo "MemCode" with tech-style accents.
   - Menu items: "Live Debugger" (active), "Memory Vault", "History", and "Settings".
   - Premium icons and micro-interactions (hover, active slide effects).
   - *Commit target:* `feat: sidebar navigation component`

3. **Step 3: Main Header Component (`src/components/Header.jsx`)**
   - Error status header (Icon + title "Unhandled Promise Rejection" + file text path).
   - "Reload" button with rotating icon loader.
   - Accent button "Run Fix" with premium color gradients.
   - *Commit target:* `feat: main content header and action buttons`

4. **Step 4: Stack Trace Input & Code Context Viewer (`src/components/StackTrace.jsx`, `src/components/CodeContext.jsx`)**
   - Text container presenting formatting for the stack trace error.
   - Code box rendering file snippet (`oauth2.service.ts`), with lines 140-144, side numbers, highlights, and custom indicator comments on crash line (142).
   - *Commit target:* `feat: stack trace text and code context component`

5. **Step 5: MemCode Analysis & AI Suggested Fix (`src/components/Analysis.jsx`)**
   - Text explanation cards details.
   - Suggested fix box code snippet with hover effects and "Copy Code" copy-to-clipboard functionality.
   - *Commit target:* `feat: analysis section and code fix suggestion`

6. **Step 6: Relevant Past Solutions (`src/components/PastSolutions.jsx`)**
   - Match columns with listings (98% match, 85% match, 42% match).
   - High-fidelity visual diff showing file line modifications inside past solution cards using clean React structures.
   - *Commit target:* `feat: right sidebar past solutions match list`

7. **Step 7: Global React State & Polish**
   - Wire up dynamic React states:
     - Tapping "Run Fix" switches code context to show the fixed code layout with highlighting changes.
     - "Reload" triggers loading animations.
     - Selecting past solutions shows their custom details.
     - Fully responsive UI configuration.
   - *Commit target:* `feat: interactive logic, animations, and polish`
