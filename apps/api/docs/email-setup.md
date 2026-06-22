# 📧 Email Configuration Guide

Complete guide to configure email sending for ARKELYTHEX authentication and invoice notifications.

---

## 📋 Overview

ARKELYTHEX uses **Nodemailer** for email delivery with support for:
- ✅ Email verification (signup)
- ✅ Password reset
- ✅ Welcome emails
- ✅ Invoice notifications
- ✅ Payment confirmations

---

## ⚙️ SMTP Configuration

### 1. Environment Variables

Add these variables to `/apps/api/.env`:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# From Address
SMTP_FROM_NAME=Arkelythex
SMTP_FROM_EMAIL=noreply@arkelythexfounders.com
```

### 2. SMTP Provider Options

#### Option A: Gmail (Recommended for Development)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Use the 16-character password in `SMTP_PASS`

**Configuration:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # 16-char app password
```

#### Option B: SendGrid (Recommended for Production)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Use the API key as password

**Configuration:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx
```

#### Option C: AWS SES (Enterprise)

**Configuration:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

#### Option D: Mailgun

**Configuration:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

---

## 🧪 Testing Email Configuration

### Step 1: Run Test Script

```bash
cd apps/api
TEST_EMAIL=your-email@example.com bun src/scripts/test-email.ts
```

Expected output:
```
🧪 Testing Email Configuration...

1️⃣ Verifying SMTP connection...
✅ SMTP connection successful!

2️⃣ Sending test verification email...
✅ Verification email sent to: your-email@example.com

3️⃣ Sending test password reset email...
✅ Password reset email sent to: your-email@example.com

4️⃣ Sending test welcome email...
✅ Welcome email sent to: your-email@example.com

🎉 All email tests passed!

📬 Check your-email@example.com for test emails.
```

### Step 2: Check Inbox

You should receive 3 emails:
1. **Email Verification** (🔐 subject)
2. **Password Reset** (🔑 subject)
3. **Welcome Email** (🎉 subject)

---

## 📤 Email Templates

### Auth Emails

Templates in `/apps/api/src/services/email/auth-email-templates.ts`:

- `generateVerificationEmail()` - Email verification
- `generatePasswordResetEmail()` - Password reset
- `generateWelcomeEmail()` - Welcome after verification

### Invoice Emails

Templates in `/apps/api/src/services/email/email-templates.ts`:

- `generateInvoiceEmail()` - New invoice notification
- `generatePaymentConfirmationEmail()` - Payment received
- `generatePaymentReminderEmail()` - Payment reminder
- `generateOverdueNoticeEmail()` - Overdue notice

---

## 🎨 Email Design

All emails use the **Glass & Steel** design system:
- Dark gradient backgrounds (#0f172a → #1e293b)
- Purple accents (#667eea → #764ba2)
- Glassmorphism effects
- Mobile-responsive
- Professional Spanish language

---

## 🔧 Programmatic Usage

### Send Verification Email

```typescript
import { EmailService } from '@/services/email.service';

await EmailService.sendVerificationEmail('user@example.com', {
  userName: 'John Doe',
  verificationUrl: 'https://app.arkelythexfounders.com/verify?token=abc123',
  expiresIn: '24 horas',
});
```

### Send Password Reset

```typescript
await EmailService.sendPasswordResetEmail('user@example.com', {
  userName: 'John Doe',
  resetUrl: 'https://app.arkelythexfounders.com/reset?token=xyz456',
  expiresIn: '1 hora',
});
```

### Send Welcome Email

```typescript
await EmailService.sendWelcomeEmail('user@example.com', {
  userName: 'John Doe',
  ruc: '20123456789',
  loginUrl: 'https://app.arkelythexfounders.com/login',
});
```

---

## 🐛 Troubleshooting

### Error: "SMTP connection failed"

**Cause:** Invalid SMTP credentials or firewall blocking

**Solution:**
1. Double-check SMTP_USER and SMTP_PASS
2. Verify 2FA is enabled (Gmail)
3. Check firewall allows port 587/465
4. Try SMTP_PORT=465 with SMTP_SECURE=true

### Error: "Certificate verification failed"

**Cause:** Self-signed certificate

**Solution:**
```bash
# .env
SMTP_REJECT_UNAUTHORIZED=false  # Development only!
```

### Error: "Authentication failed"

**Cause:** Incorrect password or app password not generated

**Solution:**
1. For Gmail: Generate new app password
2. For SendGrid: Verify API key is correct
3. Check SMTP_USER format (usually full email)

### Emails Go to Spam

**Solutions:**
1. **SPF Record:** Add TXT record to DNS
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **DKIM:** Enable in email provider settings

3. **DMARC:** Add TXT record
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@arkelythexfounders.com
   ```

4. **Warm up domain:** Start with low volume, gradually increase

### No Emails Sent (No Error)

**Check:**
```typescript
// Verify connection first
const isConnected = await EmailService.verifyConnection();
console.log('SMTP connected:', isConnected);
```

---

## 📊 Production Considerations

### Rate Limiting

- Gmail: 500 emails/day (free), 2000/day (Workspace)
- SendGrid: 100 emails/day (free), unlimited (paid)
- AWS SES: 200 emails/day (free tier), pay-as-you-go

### Monitoring

Track email delivery:
```typescript
try {
  await EmailService.sendVerificationEmail(email, data);
  // Log success
} catch (error) {
  // Log failure + retry logic
  console.error('Email failed:', error);
}
```

### Fallback Strategy

Implement retry with exponential backoff:
```typescript
const retry = async (fn: () => Promise<void>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};
```

---

## ✅ Checklist

Before deploying to production:

- [ ] SMTP credentials configured in production `.env`
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] Email templates tested and reviewed
- [ ] Rate limits understood and monitored
- [ ] Error handling and retry logic implemented
- [ ] Email delivery tracking setup (SendGrid/SES)
- [ ] Unsubscribe links added (for marketing emails)
- [ ] GDPR compliance verified

---

## 📚 Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail SMTP Guide](https://support.google.com/mail/answer/7126229)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [AWS SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [Email Best Practices](https://www.mailgun.com/blog/email/email-best-practices/)

---

**Last updated:** January 25, 2026
**Maintained by:** Arkelythex Team
