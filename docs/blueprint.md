# **App Name**: FixFlow

## Core Features:

- Action Dashboard: Display a Kanban-style list with 'To Do', 'Waiting', and 'Ready' stacks. Includes a global search for customers by name or phone number.
- Intelligent Scanner: A component that uses the camera to scan barcodes and query the 'devices' collection. Redirects to JobHistory if found, otherwise to NewJobForm with pre-filled serial. Offers a numeric keypad fallback.
- AI-Assisted Job Entry: Integrates Genkit to process voice/text input into structured JSON for tags and urgency. Auto-selects UI Chips based on AI response for user verification. Uses a tool.
- Communication Automation: Generates a WhatsApp link with a pre-filled message on JobStatus change to 'Done', including customer name, device, cost, and job ID.
- Database Storage: Utilizes Firestore to store customer, device, and job data.
- Job Status Tracker: Allow technician to move the job status, in order to keep a better organization. Allow the job status to trigger a notification using a tool to decide when or if a certain detail needs to be informed to the client.

## Style Guidelines:

- Color scheme: Dark background (#121212) for reduced eye strain in workshop environments.
- Primary color: Electric blue (#7DF9FF) for highlighting key interactive elements.
- Accent color: Neon green (#39FF14) for calls to action and status indicators.
- Font: 'Inter' sans-serif for UI elements and forms, for a clean and modern aesthetic.
- Code font: 'Source Code Pro' for displaying any serial numbers or job IDs, where clarity is essential.
- Use simple, high-contrast icons. Icons to be used for job status and quick actions.
- Mobile-first layout with large, finger-friendly buttons and high-contrast elements for easy interaction in a busy workshop.
- Minimal animations and instant state updates to provide a snappy user experience.