
const http = require('http');
const fs = require('fs');
const path = require('path');

const publicRoot = path.resolve(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  res.end(body);
}

const crypto = require('crypto');

const plans = {
  regular: {
    '1_month': 100000,
    '3_months': 270000,
    '6_months': 500000,
    '1_year': 900000
  },
  escort: {
    '1_month': 200000,
    '3_months': 540000,
    '6_months': 1000000,
    '1_year': 1800000
  }
};

const planMonths = {
  '1_month': 1,
  '3_months': 3,
  '6_months': 6,
  '1_year': 12
};

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabasePublicKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const paystackSecret = process.env.PAYSTACK_SECRET_KEY || '';

const appUrl = (
  process.env.APP_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  ''
).replace(/\/$/, '');

function json(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  send(
    res,
    status,
    JSON.stringify(payload),
    'application/json; charset=utf-8'
  );
}

function readBody(req, maxBytes = 100000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', chunk => {
      size += chunk.length;

      if (size > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function supabaseAdmin(path, options = {}) {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Server Supabase admin configuration is missing.');
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {})
      }
    }
  );

  const textBody = await response.text();
  let body = null;

  try {
    body = textBody ? JSON.parse(textBody) : null;
  } catch {
    body = textBody;
  }

  if (!response.ok) {
    throw new Error(
      `Database request failed (${response.status}): ${
        typeof body === 'string' ? body : JSON.stringify(body)
      }`
    );
  }

  return body;
}

async function getAuthenticatedUser(req) {
  const token = (req.headers.authorization || '')
    .replace(/^Bearer\s+/i, '')
    .trim();

  if (!token || !supabaseUrl || !supabasePublicKey) {
    return null;
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`,
    {
      headers: {
        apikey: supabasePublicKey,
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function paystackRequest(path, method = 'GET', payload) {
  if (!paystackSecret) {
    throw new Error('PAYSTACK_SECRET_KEY is not set on the server.');
  }

  const response = await fetch(`https://api.paystack.co${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      'Content-Type': 'application/json'
    },
    body: payload ? JSON.stringify(payload) : undefined
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Paystack API request failed.');
  }

  return data.data;
}

function signatureValid(raw, legacySignature, modernSignature) {
  const modernSecret = process.env.PAYSTACK_WEBHOOK_SECRET || '';

  if (modernSignature && modernSecret) {
    const parts = String(modernSignature).split(',');

    const timestamp = parts
      .find(p => p.trim().startsWith('t='))
      ?.trim()
      .slice(2);

    const candidates = parts
      .filter(p => p.trim().startsWith('v1='))
      .map(p => p.trim().slice(3).split(':').slice(1).join(':'));

    const t = Number(timestamp);

    if (
      timestamp &&
      Number.isFinite(t) &&
      Math.abs(Date.now() / 1000 - t) <= 300
    ) {
      const expected = crypto
        .createHmac('sha512', modernSecret)
        .update(`${timestamp}.${raw.toString('utf8')}`)
        .digest('hex');

      if (
        candidates.some(sig => {
          try {
            return crypto.timingSafeEqual(
              Buffer.from(expected, 'hex'),
              Buffer.from(sig, 'hex')
            );
          } catch {
            return false;
          }
        })
      ) {
        return true;
      }
    }
  }

  if (!paystackSecret || !legacySignature) {
    return false;
  }

  const expectedLegacy = crypto
    .createHmac('sha512', paystackSecret)
    .update(raw)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedLegacy, 'hex'),
      Buffer.from(String(legacySignature), 'hex')
    );
  } catch {
    return false;
  }
}

