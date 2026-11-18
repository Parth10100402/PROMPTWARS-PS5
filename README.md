# OpsPilot AI — Your AI Business Operations Manager

> **Hackathon:** PromptWars x Agent X 2.0  
> **Problem Statement:** PS05 – AI Operations Agent for Businesses  
> **Target Vertical:** Small & Mid-Sized Retailers and Distributors  
> **Repository:** [https://github.com/Parth10100402/promptwars-ps05-opspilot-ai-2026](https://github.com/Parth10100402/promptwars-ps05-opspilot-ai-2026)  
> **Live Production Deployment:** [https://promptwars-ps05-opspilot-ai-2026.vercel.app](https://promptwars-ps05-opspilot-ai-2026.vercel.app)  

---

## 1. Executive Summary & Problem Solved

Independent retailers and wholesale distributors operate under tight working capital and fast replenishment deadlines. Business owners juggle thousands of spreadsheets, fragmented purchase orders, customer delivery inquiries, and overdue receivables. 

Manual spreadsheet monitoring results in:
- **Catastrophic Stockouts:** High-velocity products suddenly deplete before supplier reorders arrive due to unaccounted supplier lead times.
- **Delivery SLA Breaches:** Customer orders slip past promised dates without proactive alerts, creating churn and cancellation penalties.
- **Cash Flow Deficits:** Unpaid customer invoices linger past credit terms, tying up critical purchasing capital.

**OpsPilot AI** solves this by acting as an autonomous **AI Operations Control Tower**. It ingests business datasets, executes deterministic operations rules, surfaces prioritized exceptions backed by concrete evidence, and prepares actionable human-in-the-loop workflows (Purchase Orders, Customer Follow-ups, Payment Reminders).

---

## 2. Agent Architecture & Decision-Making Pipeline

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│  Business Data  │ ──> │ CSV Validation (Zod) │ ──> │ Business Context Engine│
│ (Inv/Orders/Rev)│     │ Headers, Types, Size │     │ Enriched Run-Rates     │
└─────────────────┘     └──────────────────────┘     └────────────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│  Exception Prioritizer  │ <── │ Deterministic Rule Core│ <── │ Tool Allowlist Engine  │
│ (Critical/High/Medium)  │     │ DaysCover, SLAs, Cash  │     │ 10 Explicit Safe Tools │
└─────────────────────────┘     └────────────────────────┘     └────────────────────────┘
            │
            ▼
┌─────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│ Human Approval Queue    │ <── │ Recommendation Drafter │ <── │ Gemini 2.5 Flash Layer │
│ (HITL Consequential Ops)│     │ POs, Messages, Notices │     │ Grounded Context / NLP │
└─────────────────────────┘     └────────────────────────┘     └────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ Persistent Audit Trail  │
│ Immutable Activity Log  │
└─────────────────────────┘
```

### Deterministic Rule Engine vs. AI Explanation Layer
1. **Deterministic Rule Engine (Primary Brain):** All inventory days-of-cover, reorder shortfalls, delay durations, aging buckets, and health scores are calculated strictly via mathematical algorithms. The system never relies on generative guesses for financial or operational figures.
2. **Gemini 2.5 Flash Layer (Contextual Explanations & Q&A):** When `GEMINI_API_KEY` is provided, Gemini contextualizes findings, summarizes risk trajectories, and answers managerial inquiries via the official `@google/genai` SDK.
3. **Deterministic Fallback (Zero Downtime):** If no API key is supplied, OpsPilot seamlessly switches to its native Deterministic Rule Engine, ensuring 100% functionality without third-party dependencies.

---

## 3. Core Business Rules & Formulas

### Inventory Coverage & Reorder Formula
$$\text{Days of Coverage} = \frac{\text{Stock on Hand}}{\text{Average Daily Sales}}$$

$$\text{Target Stock} = \text{Target Cover Days} \times \text{Average Daily Sales}$$

$$\text{Recommended Reorder Quantity} = \max(0, \text{Target Stock} - \text{Stock on Hand} - \text{Incoming Stock})$$

- **Critical Stockout Risk:** $\text{Days of Coverage} < \text{Lead Time Days}$ (The product will deplete before a new order can arrive).
- **High Risk:** $\text{Days of Coverage} < \text{Lead Time Days} + \text{Safety Stock Days}$ (Buffer stock will be breached).
- **Medium Risk:** $\text{Days of Coverage} < \text{Target Cover Days}$.
- **Healthy:** $\text{Days of Coverage} \ge \text{Target Cover Days}$.

### Delayed Customer Order Rule
$$\text{Is Delayed} \iff \text{Promised Date} < \text{Current Reference Date} \land \text{Status} \notin \{\text{'delivered'}, \text{'cancelled'}\}$$

$$\text{Delay Days} = \text{Current Reference Date} - \text{Promised Date}$$

### Receivables Overdue Rule
$$\text{Is Overdue} \iff \text{Due Date} < \text{Current Reference Date} \land \text{Status} \in \{\text{'unpaid'}, \text{'overdue'}, \text{'disputed'}\}$$

$$\text{Overdue Days} = \text{Current Reference Date} - \text{Due Date}$$

### Business Health Score (0 - 100)
$$\text{Health Score} = 0.35 \times \text{Inventory Score} + 0.35 \times \text{Fulfillment Score} + 0.30 \times \text{Receivables Score}$$

---

## 4. Product Modules

| Module | Features & Capabilities |
| :--- | :--- |
| **Module A — Executive Dashboard** | Real-time Operations Pulse, 8 dynamic KPI cards, 14-day revenue trend area chart, catalog risk distribution donut chart, exception priority feed, and operator quick actions. |
| **Module B — Inventory Intelligence** | Real-time days-of-cover calculator, reorder quantity estimation, category filtering, multi-column sorting, and supplier details. |
| **Module C — Order Management** | Customer promised delivery SLA tracking, automated delay duration detection, and simulated customer message drafts. |
| **Module D — Receivables & Invoices** | Accounts receivable aging buckets (Current, 1-7d, 8-14d, 15+d), overdue duration tracking, and draft payment reminder templates. |
| **Module E — AI Agent Center** | One-click **"RUN AI OPERATIONS ANALYSIS"** with live pipeline steps, comprehensive exception feed with concrete data evidence, business impact, and confidence ratings. |
| **Module F — Ask OpsPilot Assistant** | Natural language conversational Q&A grounded strictly in loaded business facts, anti-hallucination guardrails, and quick suggestion chips. |
| **Module G — Action Approval Center** | **Human-in-the-Loop (HITL)** governance. Review, approve ("Approved — Demo Mode"), or reject draft purchase orders and notifications with full audit preservation. |
| **Module H — Audit & Activity Center** | Immutable timeline capturing all analysis runs, exception detections, action proposals, approvals, and CSV sync events. |
| **Data Ingestion** | Drag-and-drop CSV upload for 4 datasets, header & schema validation, 2 MB / 20k rows safeguard, downloadable templates, and one-click demo dataset reset. |

---

## 5. Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts.
- **Backend & APIs:** Next.js Route Handlers (`/api/agent/analyze`, `/api/agent/ask`, `/api/health`), Zod schema validation.
- **AI Integration:** Google Gemini API via the official `@google/genai` SDK with deterministic fallback mode.
- **Data & Storage:** PapaParse for fast CSV parsing, client-side browser localStorage persistence.
- **Testing:** Vitest (21 comprehensive unit and integration tests across 5 test suites).
- **Deployment & Tooling:** GitHub CLI (`gh`), Vercel Production Deployment, Node.js 24+.

---

## 6. Installation & Local Setup

### Prerequisites
- Node.js >= 20.x (Recommended: v22 or v24)
- npm >= 10.x

### Step-by-Step Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Parth10100402/promptwars-ps05-opspilot-ai-2026.git
   cd promptwars-ps05-opspilot-ai-2026
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables (Optional):**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Gemini API Key if you want AI-assisted explanations:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
   *Note: If no API key is provided, OpsPilot automatically operates in 100% Deterministic Rule Engine mode.*

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Verification & Testing

OpsPilot includes 21 unit and integration tests verifying all 15 operational requirements:

```bash
# Run unit and integration tests
npm run test

# Run TypeScript typecheck
npm run typecheck

# Run ESLint validation
npm run lint

# Verify repository size (< 10 MB limit)
node scripts/check-repo-size.mjs

# Run production build
npm run build
```

### Verified Test Matrix
- Low stock detection below supplier lead time.
- Healthy inventory classification above target cover.
- Days-of-cover formula calculation (`stockOnHand / avgDailySales`).
- Reorder quantity formula (`max(0, targetStock - stockOnHand - incomingStock)`).
- Delayed customer order identification.
- Paid invoice exclusion from overdue flags.
- Overdue invoice detection and aging categorization.
- Sales volume anomaly surge detection (>1.8x baseline).
- Empty dataset safety and zero divisor protection.
- Duplicate identifier rejection (SKU, orderId, invoiceId).
- Malformed CSV rejection and header mismatch alerts.
- Recommendation generation for critical exceptions.
- Approval and rejection state transitions with reason tracking.
- Immutable audit trail generation with actor tagging.
- Deterministic fallback when Gemini API key is absent.

---

## 8. CSV Data Schemas & Templates

OpsPilot supports 4 standardized CSV formats (templates downloadable in-app):

1. **Inventory (`inventory.csv`):**
   `sku, productName, category, stockOnHand, avgDailySales, leadTimeDays, safetyStockDays, targetCoverDays, incomingStock, unitCost, supplierName`
2. **Sales (`sales.csv`):**
   `date, sku, units, revenue`
3. **Orders (`orders.csv`):**
   `orderId, customerName, orderDate, promisedDate, status, amount`
4. **Invoices (`invoices.csv`):**
   `invoiceId, customerName, issueDate, dueDate, amount, status`

---

## 9. Security & Safety Disclosures

- **Human-in-the-Loop Safeguards:** All purchase orders, customer notifications, and invoice reminder drafts require explicit operator approval. Approved items are tagged as `Approved — Demo Mode`. No real financial transactions or external emails are ever dispatched.
- **Server-Side API Security:** Google Gemini API keys are strictly evaluated on server-side Route Handlers and never exposed to the browser client.
- **Privacy & PII Protection:** Customer names and contact details are redacted from external LLM prompts. Only anonymized operational facts are provided.
- **Prompt Injection Defense:** Uploaded CSV data and customer messages are parsed strictly as untrusted data strings, never interpreted as system instructions.
- **Safe Payload Constraints:** File uploads are limited to 2 MB and 20,000 rows.

---

## 10. License

Built for **PromptWars x Agent X 2.0 (Problem Statement PS05)**. MIT License.
