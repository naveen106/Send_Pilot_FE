# Frontend Usage

BulkMailer is used to create and manage email campaigns from the web application.

## Main workflow

1. Open the app and sign in.
2. Review delivery statistics on the dashboard.
3. Add contacts or import a CSV/XLSX file.
4. Create a campaign with recipients and HTML content.
5. Send immediately or choose a schedule.
6. Review campaign status, delivery history, and failures.

## Backend connection

During local development, the frontend sends /api requests through the Vite proxy to http://localhost:5000.

For another backend URL, set VITE_API_URL in [.env](../.env), then restart the development server.

