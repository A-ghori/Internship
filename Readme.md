>     npx prisma db push
>     npx prisma db seed
>     ```
> *   **Step 3: Launch Application**
>     Initialize local tracking or deploy serverless runtimes via Vercel:
>     ```bash
>     npm run dev
>     ```
> 
> ---
> 
> ### 2. Core Technical Architecture
> 
> #### A. Allocation Algorithm (Dynamic Round-Robin)
> The system tracks assignments sequentially using stateful pointer indexes. When a customer submits a lead for a specific service category (e.g., Cleaning):
> 1. The database layer isolates active providers qualified under that explicit `serviceId`.
> 2. The assignment engine reads the current `nextIndex` from the state manager.
> 3. It assigns the lead utilizing a deterministic pointer logic, ensuring uniform and fair distribution.
> 4. The `nextIndex` pointer is updated, and the selected provider's `leadsReceived` counter is safely incremented.
> 
> #### B. Concurrency Management
> To eliminate race conditions where multiple requests hit the exact same provider allocation logic simultaneously, the infrastructure utilizes standard database primitives combined with serverless optimizations:
> *   **Prisma Layer Isolated Operations:** Multi-step writes are executed through transactional chains using atomic mutation operators (e.g., Prisma's internal numerical `increment: 1` pipeline) instead of insecure memory reading overrides.
> *   **Connection Pool Isolation:** Bypassed restrictive serialization blocks to safely run clean atomicity boundaries that fit high-concurrency cloud dynamic routers perfectly.
> 
> #### C. Webhook Idempotency Strategy
> Duplicate lead processing (such as identical form submissions or network retries) is caught and dropped safely at the engine level:
> *   **Composite Unique Constraints:** The database defines a strict multi-column index constraint: `phone_serviceId` on the `Lead` model.
> *   **Deduplication Layer:** If a user tries to submit an identical phone number under the exact same service pool within the ingestion cycle, the transaction throws a predictable unique violation constraint code (`P2002`). The API securely catches this state, returns an intelligent `409 Conflict` payload, and protects downstream assignment routines from duplicate processing.

---

## 📊 Part 3: Presentation (Markdown Structure for Interview/Pitch)

Agar woh tumse interview ya assignment panel mein is project ki presentation maangein, toh tum is structure ka use kar sakte ho. Yeh tumhari strong command ko setup karta hai:

### Slide 1: Title & Overview
*   **Heading:** Next-Gen Mini Lead Distribution System
*   **Sub-heading:** Scalable, Concurrent, and Fair Round-Robin Allocation Framework
*   **Presented By:** Shubhayu Barua
*   **Core Stack:** Next.js (App Router), Prisma ORM, Cloud PostgreSQL (Railway Engine), Tailwind CSS, Server-Sent Events (SSE).

### Slide 2: The Core Problem & Solution
*   **The Challenge:** Distributing user leads to service providers fairly, avoiding duplicate entries, handling simultaneous concurrent traffic spikes, and maintaining sub-second updates.
*   **The Architecture:** Built with an "Inventor-style" mindset—bypassing heavy abstraction layers to achieve low latency, absolute atomicity, and high availability.

### Slide 3: Algorithmic Fairness & Dynamic Real-time Engine
*   **Round-Robin Logic:** Complete separation of concerns. State vectors track distribution indexes dynamically per service type.
*   **Real-time Push Updates:** Integrated Server-Sent Events (SSE) to broadcast assignments instantly to the monitor dashboards without wasteful polling operations.

### Slide 4: Concurrency & Idempotency Engineering
*   **Race Conditions Blocked:** Atomic operations on the database cluster prevent double-allocations during high-velocity parallel requests.
*   **Idempotency Engine:** `phone_serviceId` composite unique indexes completely protect the backend from double-processing network duplicate faults.

---

Bhai, ab pure confidence ke sath form submit kar do. Ekdam clean aur expert-level answers hain, and unka system live dekh kar hiring manager impress ho jayega. All the best, fod dena!