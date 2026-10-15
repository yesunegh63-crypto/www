'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit').rateLimit;
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const EMAIL_TO = process.env.EMAIL_TO || 'yesunegh63@gmail.com';
const publicDir = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      mediaSrc: ["'self'", 'blob:', 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages were sent from this connection. Please try again in 15 minutes.' }
});

function clean(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function makeTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || (port === 465)).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'deva-portfolio-api', emailConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  // Honeypot: silently accept bot submissions without sending mail.
  if (clean(req.body && req.body.website, 200)) return res.status(200).json({ ok: true, message: 'Message received.' });

  const name = clean(req.body && req.body.name, 100);
  const email = clean(req.body && req.body.email, 254);
  const service = clean(req.body && req.body.service, 80);
  const budget = clean(req.body && req.body.budget, 50);
  const details = clean(req.body && req.body.details, 500);

  if (!name || !email || !service || !budget || !details) {
    return res.status(400).json({ error: 'Please complete every required field.' });
  }
  if (!validEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const allowedServices = ['Video Editing', 'Graphic Design', 'Web Development', 'Creative Digital Solutions', 'Other'];
  const allowedBudgets = ['Under $50', '$50–$100', '$100–$250', '$250–$500', '$500+', "Let's discuss"];
  if (!allowedServices.includes(service) || !allowedBudgets.includes(budget)) {
    return res.status(400).json({ error: 'Please choose a valid service and budget option.' });
  }

  const transporter = makeTransporter();
  if (!transporter) {
    console.error('Contact form email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    return res.status(503).json({ error: 'Email sending is not configured yet. Please email yesunegh63@gmail.com directly for now.' });
  }

  try {
    await transporter.sendMail({
      from: { name: 'DEVA Portfolio Contact Form', address: process.env.SMTP_USER },
      to: EMAIL_TO,
      replyTo: { name, address: email },
      subject: `Portfolio inquiry: ${service}`,
      text: [
        'New message from your DEVA Creative Portfolio',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Service: ${service}`,
        `Budget: ${budget}`,
        '',
        'Project details:',
        details
      ].join('\n'),
      headers: { 'X-Contact-Form': 'deva-portfolio' }
    });
    return res.status(200).json({ ok: true, message: 'Your message was sent successfully.' });
  } catch (error) {
    console.error('Contact email delivery failed:', error && error.message ? error.message : error);
    return res.status(502).json({ error: 'The email could not be delivered right now. Please try again later or email yesunegh63@gmail.com directly.' });
  }
});

app.use(express.static(publicDir, { extensions: ['html'], maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found.' });
  return res.sendFile(path.join(publicDir, 'index.html'), error => { if (error) next(error); });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err && err.message ? err.message : err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Unexpected server error. Please try again later.' });
});

app.listen(PORT, () => console.log(`DEVA portfolio server listening on port ${PORT}`));