function paymentReference() {
  return `AC-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

async function pendingSubscription(reference) {
  const rows = await supabaseAdmin(
    `subscriptions?paystack_reference=eq.${encodeURIComponent(reference)}&select=*`
  );

  return rows?.[0] || null;
}

async function activateReference(reference, payData) {
  const pending = await pendingSubscription(reference);

  if (!pending) {
    return {
      activated: false,
      reason: 'No matching pending subscription.'
    };
  }

  if (pending.status === 'active') {
    return {
      activated: true,
      already_active: true,
      expires_at: pending.expires_at
    };
  }

  if (pending.status !== 'pending') {
    return {
      activated: false,
      reason: 'This subscription payment is no longer pending.'
    };
  }

  const expectedAmount =
    plans[pending.account_type]?.[pending.plan_code];

  if (
    !expectedAmount ||
    Number(payData.amount) !== expectedAmount ||
    payData.currency !== 'NGN' ||
    payData.status !== 'success'
  ) {
    return {
      activated: false,
      reason: 'Payment does not match this plan.'
    };
  }

  if (
    payData.reference !== reference ||
    String(payData.metadata?.user_id || '') !== pending.user_id ||
    payData.metadata?.account_type !== pending.account_type ||
    payData.metadata?.plan_code !== pending.plan_code
  ) {
    return {
      activated: false,
      reason: 'Payment identity, plan, or reference mismatch.'
    };
  }

  const now = new Date();

  const currentRows = await supabaseAdmin(
    `subscriptions?user_id=eq.${pending.user_id}&status=eq.active&expires_at=gt.${encodeURIComponent(now.toISOString())}&select=expires_at&order=expires_at.desc&limit=1`
  );

  const currentExpiry = currentRows?.[0]?.expires_at
    ? new Date(currentRows[0].expires_at)
    : now;

  const starts = currentExpiry > now ? currentExpiry : now;
  const expires = new Date(starts);
  const originalDay = expires.getUTCDate();

  expires.setUTCDate(1);
  expires.setUTCMonth(
    expires.getUTCMonth() + planMonths[pending.plan_code]
  );

  const lastDay = new Date(
    Date.UTC(
      expires.getUTCFullYear(),
      expires.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  expires.setUTCDate(Math.min(originalDay, lastDay));

  await supabaseAdmin(
    `subscriptions?id=eq.${pending.id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'active',
        starts_at: starts.toISOString(),
        expires_at: expires.toISOString()
      })
    }
  );

  return {
    activated: true,
    expires_at: expires.toISOString(),
    starts_at: starts.toISOString()
  };
}

