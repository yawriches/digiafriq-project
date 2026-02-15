/// <reference lib="dom" />

declare const Deno: {
  env: { get(key: string): string | undefined }
  readTextFile(path: string): Promise<string>
}

import { serve } from 'std/http/server'

const TEMPLATES: Record<
  'signup.html'
  | 'signup-referral.html'
  | 'commission.html'
  | 'membership-purchase.html'
  | 'membership-upgrade.html'
  | 'membership-expiry-warning.html'
  | 'membership-expired.html'
  | 'payout.html'
  | 'payout-request.html',
  string
> = {
  'signup.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Digiafriq — Your Account is Ready</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 24px; background:#ea580c; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; transition:all 0.2s ease; }
    .cta:hover { background:#dc2626; transform:translateY(-1px); }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="Digiafriq" class="logo">
    </div>
    <div class="content">
      <h1>Welcome to Digiafriq,</h1>

      <p>Hi {{name}}</p>

      <p>Your account has been successfully created. We're glad to have you on board.</p>

      <p>You can now log in to your dashboard and begin exploring the opportunities available on Digiafriq.</p>

      <a href="https://digiafriq.com" class="cta">Log In to Your Account</a>

      <p>If you need any assistance, our support team is always available to help.</p>

      <p>For support, contact us at: <a href="mailto:support@digiafriq.com">support@digiafriq.com</a></p>

      <p>Kind regards,<br />The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} Digiafriq. All rights reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>
`,
  'signup-referral.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to DigiafrIQ — Referred Account Ready</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 24px; background:#ea580c; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; transition:all 0.2s ease; }
    .cta:hover { background:#dc2626; transform:translateY(-1px); }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="DigiafrIQ" class="logo">
    </div>
    <div class="content">
      <h1>Welcome to Digiafriq,</h1>

      <p>Hi {{name}}</p>

      <p>Your account has been successfully created. Below are your login details:</p>

      <div class="divider"></div>

      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Temporary Password:</strong> {{temporaryPassword}}</p>

      <p>Please use this temporary password to log in for the first time. For security reasons, we recommend changing it after your initial login.</p>

      <p>You can now access your dashboard and begin exploring Digiafriq.</p>

      <a href="{{loginUrl}}" class="cta">Log In to Your Account</a>

      <p>If you need any assistance, our support team is available to help.</p>

      <p>Kind regards,<br />The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} DigiafrIQ. All rights reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>
`,
  'commission.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🎉 Congratulations!! New Purchase Confirmed on Digiafriq 🥳</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 24px; background:#ea580c; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; transition:all 0.2s ease; }
    .cta:hover { background:#dc2626; transform:translateY(-1px); }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .amount-box { margin:24px 0; padding:22px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; text-align:center; }
    .amount-label { font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; margin:0 0 8px 0; }
    .amount-value { font-size:40px; line-height:1.1; font-weight:800; color:#0f172a; margin:0; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="Digiafriq" class="logo">
    </div>
    <div class="content">
      <p><strong>New purchase commission</strong> <span class="emoji">🎉</span></p>

      <h1>Congratulations!! <span class="emoji">🥳</span></h1>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>Great news! A new purchase of <strong>{{productName}}</strong> has been successfully recorded under your Digiafriq account.</p>

      <div class="amount-box">
        <p class="amount-label">Commission Amount</p>
        <p class="amount-value">₵{{commissionAmount}}</p>
      </div>

      <p>You're doing an amazing job — keep closing sales and building your digital income <span class="emoji">🚀</span></p>

      <p>Every sale brings you one step closer to your goals.</p>

      <div class="divider"></div>

      <div class="section-title">🌍 Join the Digiafriq Community</div>
      <p>Be part of our growing community where you can:</p>
      <p>
        Connect with fellow learners and digital entrepreneurs<br />
        Interact with platform mentors and founders<br />
        Get tips, updates, and support to grow faster
      </p>
      <p>👉 Join the community here: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <div class="divider"></div>

      <div class="section-title">🛠 Need Help?</div>
      <p>If you have questions or need assistance, please reach us only via:</p>
      <p>
        📧 Email: <a href="mailto:support@digiafriq.com">support@digiafriq.com</a><br />
        🐦 Twitter (X): <a href="https://x.com/digiafriq" target="_blank" rel="noopener noreferrer">@digiafriq</a>
      </p>

      <p>We're committed to your success <span class="emoji">💯</span></p>

      <p>Best regards,<br />The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} Digiafriq. All rights reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>
`,
  'membership-purchase.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🎉 Congratulations!! New Purchase Confirmed on Digiafriq 🥳</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 24px; background:#ea580c; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; transition:all 0.2s ease; }
    .cta:hover { background:#dc2626; transform:translateY(-1px); }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="Digiafriq" class="logo">
    </div>
    <div class="content">
      <h1><span class="emoji">🎉</span> Congratulations!! <span class="emoji">🥳</span></h1>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>We're thrilled to confirm your purchase of the <strong>{{packageName}}</strong> on Digiafriq! 🎊</p>

      <p>Your membership is now active and you have full access to all the features and benefits included in your package.</p>

      <div class="divider"></div>

      <div class="section-title">What's Next?</div>
      <p>👉 Access your dashboard to explore your new features and get started:</p>

      <a href="https://digiafriq.com/login" class="cta">Go to Your Dashboard</a>

      <p>👉 Join our community to connect with other members and stay updated:</p>

      <p><strong>Join the Digiafriq Community</strong><br />
      👉 Join the community: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <p>If you have any questions or need assistance getting started, our support team is here to help you every step of the way.</p>

      <p>For support, contact us at: <a href="mailto:support@digiafriq.com">support@digiafriq.com</a></p>

      <p>Thank you for choosing Digiafriq. We're excited to be part of your journey! 🚀</p>

      <p>Warm regards,<br />Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} Digiafriq. All rights reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>`,
  'membership-upgrade.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Digiafriq Membership Has Been Upgraded 🎉</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 24px; background:#ea580c; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; transition:all 0.2s ease; }
    .cta:hover { background:#dc2626; transform:translateY(-1px); }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="Digiafriq" class="logo">
    </div>
    <div class="content">
      <h1><span class="emoji">🎉</span> Your Membership Has Been Upgraded! <span class="emoji">🚀</span></h1>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>Congratulations! Your membership has been successfully upgraded from <strong>{{oldPackageName}}</strong> to <strong>{{newPackageName}}</strong>. 🎊</p>

      <p>You now have access to all the enhanced features and benefits included in your new membership level.</p>

      <div class="divider"></div>

      <div class="section-title">What's Next?</div>
      <p>👉 Access your dashboard to explore your new features and get started:</p>

      <a href="https://digiafriq.com/login" class="cta">Go to Your Dashboard</a>

      <p>👉 Join our community to connect with other members and stay updated:</p>

      <p><strong>Join the Digiafriq Community</strong><br />
      👉 Join the community: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <p>If you have any questions about your new membership or need assistance getting started, our support team is here to help you every step of the way.</p>

      <p>For support, contact us at: <a href="mailto:support@digiafriq.com">support@digiafriq.com</a></p>

      <p>Thank you for upgrading with Digiafriq. We're excited to support your continued journey! 🚀</p>

      <p>Warm regards,<br />Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} Digiafriq. All rights reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>`,
  'payout.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payout Confirmation - DigiafrIQ</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 24px; background:#ea580c; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; transition:all 0.2s ease; }
    .cta:hover { background:#dc2626; transform:translateY(-1px); }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .note { margin-top:20px; padding:16px 18px; border-left:4px solid #f59e0b; background:#fffbeb; border-radius:10px; color:#92400e; font-size:14px; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="DigiafrIQ" class="logo">
    </div>
    <div class="content">
      <h1>Payment Alert <span class="emoji">💥</span> Boom! You've Been Paid <span class="emoji">🥳</span></h1>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>Big win! <span class="emoji">💥</span>Blessings Overflow <span class="emoji">🚀</span></p>

      <p>We're happy to inform you that a payment of <strong>{{currency}}{{amount}}</strong> has been successfully initiated under your Digiafriq account.</p>

      <p><strong>Transaction ID:</strong> {{referenceId}}</p>

      <div class="note">
        <strong>Important Note:</strong><br />
        This email confirms that your payment is currently being processed. Bank credit alerts may take some time due to network or banking delays, but rest assured, your funds will be credited to you.
      </div>

      <p>You did great and this is just one of many wins ahead <span class="emoji">🚀</span><br />
      Keep pushing. Keep earning.</p>

      <p>—<br />
      Love from the Digiafriq Team</p>

      <div class="divider"></div>

      <div class="section-title">🌍 Join the Digiafriq Community</div>

      <p>Be part of our exclusive community where you can:</p>

      <p>
        Connect with fellow digital earners and professionals<br />
        Interact with platform mentors and founders<br />
        Stay informed, supported, and inspired
      </p>

      <p>👉 Join the Digiafriq Community: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <div class="divider"></div>

      <div class="section-title">🛠 Support &amp; Assistance</div>

      <p>If you have questions or need help, please contact us only via:</p>

      <p>
        📧 Email: <a href="mailto:support@digiafriq.com">support@digiafriq.com</a><br />
        🐦 Twitter (X): <a href="https://x.com/digiafriq" target="_blank" rel="noopener noreferrer">@digiafriq</a>
      </p>

      <p>We are committed to your growth and success.</p>

      <p>Best regards,<br />
      The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} Digiafriq. All Rights Reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>
`,
  'payout-request.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>💰 Payout Request Received — Action in Progress!</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .panel { margin:24px 0; padding:22px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; }
    .row { margin:10px 0; font-size:15px; }
    .label { color:#64748b; font-weight:600; }
    .value { color:#0f172a; font-weight:800; }
    .note { margin-top:20px; padding:16px 18px; border-left:4px solid #f59e0b; background:#fffbeb; border-radius:10px; color:#92400e; font-size:14px; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="DigiafrIQ" class="logo">
    </div>
    <div class="content">
      <h1>💰 Payout Request Received — Action in Progress!</h1>

      <p>Big win! <span class="emoji">💥</span> Your request is being processed <span class="emoji">🚀</span></p>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>We've received your payout request and it's now being processed. Here are the details:</p>

      <div class="panel">
        <div class="row"><span class="label">Requested Amount:</span> <span class="value">{{currency}}{{amount}}</span></div>
        <div class="row"><span class="label">Transaction ID:</span> <span class="value">{{referenceId}}</span></div>
      </div>

      <p><strong>Please note:</strong></p>

      <div class="note">
        This email confirms that your request is being handled.<br />
        Bank credit alerts may take some time depending on network or banking processing.
      </div>

      <p>You're doing amazing — every payout brings you closer to your goals and builds your digital income momentum! <span class="emoji">💯</span></p>

      <div class="divider"></div>

      <div class="section-title">🌍 Stay Connected</div>
      <p>Join the DigiafrIQ Community to:</p>
      <p>
        Connect with fellow digital earners and professionals<br />
        Get tips, updates, and support from mentors<br />
        Celebrate wins and stay motivated
      </p>
      <p>👉 Join the community: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <div class="divider"></div>

      <div class="section-title">🛠 Need Support?</div>
      <p>If you have any questions or encounter issues, reach us only via:</p>
      <p>
        📧 <a href="mailto:support@digiafriq.com">support@digiafriq.com</a><br />
        🐦 Twitter (X): <a href="https://x.com/digiafriq" target="_blank" rel="noopener noreferrer">@digiafriq</a><br />
        💬 Live chat on your dashboard
      </p>

      <p>Keep pushing forward — your next milestone is waiting! <span class="emoji">🚀</span></p>

      <p>Warm regards,<br />The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} Digiafriq. All Rights Reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>
`,
  'membership-expiry-warning.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Digiafriq Membership Expires Soon</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 24px; background:#ea580c; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; }
    .warning-box { background:#fffbeb; border:1px solid #fbbf24; border-radius:8px; padding:16px 20px; margin:24px 0; }
    .warning-box p { color:#92400e; margin:0; font-size:14px; }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="Digiafriq" class="logo">
    </div>
    <div class="content">
      <h1>Your Membership Expires in {{daysRemaining}} Day{{daysSuffix}} <span class="emoji">⏳</span></h1>

      <p>Hi {{name}},</p>

      <p>This is a friendly reminder that your <strong>AI Cashflow Program</strong> membership will expire on <strong>{{expiryDate}}</strong>.</p>

      <div class="warning-box">
        <p><strong>⚠️ What happens when your membership expires:</strong></p>
        <p style="margin-top:8px;">You will lose access to courses, tools, and platform features. However, all your progress, earnings, and credentials will be safely preserved.</p>
      </div>

      <p>Renew now to maintain uninterrupted access to everything you've built:</p>

      <a href="{{renewalUrl}}" class="cta">Renew My Membership →</a>

      <div class="divider"></div>

      <div class="section-title">🛡️ Your Data Is Safe</div>
      <p>Even if your membership expires, your course progress, affiliate earnings, and account data are never deleted. Renew anytime to pick up right where you left off.</p>

      <p>👉 Join the community: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <div class="divider"></div>

      <div class="section-title">🛠 Need Support?</div>
      <p>
        📧 <a href="mailto:support@digiafriq.com">support@digiafriq.com</a><br />
        🐦 Twitter (X): <a href="https://x.com/digiafriq" target="_blank" rel="noopener noreferrer">@digiafriq</a><br />
        💬 Live chat on your dashboard
      </p>

      <p>Warm regards,<br />The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} Digiafriq. All Rights Reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>
`,
  'membership-expired.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Digiafriq Membership Has Expired</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1e293b; }
    .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 25px rgba(0,0,0,0.07); }
    .header { background:#ffffff; padding:28px 32px; text-align:center; color:#1e293b; border-bottom:1px solid #e2e8f0; }
    .logo { width:120px; height:auto; display:block; margin:0 auto; }
    .content { padding:40px 32px; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:700; color:#1e293b; }
    p { margin:16px 0; line-height:1.6; color:#475569; font-size:15px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 24px; background:#ea580c; color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; }
    .expired-box { background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; padding:16px 20px; margin:24px 0; }
    .expired-box p { color:#991b1b; margin:0; font-size:14px; }
    .safe-box { background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px 20px; margin:24px 0; }
    .safe-box p { color:#166534; margin:0; font-size:14px; }
    .divider { height:1px; background:#e2e8f0; margin:32px 0; }
    .section-title { margin:0 0 12px 0; font-size:18px; font-weight:600; color:#1e293b; }
    .footer { padding:24px 32px; border-top:1px solid #e2e8f0; color:#64748b; font-size:13px; line-height:1.6; text-align:center; }
    a { color:#ea580c; text-decoration:none; }
    .emoji { font-size:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="Digiafriq" class="logo">
    </div>
    <div class="content">
      <h1>Your Membership Has Expired <span class="emoji">⚠️</span></h1>

      <p>Hi {{name}},</p>

      <p>Your <strong>AI Cashflow Program</strong> membership expired on <strong>{{expiryDate}}</strong>. Your access to courses, tools, and platform features has been restricted.</p>

      <div class="expired-box">
        <p><strong>🔒 Content access is currently restricted.</strong></p>
        <p style="margin-top:8px;">You can still log in, but you'll be redirected to the renewal page until your membership is reactivated.</p>
      </div>

      <div class="safe-box">
        <p><strong>🛡️ Your data is safe!</strong></p>
        <p style="margin-top:8px;">All your course progress, affiliate earnings, credentials, and settings are preserved. Nothing has been deleted.</p>
      </div>

      <p>Renew now to instantly regain full access:</p>

      <a href="{{renewalUrl}}" class="cta">Renew My Membership Now →</a>

      <div class="divider"></div>

      <div class="section-title">What You Get Back Instantly</div>
      <p>
        ✅ Full course access & progress<br />
        ✅ Affiliate dashboard & earnings<br />
        ✅ All platform tools & features<br />
        ✅ Community access
      </p>

      <p>👉 Join the community: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <div class="divider"></div>

      <div class="section-title">🛠 Need Support?</div>
      <p>
        📧 <a href="mailto:support@digiafriq.com">support@digiafriq.com</a><br />
        🐦 Twitter (X): <a href="https://x.com/digiafriq" target="_blank" rel="noopener noreferrer">@digiafriq</a><br />
        💬 Live chat on your dashboard
      </p>

      <p>We'd love to have you back! <span class="emoji">🚀</span></p>

      <p>Warm regards,<br />The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} Digiafriq. All Rights Reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>
`,
}

type ZeptoMailPayload = {
  from: { address: string; name: string }
  to: Array<{ email_address: { address: string } }>
  subject: string
  htmlbody: string
  textbody: string
  reply_to?: Array<{ address: string }>
  headers?: Record<string, string>
  tags?: string[]
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripHtml(html: string) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function renderTemplate(templateString: string, placeholders: Record<string, unknown>) {
  let out = String(templateString)
  for (const [key, value] of Object.entries(placeholders || {})) {
    const re = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g')
    out = out.replace(re, String(value ?? ''))
  }
  return out
}

function nowIso() {
  return new Date().toISOString()
}

function headersToObject(headers: Headers) {
  const out: Record<string, string> = {}
  try {
    for (const [k, v] of headers.entries()) out[k] = v
  } catch (_) {
    // ignore
  }
  return out
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sendEmail(params: {
  to: string
  subject: string
  templateName:
    | 'signup.html'
    | 'signup-referral.html'
    | 'commission.html'
    | 'membership-purchase.html'
    | 'membership-upgrade.html'
    | 'membership-expiry-warning.html'
    | 'membership-expired.html'
    | 'payout.html'
    | 'payout-request.html'
  placeholders: Record<string, unknown>
}) {
  const apiKey = Deno.env.get('ZEPTOMAIL_API_KEY')
  const fromName = Deno.env.get('ZEPTOMAIL_FROM_NAME')
  const senderEmail = Deno.env.get('ZEPTOMAIL_SENDER_EMAIL')

  if (!apiKey) throw new Error('Missing env: ZEPTOMAIL_API_KEY')
  if (!fromName) throw new Error('Missing env: ZEPTOMAIL_FROM_NAME')
  if (!senderEmail) throw new Error('Missing env: ZEPTOMAIL_SENDER_EMAIL')

  const templateHtml = TEMPLATES[params.templateName]
  const htmlBody = renderTemplate(templateHtml, params.placeholders)
  const textBody = stripHtml(htmlBody)

  const payload: ZeptoMailPayload = {
    from: {
      address: senderEmail,
      name: fromName,
    },
    to: [{ email_address: { address: params.to } }],
    subject: params.subject,
    htmlbody: htmlBody,
    textbody: textBody,
  }

  const endpoint = 'https://api.zeptomail.com/v1.1/email'
  const maxAttempts = 3

  let lastErr: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Zoho-enczapikey ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      const respText = await resp.text()
      let respJson: unknown = null
      try {
        respJson = respText ? JSON.parse(respText) : null
      } catch (_) {
        respJson = { raw: respText }
      }

      if (!resp.ok) {
        const headerObj = headersToObject(resp.headers)
        const interestingHeaders: Record<string, string> = {}
        for (const key of [
          'x-request-id',
          'x-zm-trace-id',
          'x-zoho-trace-id',
          'x-zoho-logid',
          'cf-ray',
          'date',
        ]) {
          if (headerObj[key]) interestingHeaders[key] = headerObj[key]
        }

        console.error('[email-events] zeptomail non-2xx', {
          status: resp.status,
          statusText: resp.statusText,
          headers: interestingHeaders,
          body: respText,
          to: params.to,
          subject: params.subject,
          from: {
            address: senderEmail,
            name: fromName,
          },
          htmlBytes: payload.htmlbody?.length ?? 0,
          attempt,
          at: nowIso(),
        })

        throw new Error(`ZeptoMail error: HTTP ${resp.status} body=${respText}`)
      }

      console.log('[email-events] sent', {
        to: params.to,
        subject: params.subject,
        attempt,
        at: nowIso(),
      })

      return { ok: true, attempt, response: respJson }
    } catch (e) {
      lastErr = e
      console.error('[email-events] failed', {
        to: params.to,
        subject: params.subject,
        attempt,
        error: e instanceof Error ? e.message : String(e),
        at: nowIso(),
      })

      if (attempt < maxAttempts) {
        await sleep(500 * attempt)
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('sendEmail failed')
}

function requireString(value: unknown, field: string) {
  if (!value || typeof value !== 'string') {
    throw new Error(`Invalid payload: ${field} is required`)
  }
  return value
}

function buildAppUrl(path: string) {
  const base = (Deno.env.get('NEXT_PUBLIC_APP_URL') || '').trim().replace(/\/$/, '')
  if (!base) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()

    const type = requireString(payload?.type, 'type')
    const to = requireString(payload?.to, 'to')

    const year = new Date().getFullYear()

    if (type === 'signup') {
      const name = requireString(payload?.name, 'name')

      const loginUrl = typeof payload?.loginUrl === 'string' && payload.loginUrl.trim()
        ? payload.loginUrl
        : 'https://digiafriq.com/login'

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      await sendEmail({
        to,
        subject: 'Welcome to Digiafriq 🎉',
        templateName: 'signup.html',
        placeholders: {
          name,
          loginUrl,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'signup_referral') {
      const name = requireString(payload?.name, 'name')
      const email = requireString(payload?.email, 'email')
      const temporaryPassword = requireString(payload?.temporaryPassword, 'temporaryPassword')
      const packageName = requireString(payload?.packageName, 'packageName')

      const loginUrl = typeof payload?.loginUrl === 'string' && payload.loginUrl.trim()
        ? payload.loginUrl
        : 'https://digiafriq.com/login'

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      await sendEmail({
        to,
        subject: 'Welcome to DigiafrIQ 🎉',
        templateName: 'signup-referral.html',
        placeholders: {
          name,
          email,
          temporaryPassword,
          loginUrl,
          packageName,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'commission') {
      const name = typeof payload?.name === 'string' && payload.name.trim()
        ? payload.name
        : (typeof payload?.to === 'string' && payload.to.includes('@') ? payload.to.split('@')[0] : 'there')

      const productName = typeof payload?.productName === 'string' && payload.productName.trim()
        ? payload.productName
        : (typeof payload?.source === 'string' && payload.source.trim() ? payload.source : 'your product')

      const commissionAmount = payload?.commissionAmount ?? payload?.amount

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      console.log('[email-events] commission payload summary', {
        hasName: Boolean(String(name || '').trim()),
        hasProductName: Boolean(String(productName || '').trim()),
        hasCommissionAmount: commissionAmount !== null && commissionAmount !== undefined && String(commissionAmount).trim() !== '',
        hasCommunityUrl: Boolean(String(communityUrl || '').trim()),
        toDomain: typeof to === 'string' && to.includes('@') ? to.split('@')[1] : undefined,
        at: nowIso(),
      })

      await sendEmail({
        to,
        subject: '🎉 Congratulations!! New Purchase Confirmed on DigiafrIQ 🥳',
        templateName: 'commission.html',
        placeholders: {
          name,
          productName,
          commissionAmount,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'membership_purchase') {
      const name = requireString(payload?.name, 'name')
      const packageName = requireString(payload?.packageName, 'packageName')

      const dashboardUrl = typeof payload?.dashboardUrl === 'string' && payload.dashboardUrl.trim()
        ? payload.dashboardUrl
        : buildAppUrl('/choose-role')

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      await sendEmail({
        to,
        subject: 'Your DigiafrIQ Membership Purchase Is Confirmed 🎉',
        templateName: 'membership-purchase.html',
        placeholders: {
          name,
          packageName,
          dashboardUrl,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'membership_upgrade') {
      const name = requireString(payload?.name, 'name')
      const oldPackageName = requireString(payload?.oldPackageName, 'oldPackageName')
      const newPackageName = requireString(payload?.newPackageName, 'newPackageName')

      const dashboardUrl = typeof payload?.dashboardUrl === 'string' && payload.dashboardUrl.trim()
        ? payload.dashboardUrl
        : buildAppUrl('/choose-role')

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      await sendEmail({
        to,
        subject: 'Your Digiafriq Membership Has Been Upgraded 🎉',
        templateName: 'membership-upgrade.html',
        placeholders: {
          name,
          oldPackageName,
          newPackageName,
          dashboardUrl,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'payout') {
      const name = typeof payload?.name === 'string' && payload.name.trim()
        ? payload.name
        : (typeof payload?.to === 'string' && payload.to.includes('@') ? payload.to.split('@')[0] : 'there')
      const amount = payload?.amount
      const currency = requireString(payload?.currency, 'currency')
      const referenceId = requireString(payload?.referenceId, 'referenceId')

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      await sendEmail({
        to,
        subject: 'Payment Alert 💥 Boom! You\'ve Been Paid 🥳',
        templateName: 'payout.html',
        placeholders: {
          name,
          amount,
          currency,
          referenceId,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'payout_request') {
      const name = typeof payload?.name === 'string' && payload.name.trim()
        ? payload.name
        : (typeof payload?.to === 'string' && payload.to.includes('@') ? payload.to.split('@')[0] : 'there')
      const amount = payload?.amount
      const currency = requireString(payload?.currency, 'currency')
      const referenceId = requireString(payload?.referenceId, 'referenceId')

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      await sendEmail({
        to,
        subject: '💰 Payout Request Received — Action in Progress!',
        templateName: 'payout-request.html',
        placeholders: {
          name,
          amount,
          currency,
          referenceId,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'membership_expiry_warning') {
      const name = requireString(payload?.name, 'name')
      const daysRemaining = payload?.daysRemaining ?? 7
      const daysSuffix = Number(daysRemaining) === 1 ? '' : 's'
      const expiryDate = requireString(payload?.expiryDate, 'expiryDate')

      const renewalUrl = typeof payload?.renewalUrl === 'string' && payload.renewalUrl.trim()
        ? payload.renewalUrl
        : buildAppUrl('/dashboard/learner/membership')

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      await sendEmail({
        to,
        subject: `⏳ Your Digiafriq Membership Expires in ${daysRemaining} Day${daysSuffix}`,
        templateName: 'membership-expiry-warning.html',
        placeholders: {
          name,
          daysRemaining,
          daysSuffix,
          expiryDate,
          renewalUrl,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'membership_expired') {
      const name = requireString(payload?.name, 'name')
      const expiryDate = requireString(payload?.expiryDate, 'expiryDate')

      const renewalUrl = typeof payload?.renewalUrl === 'string' && payload.renewalUrl.trim()
        ? payload.renewalUrl
        : buildAppUrl('/dashboard/learner/membership')

      const communityUrl = typeof payload?.communityUrl === 'string' && payload.communityUrl.trim()
        ? payload.communityUrl
        : 'https://t.me/digiafriq'

      await sendEmail({
        to,
        subject: '⚠️ Your Digiafriq Membership Has Expired — Renew Now',
        templateName: 'membership-expired.html',
        placeholders: {
          name,
          expiryDate,
          renewalUrl,
          communityUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: false, error: 'Unknown type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[email-events] request error', {
      error: e instanceof Error ? e.message : String(e),
      at: nowIso(),
    })

    return new Response(JSON.stringify({ ok: false, error: 'Bad Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
