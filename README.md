# ComRent - Real-Time PC Rental Dashboard

ComRent is a full-stack application designed to streamline the management of a computer rental center. It provides a real-time dashboard for monitoring PC statuses, a user-facing payment and session management interface, and a comprehensive admin panel for analytics, configuration, and control.

![](images/image0001.png)
![](images/image0002.png)
![](images/image0003.png)
![](images/image0004.png)
![](images/image0005.png)

## Description

This project simulates a real-world scenario for a PC rental business, allowing users to select available computers, make payments, and manage their sessions. Admins have a powerful backend interface to oversee operations, track revenue, manage pricing, and assist users. The application is built with a modern tech stack, prioritizing a responsive user experience and robust administrative control.

## Project Journey: From Idea to Deployment

This section details the collaborative process of building the ComRent application.

### 1. Conceptualization
The project began with a simple but powerful idea: create a real-time management dashboard for a computer rental shop. We established a core set of features to build an MVP (Minimum Viable Product):
- A "User View" with a grid of PCs showing their live status (Available, In Use, etc.).
- A "Admin View" with a detailed table to monitor and manage all PCs.
- A complete user flow: select a PC, choose a rental duration, simulate payment, and start a timed session.
- An admin panel for approving sessions, managing PC statuses, and overseeing operations.

### 2. Core Development & Iteration
With the plan in place, we built the application from the ground up using a modern tech stack. The initial development focused on creating the backend APIs to manage PC statuses, pricing, and user sessions, and building the frontend components with React, Next.js, and ShadCN UI for a clean, professional look. We established the two primary interfaces: the visual grid for users and the data-rich table for admins, along with a role-switcher to move between them.

### 3. The GitHub Authentication Challenge
A significant real-world challenge emerged when it came time to manage the code on GitHub. The initial development environment was authenticated with one GitHub account, but for deployment and ownership purposes, the code needed to be pushed to a repository under a different account.

This led to a series of classic Git authentication errors:
- **Permission Denied:** Our first attempts to `git push` were rejected because the cached credentials of the old account did not have permission to access the new repository.
- **Password Authentication Deprecation:** We then encountered GitHub's modern security policy. GitHub no longer accepts account passwords for Git operations. This required us to learn about and generate a **Personal Access Token (PAT)**.

We systematically worked through these issues by:
1.  Changing the remote URL using `git remote set-url origin`.
2.  Unsetting the Git credential helper to force a new login prompt.
3.  Generating a new PAT from the new GitHub account with the correct `repo` scopes.
4.  Using the PAT in place of a password to successfully authenticate and push the code.
5.  Finally, we collaborated the two accounts and switched the remote URL back to the original repository, solidifying our understanding of remote management in Git.

### 4. Integration and Deployment with Railway
With the code successfully on GitHub, the next step was to bring the application to life on the web. We chose **Railway** as our hosting platform. The process involved:
1.  Connecting the new GitHub repository to a Railway project.
2.  Configuring the `package.json` `start` script to `next start -p $PORT`. This is a crucial step that allows Railway to dynamically assign the correct port for the application to run on.
3.  Pushing the updated `package.json` to GitHub, which automatically triggered a new build and deployment on Railway.
4.  Generating a public domain within the Railway dashboard, making the application accessible to the world.

Through this journey, we not only built a functional application but also navigated and solved complex, real-world development and deployment challenges.


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
-   **Charting**: Recharts
-   **State Management**: React Hooks (useState, useEffect, useContext)
-   **AI Integration**: Genkit (for email generation flows)
-   **Email Sending**: Resend
-   **Deployment**: Railway

## System Requirements

-   **Node.js**: v18 or newer recommended.
-   **Package Manager**: npm, yarn, or pnpm.
-   **Web Browser**: A modern web browser like Chrome, Firefox, Safari, or Edge.


## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or newer recommended)
-   npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd comrent-firebase
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary API keys.

    ```.env
    RESEND_API_KEY=your_resend_api_key
    GEMINI_API_KEY=your_google_ai_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) to view it in your browser.

## Deployment

This application is configured for deployment on platforms like [Railway](https://railway.app/) or [Vercel](https://vercel.com/).

The `package.json` `start` script is set to `next start -p $PORT`, which allows the hosting provider to dynamically assign the port for the application to run on. Simply connect your GitHub repository to your hosting provider of choice, and it should build and deploy automatically.

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

## Troubleshooting

-   **Error "pcName is required"**: This can happen if you navigate directly to the `/payment` page without selecting a PC first. Always start from the main page.
-   **API Errors**: Ensure your `.env` file is correctly set up with the required API keys.
-   **Stale Data**: If the admin dashboard seems out of sync, use the "Refresh" button.

## Future Enhancements

-   **Full Responsive Design**: Further enhance the UI to be perfectly responsive and presentable on all mobile device sizes, ensuring users do not need "desktop mode".
-   **User Accounts**: Implement a full authentication system where users can create accounts, view their session history, and save payment methods.
-   **Real Payment Integration**: Replace the simulated payment flow with a real payment gateway like Stripe or PayPal.
-   **Advanced PC Management**: Add features for admins to remotely lock, restart, or shut down PCs.
-   **Booking/Reservation System**: Allow users to reserve a PC for a future time slot.

## Acknowledgements

-   This project was bootstrapped and developed with the assistance of Firebase Studio.
-   UI components are from the excellent [ShadCN UI](https://ui.shadcn.com/) library.
-   Icons provided by [Lucide](https://lucide.dev/).

## License

This project is open-source and available under the MIT License.
