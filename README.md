# ComRent - Real-Time PC Rental Dashboard

ComRent is a full-stack application designed to streamline the management of a computer rental center. It provides a real-time dashboard for monitoring PC statuses, a user-facing payment and session management interface, and a comprehensive admin panel for analytics, configuration, and control.

![](images/image0001.png)
![](images/image0002.png)
![](images/image0003.png)
![](images/image0004.png)
![](images/image0005.png)

## Description

This project simulates a real-world scenario for a PC rental business, allowing users to select available computers, make payments, and manage their sessions. Admins have a powerful backend interface to oversee operations, track revenue, manage pricing, and assist users. The application is built with a modern tech stack, prioritizing a responsive user experience and robust administrative control.

## Features

-   **Real-Time PC Status Grid**: Color-coded cards display the live status of each PC (Available, In Use, Pending Payment, Maintenance, etc.).
-   **User Session Flow**: Users can click an available PC to start the rental process, select session duration, and simulate a payment.
-   **Live Session Timer**: Users can see their remaining time with a live countdown timer and receive alerts as their session nears its end.
-   **Admin Dashboard**: A centralized view for admins to monitor all PCs, manually change statuses, and manage user sessions.
-   **Role-Based Views**: Easily switch between the "User" view and the "Admin" view to experience both sides of the application.
-   **Analytics & Reporting**: The admin panel includes an analytics dashboard to track total revenue, peak usage hours, payment method distribution, and more.
-   **Dynamic Pricing Management**: Admins can add, edit, or delete pricing tiers for different session durations.
-   **Email Invoice Template Editor**: Admins can edit a master template for email invoices that are sent to customers.
-   **Integrated Chat**: A built-in chat system allows users to request help and admins to respond from the dashboard.
-   **Notification System**: Admins receive real-time notifications with sound alerts for important events like new payment approvals or finished sessions.

## Technologies Used

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **UI Components**: ShadCN UI, Lucide Icons
--   **Charting**: Recharts
-   **State Management**: React Hooks (useState, useEffect, useContext)
-   **AI Integration**: Genkit (for email generation flows)
-   **Email Sending**: Resend

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or newer recommended)
-   npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/comrent.git
    cd comrent
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary API keys. The Resend API key is required for sending emails.

    ```.env
    RESEND_API_KEY=your_resend_api_key
    GEMINI_API_KEY=your_google_ai_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) to view it in your browser.

## Usage Guide

1.  **User View**:
    -   The initial page shows the grid of all PCs.
    -   Click on a green "Available" PC to start the rental process.
    -   Follow the on-screen instructions to select a duration and make a payment.
    -   Once approved by an admin, your session timer will begin.
    -   Use the chat bubble to contact an admin for assistance.

2.  **Admin View**:
    -   Click the "Switch to Admin" button on the user view.
    -   Use the sidebar to navigate between `Dashboard`, `Analytics`, `Pricing`, `Invoice Layout`, and `Audit Log`.
    -   On the `Dashboard`, you can approve pending sessions, change PC statuses, and view user details.
    -   Click a user's email in the table to generate and send an invoice.

## Project Structure

The project is organized following Next.js App Router conventions.

```
/src
├── app/                  # Main application routes
│   ├── api/              # API endpoints for backend logic
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main entry point (user/admin switcher)
├── components/           # Reusable React components
│   ├── admin/            # Components specific to the admin dashboard
│   ├── ui/               # ShadCN UI components
│   └── *.tsx             # General application components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions, types, and constants
└── ai/                   # Genkit AI flows
    ├── flows/
    └── genkit.ts
```

## Future Enhancements

-   Implement user authentication for persistent admin sessions.
-   Integrate a real database (like Firebase Firestore or a SQL database) to replace the in-memory data store.
-   Add more advanced analytics and exportable reports.
-   Allow users to extend their sessions from the payment page.

## System Requirements

-   Node.js 18.x or later
-   A modern web browser (Chrome, Firefox, Safari, Edge)

## Troubleshooting

-   **Error "pcName is required"**: This can happen if you navigate directly to the `/payment` page without selecting a PC first. Always start from the main page.
-   **API Errors**: Ensure your `.env` file is correctly set up with the required API keys.
-   **Stale Data**: If the admin dashboard seems out of sync, use the "Refresh" button.

## Acknowledgements

-   This project was bootstrapped and developed with the assistance of Firebase Studio.
-   UI components are from the excellent [ShadCN UI](https://ui.shadcn.com/) library.
-   Icons provided by [Lucide](https://lucide.dev/).

## License

This project is open-source and available under the [MIT License](LICENSE.md).
