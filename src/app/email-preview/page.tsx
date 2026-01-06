'use client'

import { useState } from 'react'
// NOTE: These templates are copied from supabase/functions/email-events/index.ts
// Keep them in sync when you update the Edge Function.
const TEMPLATES: Record<
  'signup.html'
  | 'signup-referral.html'
  | 'commission.html'
  | 'membership-purchase.html'
  | 'membership-upgrade.html'
  | 'payout.html'
  | 'payout-request.html',
  string
> = {
  'signup.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to DigiafrIQ — Your Account is Ready</title>
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

      <p>Your account has been successfully created. We’re glad to have you on board.</p>

      <p>You can now log in to your dashboard and begin exploring the opportunities available on Digiafriq.</p>

      <a href="{{loginUrl}}" class="cta">Log In to Your Account</a>

      <p>If you need any assistance, our support team is always available to help.</p>

      <p>Kind regards,<br />The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} DigiafrIQ. All rights reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>`,

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
</html>`,

  'membership-purchase.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🎉 Congratulations!! New Purchase Confirmed on DigiafrIQ 🥳</title>
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
      <h1><span class="emoji">🎉</span> Congratulations!! <span class="emoji">🥳</span></h1>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>We're thrilled to confirm your purchase of the <strong>{{packageName}}</strong> on DigiafrIQ! 🎊</p>

      <p>Your membership is now active and you have full access to all the features and benefits included in your package.</p>

      <div class="divider"></div>

      <div class="section-title">What's Next?</div>
      <p>👉 Access your dashboard to explore your new features and get started:</p>

      <a href="{{dashboardUrl}}" class="cta">Go to Your Dashboard</a>

      <p>👉 Join our community to connect with other members and stay updated:</p>

      <p><strong>Join the DigiafrIQ Community</strong><br />
      👉 Join the community: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <p>If you have any questions or need assistance getting started, our support team is here to help you every step of the way.</p>

      <p>Thank you for choosing DigiafrIQ. We're excited to be part of your journey! 🚀</p>

      <p>Warm regards,<br />DigiafrIQ Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} DigiafrIQ. All rights reserved.</div>
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
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="DigiafrIQ" class="logo">
    </div>
    <div class="content">
      <h1><span class="emoji">🎉</span> Your Membership Has Been Upgraded! <span class="emoji">🚀</span></h1>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>Congratulations! Your membership has been successfully upgraded from <strong>{{oldPackageName}}</strong> to <strong>{{newPackageName}}</strong>. 🎊</p>

      <p>You now have access to all the enhanced features and benefits included in your new membership level.</p>

      <div class="divider"></div>

      <div class="section-title">What's Next?</div>
      <p>👉 Access your dashboard to explore your new features and get started:</p>

      <a href="{{dashboardUrl}}" class="cta">Go to Your Dashboard</a>

      <p>👉 Join our community to connect with other members and stay updated:</p>

      <p><strong>Join the DigiafrIQ Community</strong><br />
      👉 Join the community: <a href="{{communityUrl}}">{{communityUrl}}</a></p>

      <p>If you have any questions about your new membership or need assistance getting started, our support team is here to help you every step of the way.</p>

      <p>Thank you for upgrading with DigiafrIQ. We're excited to support your continued journey! 🚀</p>

      <p>Warm regards,<br />DigiafrIQ Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} DigiafrIQ. All rights reserved.</div>
      <div>This is an automated transactional email.</div>
    </div>
  </div>
