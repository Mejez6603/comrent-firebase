# **App Name**: ComRent

## Core Features:

- PC Status Monitoring: Continuously poll the server to fetch real-time status updates for each PC in the rental center.
- Status-Based PC Card Display: Display each PC as a card with color-coded status indicators (Green for Online, Blue for Using, Orange for Pending, Red for Not Available).
- Payment Screen Redirection: Redirect users to the payment screen (client.html) with the selected PC's name passed as a parameter (e.g., client.html?pc=PC1) when they click on an available (Green) PC.
- Database Synchronization: Fetch status data from a MySQL database using the PHP api, and make it available for consumption to the nextjs frontend

## Style Guidelines:

- Primary color: Dark blue (#243A73) to represent technology and reliability.
- Background color: Very light desaturated blue (#E0E5F2).
- Accent color: Purple (#6F2DBD) to draw attention to interactive elements and important status updates.
- Body and headline font: 'Inter' for a clean and modern interface. 'Inter' is a grotesque-style sans-serif that looks good on headlines or for body text.
- Use simple, clear icons to represent PC status, payment options, and other actions.
- Cards should have a clear, concise presentation.
- Subtle animations when the PC status changes.