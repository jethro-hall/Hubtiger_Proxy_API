# 🚲 RideAI Hubtiger Proxy API
> **The Narrative Bridge between Workshop Data and Voice AI.**

## 🎯 The Mission (The "Why")
Bike workshops are complex environments. Mechanics log technical notes like *"Waiting on CS-M8100 12spd chainring,"* and systems use rigid IDs like *"Status: 5"*. 

**The Problem:** When an ElevenLabs Voice Agent talks to a customer, it shouldn't sound like a database. It shouldn't repeat information the store already texted to the customer 10 minutes ago, and it shouldn't struggle to interpret mechanic shorthand.

**The Solution:** This Proxy acts as a **Contextual Translation Layer**. It converts raw, technical Hubtiger data into **human-friendly narratives**. It ensures the AI sounds like a knowledgeable shop manager who knows exactly who the customer is, what their bike is doing, and what has already been said.

---

## 🛠️ Core Objectives (The "How")

### 1. Contextual Intelligence
Instead of sending raw JSON to the AI, this proxy synthesizes data. 
*   **Raw:** `{ status_id: 4, tech: "D. Smith", parts_ordered: true }`
*   **Proxy Narrative:** `"The bike is currently in the stand. Dave is the mechanic, and he's just waiting on a Shimano chainring to arrive before he can finish the tune-up."`

### 2. Communication Awareness
The proxy audits the SMS and email history within Hubtiger. If the shop sent a "Delay" text an hour ago, the Proxy informs the AI: *"The customer was already notified of the delay via SMS this morning; acknowledge this so we don't sound repetitive."*

### 3. Secure Intermediation
By sitting between the open web and the Hubtiger API, we protect sensitive API keys and PII (Personally Identifiable Information), ensuring only authorized "Internal Keys" from our specific AI agents can access workshop data.

---

## 🏗️ Technical Strategy
*   **Zero-Build Architecture:** High-speed development using browser-native ESM (no Webpack/Vite confusion).
*   **Single-Root Deployment:** Optimized for lean VPS environments.
*   **Dual-Role Server:** The Node.js `server.js` serves both the management dashboard and the API endpoints.

---

## 🤖 AI Assistant System Prompt
*Copy and paste the following into ChatGPT/Claude to ensure it understands the project's soul:*

---

### **Context & Persona**
You are a World-Class Senior Full-Stack Engineer and AI Integration Specialist. You are assisting me in developing the **RideAI Hubtiger Proxy**. 

**Project Goal:** Build a "Narrative Translation Layer." We are not just moving data; we are building an engine that tells the "story" of a bike service so an ElevenLabs Voice Agent can communicate naturally.

### **Architectural Constraints**
1. **Single-Root Structure:** All files (`server.js`, `App.tsx`, `index.tsx`, `index.html`) live in the root directory. NO `src/` folder.
2. **No Build Step:** We use a browser-native **ESM Import Map** in `index.html`.
3. **Frontend:** React 19 + Tailwind CDN + Lucide-React.
4. **Backend:** Node.js Express. `server.js` is the source of truth.

### **Narrative Logic Requirement**
Every API response intended for the AI MUST include a `narrative` or `contextForAI` field. This field should be a string that summarizes the job status, mechanic notes, and communication history into a conversational "briefing."

**Current Task:** [INSERT YOUR CURRENT TASK]

---

## 🚀 Quick Start
1. Ensure `.env` contains `HUBTIGER_API_KEY` and `INTERNAL_KEY`.
2. Run `./update_server.sh`.
3. Dashboard available at: `http://agents.rideai.com.au:8095`