</body>
</html>`,

  'commission.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🎉 Congratulations!! New Purchase Confirmed on DigiafrIQ 🥳</title>
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
      <img src="https://cdn.jsdelivr.net/gh/learnmorenade/digiafriq@e0d2e6031073b113aec46bbe179e9139bfe5b5e1/public/digiafriqlogo.png" alt="DigiafrIQ" class="logo">
    </div>
    <div class="content">
      <p><strong>New purchase commission</strong> <span class="emoji">🎉</span></p>

      <h1>Congratulations!! <span class="emoji">🥳</span></h1>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>Great news! A new purchase of <strong>{{productName}}</strong> has been successfully recorded under your DigiafrIQ account.</p>

      <div class="amount-box">
        <p class="amount-label">Commission Amount</p>
        <p class="amount-value">₵{{commissionAmount}}</p>
      </div>

      <p>You’re doing an amazing job — keep closing sales and building your digital income <span class="emoji">🚀</span></p>

      <p>Every sale brings you one step closer to your goals.</p>

      <div class="divider"></div>

      <div class="section-title">🌍 Join the DigiafrIQ Community</div>
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

      <p>We’re committed to your success <span class="emoji">💯</span></p>

      <p>Best regards,<br />The Digiafriq Team</p>
    </div>
    <div class="footer">
      <div>© {{year}} DigiafrIQ. All rights reserved.</div>
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
      <h1>Payment Alert <span class="emoji">💥</span> Boom! You’ve Been Paid <span class="emoji">🥳</span></h1>

      <p>Dear {{name}} <span class="emoji">🤗</span>,</p>

      <p>Big win! <span class="emoji">💥</span>Blessings Overflow <span class="emoji">🚀</span></p>

      <p>We’re happy to inform you that a payment of <strong>{{currency}}{{amount}}</strong> has been successfully initiated under your Digiafriq account.</p>

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
</html>`,

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

      <p>We’ve received your payout request and it’s now being processed. Here are the details:</p>

      <div class="panel">
        <div class="row"><span class="label">Requested Amount:</span> <span class="value">{{currency}}{{amount}}</span></div>
        <div class="row"><span class="label">Transaction ID:</span> <span class="value">{{referenceId}}</span></div>
      </div>

      <p><strong>Please note:</strong></p>

      <div class="note">
        This email confirms that your request is being handled.<br />
        Bank credit alerts may take some time depending on network or banking processing.
      </div>

      <p>You’re doing amazing — every payout brings you closer to your goals and builds your digital income momentum! <span class="emoji">💯</span></p>

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
</html>`,
}

const sampleData: Record<keyof typeof TEMPLATES, Record<string, unknown>> = {
  'signup.html': {
    name: 'Jane Doe',
    email: 'jane@example.com',
    temporaryPassword: 'AbC123!@#',
    loginUrl: 'http://localhost:3000/login',
    communityUrl: 'https://t.me/digiafriq',
    year: new Date().getFullYear(),
  },
  'signup-referral.html': {
    name: 'John Smith',
    email: 'john@example.com',
    temporaryPassword: 'XyZ789!@#',
    packageName: 'Learner Membership',
    loginUrl: 'http://localhost:3000/login',
    communityUrl: 'https://t.me/digiafriq',
    year: new Date().getFullYear(),
  },
  'commission.html': {
    name: 'Carol Davis',
    productName: 'Learner Membership',
    commissionAmount: 10.0,
    communityUrl: 'https://t.me/digiafriq',
    year: new Date().getFullYear(),
  },
  'membership-purchase.html': {
    name: 'Alice Johnson',
    packageName: 'Learner Membership',
    dashboardUrl: 'http://localhost:3000/dashboard',
    communityUrl: 'https://t.me/digiafriq',
    year: new Date().getFullYear(),
  },
  'membership-upgrade.html': {
    name: 'Bob Williams',
    oldPackageName: 'Learner Membership',
    newPackageName: 'Digital Cashflow System',
    dashboardUrl: 'http://localhost:3000/dashboard',
    communityUrl: 'https://t.me/digiafriq',
    year: new Date().getFullYear(),
  },
  'payout.html': {
    amount: 250.0,
    currency: 'USD',
    paymentMethod: 'Bank Transfer',
    referenceId: 'PAYOUT-12345',
    date: new Date().toLocaleDateString(),
    dashboardUrl: 'http://localhost:3000/dashboard',
    year: new Date().getFullYear(),
  },
  'payout-request.html': {
    name: 'Riches Adusei',
    amount: 29.0,
    currency: '$',
    referenceId: 'M73SF8C3JYDX',
    communityUrl: '/community',
    year: new Date().getFullYear(),
  },
}

function renderTemplate(templateKey: string, data: Record<string, unknown>) {
  let html = TEMPLATES[templateKey as keyof typeof TEMPLATES] || '<p>Template not found</p>'
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g')
    html = html.replace(placeholder, String(value))
  }
  return html
}

export default function EmailPreviewPage() {
  const [selected, setSelected] = useState<keyof typeof TEMPLATES>('signup.html')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Email Template Preview</h1>
        <div className="mb-4">
          <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">
            Choose template
          </label>
          <select
            id="template-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value as keyof typeof TEMPLATES)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-64"
          >
            {Object.keys(TEMPLATES).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div
            className="border-b px-4 py-2 text-sm font-mono text-gray-600"
            style={{ background: '#f8fafc' }}
          >
            Preview: {selected}
          </div>
          <div
            className="p-4"
            style={{ zoom: 0.7, transformOrigin: 'top left' }}
            dangerouslySetInnerHTML={{
              __html: renderTemplate(selected, sampleData[selected] || {}),
            }}
          />
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Tip: Open this page while you edit the HTML in supabase/functions/email-events/index.ts and refresh to see changes.
        </div>
      </div>
    </div>
  )
}