async function handleApi(req, res, pathname) {

  // PAYMENT DIAGNOSTICS
  if (
    pathname === '/api/payments/diagnostics' &&
    req.method === 'GET'
  ) {
    const missing = [
      'SUPABASE_URL',
      'SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'PAYSTACK_SECRET_KEY'
    ].filter(k => !process.env[k]);

    let subscriptionsProbe = {
      accessible: false,
      errorCode: null
    };

    if (supabaseUrl && supabaseServiceKey) {
      try {
        await supabaseAdmin(
          'subscriptions?select=id&limit=1'
        );

        subscriptionsProbe.accessible = true;
      } catch (probeError) {
        const match = String(probeError.message || '')
          .match(/"code"\s*:\s*"([^"]+)"/);

        subscriptionsProbe.errorCode = match
          ? match[1]
          : 'DATABASE_ACCESS_ERROR';

        console.error(
          'Payment diagnostics subscriptions probe failed:',
          probeError.message
        );
      }
    }

    return json(res, 200, {
      configured: missing.length === 0,
      missing,
      paystackSecretPresent: Boolean(paystackSecret),
      subscriptionsTableAccessible: subscriptionsProbe.accessible,
      subscriptionsProbeError: subscriptionsProbe.errorCode
    });
  }

  // CONFIGURATION CHECK
  if (
    pathname === '/api/payments/config-check' &&
    req.method === 'GET'
  ) {
    return json(res, 200, {
      configured: Boolean(
        supabaseUrl &&
        supabasePublicKey &&
        supabaseServiceKey &&
        paystackSecret
      ),
      missing: [
        'SUPABASE_URL',
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'PAYSTACK_SECRET_KEY'
      ].filter(k => !process.env[k])
    });
  }

  // PREMIUM STATUS
  if (
    pathname === '/api/payments/status' &&
    req.method === 'GET'
  ) {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return json(res, 401, {
        error: 'Please sign in again.'
      });
    }

    const rows = await supabaseAdmin(
      `subscriptions?user_id=eq.${user.id}&status=eq.active&starts_at=lte.${encodeURIComponent(new Date().toISOString())}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,account_type,plan_code,starts_at,expires_at&order=expires_at.desc&limit=1`
    );

    return json(res, 200, {
      active: !!rows?.length,
      subscription: rows?.[0] || null
    });
  }

  // INITIALIZE PAYMENT
  if (
    pathname === '/api/payments/initialize' &&
    req.method === 'POST'
  ) {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return json(res, 401, {
        error: 'Please sign in before purchasing.'
      });
    }

    const raw = await readBody(req);
    let input;

    try {
      input = JSON.parse(raw.toString('utf8'));
    } catch {
      return json(res, 400, {
        error: 'Invalid JSON.'
      });
    }

    const accountType = input.accountType;
    const planCode = input.planCode;
    const amount = plans[accountType]?.[planCode];

    if (!amount || !planMonths[planCode]) {
      return json(res, 400, {
        error: 'Please select a valid subscription plan.'
      });
    }

    const profile = await supabaseAdmin(
      `profiles?id=eq.${user.id}&select=account_type`
    );

    if (
      profile?.[0] &&
      profile[0].account_type !== accountType
    ) {
      return json(res, 400, {
        error: 'Selected plan type does not match your account.'
      });
    }

    const reference = paymentReference();

    await supabaseAdmin(
      'subscriptions',
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          account_type: accountType,
          plan_code: planCode,
          status: 'pending',
          paystack_reference: reference
        })
      }
    );

    try {
      const tx = await paystackRequest(
        '/transaction/initialize',
        'POST',
        {
          email: user.email,
          amount,
          currency: 'NGN',
          reference,
          callback_url: `${appUrl || new URL(req.url, `http://${req.headers.host}`).origin}/payment-return`,
          metadata: {
            user_id: user.id,
            account_type: accountType,
            plan_code: planCode
          }
        }
      );

      return json(res, 200, {
        authorization_url: tx.authorization_url,
        reference
      });
    } catch (paymentErr) {
      await supabaseAdmin(
        `subscriptions?paystack_reference=eq.${encodeURIComponent(reference)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'failed'
          })
        }
      ).catch(() => {});

      throw paymentErr;
    }
  }

  // VERIFY PAYMENT
  if (
    pathname === '/api/payments/verify' &&
    req.method === 'POST'
  ) {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return json(res, 401, {
        error: 'Please sign in again.'
      });
    }

    const raw = await readBody(req);
    let input;

    try {
      input = JSON.parse(raw.toString('utf8'));
    } catch {
      return json(res, 400, {
        error: 'Invalid JSON.'
      });
    }

    const reference = String(input.reference || '').trim();

    if (!reference) {
      return json(res, 400, {
        error: 'Payment reference is required.'
      });
    }

    const pending = await pendingSubscription(reference);

    if (!pending || pending.user_id !== user.id) {
      return json(res, 403, {
        error: 'This payment reference does not belong to your account.'
      });
    }

    const verified = await paystackRequest(
      `/transaction/verify/${encodeURIComponent(reference)}`
    );

    const result = await activateReference(
      reference,
      verified
    );

    if (!result.activated) {
      return json(res, 402, {
        verified: false,
        error: result.reason || 'Payment is not verified yet.'
      });
    }

    return json(res, 200, {
      verified: true,
      subscription: result
    });
  }

  // PAYSTACK WEBHOOK
  if (
    pathname === '/api/payments/paystack-webhook' &&
    req.method === 'POST'
  ) {
    const raw = await readBody(req, 500000);

    if (
      !signatureValid(
        raw,
        req.headers['x-paystack-signature'],
        req.headers['paystack-signature']
      )
    ) {
      return json(res, 401, {
        error: 'Invalid webhook signature.'
      });
    }

    let event;

    try {
      event = JSON.parse(raw.toString('utf8'));
    } catch {
      return json(res, 400, {
        error: 'Invalid webhook JSON.'
      });
    }

    if (
      event.event === 'charge.success' &&
      event.data?.reference
    ) {
      try {
        const verified = await paystackRequest(
          `/transaction/verify/${encodeURIComponent(event.data.reference)}`
        );

        await activateReference(
          event.data.reference,
          verified
        );
      } catch (err) {
        console.error(
          'Webhook processing failed:',
          err.message
        );

        return json(res, 500, {
          error: 'Webhook processing failed.'
        });
      }
    }

    return json(res, 200, {
      received: true
    });
  }

  return json(res, 404, {
    error: 'API endpoint not found.'
  });
}

// MAIN SERVER
http.createServer(async (req, res) => {
  const pathname = new URL(
    req.url || '/',
    'http://localhost'
  ).pathname;

  if (
    pathname === '/healthz' &&
    req.method === 'GET'
  ) {
    return json(res, 200, {
      ok: true,
      service: 'abuja-connect'
    });
  }

  if (pathname.startsWith('/api/')) {
    try {
      return await handleApi(
        req,
        res,
        pathname
      );
    } catch (err) {
      console.error('API error:', err.message);

      return json(res, 500, {
        error: 'Payment service temporarily unavailable. Please try again.'
      });
    }
  }

  // Render injects these values at runtime;
  // they are not committed to GitHub.
  if (pathname === '/config.js') {
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabasePublishableKey:
        process.env.SUPABASE_PUBLISHABLE_KEY || ''
    };

    const body =
      `window.ABUJA_CONFIG = ${JSON.stringify(config)};`;

    res.setHeader('Cache-Control', 'no-store');

    return send(
      res,
      200,
      body,
      'text/javascript; charset=utf-8'
    );
  }

  let decoded;

  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return send(res, 400, 'Bad request');
  }

  const relative =
    decoded === '/' || decoded === '/payment-return'
      ? 'index.html'
      : decoded.replace(/^\/+/, '');

  const filePath = path.resolve(
    publicRoot,
    relative
  );

  if (
    filePath !== publicRoot &&
    !filePath.startsWith(publicRoot + path.sep)
  ) {
    return send(res, 403, 'Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, 'Not found');
    }

    const contentType =
      mimeTypes[path.extname(filePath).toLowerCase()] ||
      'application/octet-stream';

    send(res, 200, data, contentType);
  });

}).listen(
  Number(process.env.PORT) || 3000,
  '0.0.0.0',
  () => {
    console.log('Abuja Connect web server started');
  }
);
