# DEVA Creative Portfolio: Full-stack JavaScript version

This keeps the existing portfolio design and adds a Node.js/Express API for the contact form. The browser sends form data to `/api/contact`; the server validates it, rate-limits submissions, and emails it to `yesunegh63@gmail.com` using SMTP. The visitor's email is set as `Reply-To`, so you can reply directly.

## Technology

- Frontend: existing HTML, CSS, and vanilla JavaScript
- Backend: JavaScript on Node.js with Express
- Email: Nodemailer over SMTP
- API: `GET /api/health`, `POST /api/contact`

## Run locally

1. Install Node.js 20 or newer.
2. Extract the ZIP and open a terminal in this folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and configure SMTP as described below.
5. Run `npm start` and open `http://localhost:3000`.
6. Test `http://localhost:3000/api/health` to confirm the API is running.

## Configure Gmail email sending

The backend cannot send email until SMTP credentials are configured. For Gmail:

1. Enable 2-Step Verification on the Google account used to send mail.
2. Create a Google App Password in the Google Account security settings (do not use your normal Gmail password).
3. Put the 16-character app password in `SMTP_PASS` in your local `.env` file or your hosting provider's environment variables.
4. Set `SMTP_USER=yesunegh63@gmail.com`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, and `EMAIL_TO=yesunegh63@gmail.com`.
5. Restart/redeploy the server and test the contact form.

Never put the SMTP password in `index.html` or commit `.env` to GitHub. `.gitignore` excludes it. The API deliberately returns a clear configuration error if SMTP is not configured rather than pretending a message was sent.

## Deploy

This version is a Node.js server, not a static-only HTML deployment. Deploy it to a Node.js host such as Render or Railway:

- Build/install command: `npm install`
- Start command: `npm start`
- Add the environment variables listed in `.env.example` in the host dashboard.
- Use Node.js 20+.
- Open the public service URL and test `/api/health` and the contact form.

You can use Vercel with a Node serverless adaptation, but this package is configured as a persistent Express server and is simplest on a Node web-service host. Do not expect local files to persist on serverless hosts.

## API

### `GET /api/health`
Returns service status and whether SMTP environment variables are present. It does not reveal credentials.

### `POST /api/contact`
JSON body:

```json
{
  "name": "Visitor Name",
  "email": "visitor@example.com",
  "service": "Web Development",
  "budget": "$50–$100",
  "details": "I need a website for my project.",
  "website": ""
}
```

Required fields are validated, the request is limited to 5 submissions per IP every 15 minutes, and a honeypot field filters basic bots. Successful delivery returns `{ "ok": true, "message": "Your message was sent successfully." }`. Email delivery requires valid SMTP settings.

## Existing portfolio features

The original portfolio layout, navigation, filters, and sample cards are retained. The current Admin Mode video uploads still use browser-local IndexedDB, so they are not shared across visitors or stored on the server. Shared video uploads need a storage provider (such as S3-compatible storage) and authenticated admin access; those require additional configuration and should not be exposed as an unauthenticated public upload endpoint.
