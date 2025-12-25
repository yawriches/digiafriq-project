export interface WelcomeEmailData {
  fullName: string
  email: string
  membershipType: 'learner' | 'affiliate'
  magicLinkSent: boolean
}

export function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  const { fullName, email, membershipType } = data
  
  const membershipTitle = membershipType === 'learner' ? 'Learner' : 'Affiliate'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to DigiafrIQ - Check Your Email!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f1f3f4;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ea580c;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .welcome-message {
            margin-bottom: 30px;
        }
        .welcome-title {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 15px;
        }
        .membership-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .learner-badge {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .affiliate-badge {
            background-color: #d1fae5;
            color: #065f46;
        }
        .magic-link-section {
            background-color: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }
        .magic-link-title {
            font-size: 18px;
            font-weight: bold;
            color: #0c4a6e;
            margin-bottom: 15px;
        }
        .magic-link-text {
            color: #0c4a6e;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .email-check {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 25px 0;
        }
        .email-check-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 5px;
        }
        .email-check-text {
            color: #92400e;
            font-size: 14px;
        }
        .benefits {
            margin: 30px 0;
        }
        .benefits-title {
            font-size: 18px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
        }
        .benefit-item {
            margin-bottom: 10px;
            padding-left: 20px;
            position: relative;
        }
        .benefit-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .support-info {
            margin: 20px 0;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 6px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎓 DigiafrIQ</div>
            <div class="subtitle">Your Learning Journey Starts Here</div>
        </div>

        <div class="welcome-message">
            <h1 class="welcome-title">Welcome, ${fullName}! 🎉</h1>
            <p>Congratulations! Your <span class="membership-badge ${membershipType}-badge">${membershipTitle} Membership</span> payment was successful and your account has been created.</p>
        </div>

        <div class="magic-link-section">
            <div class="magic-link-title">🔐 Secure Login Link Sent!</div>
            <div class="magic-link-text">
                We've sent you a secure login link to access your account. 
                <br><br>
                <strong>Check your email inbox for the login link from DigiafrIQ.</strong>
            </div>
        </div>

        <div class="email-check">
            <div class="email-check-title">📧 Can't find the email?</div>
            <div class="email-check-text">
                • Check your spam/junk folder<br>
                • Make sure you're checking <strong>${email}</strong><br>
                • The email may take a few minutes to arrive<br>
                • Contact support if you don't receive it within 10 minutes
            </div>
        </div>

        <div class="benefits">
            <div class="benefits-title">What's included in your ${membershipTitle} membership:</div>
            ${membershipType === 'learner' ? `
            <div class="benefit-item">Access to all premium courses and learning materials</div>
            <div class="benefit-item">Certificates upon course completion</div>
            <div class="benefit-item">24/7 access to course content</div>
            <div class="benefit-item">Community support and discussion forums</div>
            <div class="benefit-item">Progress tracking and analytics</div>
            <div class="benefit-item">Mobile app access for learning on-the-go</div>
            ` : `
            <div class="benefit-item">High commission rates (up to 80%)</div>
            <div class="benefit-item">Recurring revenue from renewals</div>
            <div class="benefit-item">Real-time analytics dashboard</div>
            <div class="benefit-item">Marketing materials and resources</div>
            <div class="benefit-item">Dedicated affiliate support</div>
            <div class="benefit-item">Multiple payment options</div>
            `}
        </div>

        <div class="support-info">
            <strong>Need Help?</strong><br>
            Our support team is here to help you get started. Contact us at:
            <br>
            📧 Email: support@digiafriq.com
            <br>
            💬 Live Chat: Available in your dashboard
        </div>

        <div class="footer">
            <p><strong>DigiafrIQ</strong> - Empowering careers through expert-led education</p>
            <p>This email was sent because you recently purchased a membership. The login link will expire in 24 hours for security.</p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const { fullName, email, membershipType } = data
  
  const membershipTitle = membershipType === 'learner' ? 'Learner' : 'Affiliate'
  
  return `
Welcome to DigiafrIQ, ${fullName}!

Congratulations! Your ${membershipTitle} Membership payment was successful and your account has been created.

SECURE LOGIN LINK SENT
======================
We've sent you a secure login link to access your account.

CHECK YOUR EMAIL INBOX for the login link from DigiafrIQ.

Can't find the email?
• Check your spam/junk folder
• Make sure you're checking ${email}
• The email may take a few minutes to arrive
• Contact support if you don't receive it within 10 minutes

WHAT'S INCLUDED:
===============
${membershipType === 'learner' ? `
- Access to all premium courses and learning materials
- Certificates upon course completion
- 24/7 access to course content
- Community support and discussion forums
- Progress tracking and analytics
- Mobile app access for learning on-the-go
` : `
- High commission rates (up to 80%)
- Recurring revenue from renewals
- Real-time analytics dashboard
- Marketing materials and resources
- Dedicated affiliate support
- Multiple payment options
`}

NEED HELP?
==========
Our support team is here to help you get started.
Email: support@digiafriq.com
Live Chat: Available in your dashboard

Thank you for joining DigiafrIQ!

Best regards,
The DigiafrIQ Team

---
DigiafrIQ - Empowering careers through expert-led education
This email was sent because you recently purchased a membership.
The login link will expire in 24 hours for security.
  `.trim()
}
