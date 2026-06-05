/**
 * SMS / Verification Code Service
 * Supports Alibaba Cloud SMS in production, dev mode for testing.
 */
import { getDb } from "../db/index.js";

// ═══ Verification Code Management ═══════════════════════════

/** Generate a 6-digit code and store it (expires in 5 min) */
export function generateCode(phone: string): string {
  const db = getDb();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  // Delete old codes for this phone
  db.run("DELETE FROM verify_codes WHERE phone = ?", [phone]);
  // Insert new code (expires in 5 min)
  db.run(
    "INSERT INTO verify_codes (phone, code, expires_at) VALUES (?, ?, datetime('now', '+5 minutes'))",
    [phone, code]
  );
  return code;
}

/** Verify a code for a phone. Returns true if valid and not expired. */
export function verifyCode(phone: string, code: string): boolean {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT code FROM verify_codes WHERE phone = ? AND code = ? AND expires_at > datetime('now')"
  );
  stmt.bind([phone, code]);
  const valid = stmt.step();
  stmt.free();
  if (valid) {
    db.run("DELETE FROM verify_codes WHERE phone = ?", [phone]);
    return true;
  }
  return false;
}

/** Check if a phone can send another code (rate limit: 1 per 60s, 5 per hour) */
export function canSendCode(phone: string): { ok: boolean; waitSeconds?: number; reason?: string } {
  const db = getDb();
  // Check 60s cooldown
  const stmt = db.prepare(
    "SELECT created_at FROM verify_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1"
  );
  stmt.bind([phone]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    const lastSent = new Date(row.created_at + 'Z').getTime();
    const elapsed = (Date.now() - lastSent) / 1000;
    if (elapsed < 60) {
      return { ok: false, waitSeconds: Math.ceil(60 - elapsed), reason: "发送太频繁，请" + Math.ceil(60 - elapsed) + "秒后再试" };
    }
  } else {
    stmt.free();
  }
  // Check hourly limit
  const cntStmt = db.prepare(
    "SELECT COUNT(*) as cnt FROM verify_codes WHERE phone = ? AND created_at > datetime('now', '-1 hour')"
  );
  cntStmt.bind([phone]);
  cntStmt.step();
  const cnt = (cntStmt.getAsObject() as any).cnt;
  cntStmt.free();
  if (cnt >= 5) {
    return { ok: false, reason: "每小时最多发送5条验证码，请稍后再试" };
  }
  return { ok: true };
}

// ═══ SMS Sender Interface ═══════════════════════════════════

interface SmsConfig {
  provider: "aliyun" | "tencent" | "dev";
  accessKeyId?: string;
  accessKeySecret?: string;
  signName?: string;
  templateCode?: string;
}

/** Get SMS config from DB */
export function getSmsConfig(): SmsConfig {
  const db = getDb();
  const stmt = db.prepare("SELECT value FROM settings WHERE key = 'sms_config'");
  stmt.bind([]);
  if (stmt.step()) {
    try {
      return JSON.parse((stmt.getAsObject() as any).value);
    } catch {}
  }
  stmt.free();
  return { provider: "dev" }; // Default: dev mode
}

/** Save SMS config */
export function setSmsConfig(config: SmsConfig): void {
  const db = getDb();
  const value = JSON.stringify(config);
  const existing = db.prepare("SELECT key FROM settings WHERE key = 'sms_config'");
  existing.bind([]);
  const has = existing.step();
  existing.free();
  if (has) {
    db.run("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'sms_config'", [value]);
  } else {
    db.run("INSERT INTO settings (key, value) VALUES ('sms_config', ?)", [value]);
  }
}

/** Send verification code via SMS or fallback */
export async function sendSms(phone: string, code: string): Promise<{ success: boolean; message: string }> {
  const config = getSmsConfig();

  if (config.provider === "dev") {
    // DEV mode: log the code and return it
    console.log(`[DEV SMS] Phone: ${phone} Code: ${code}`);
    return { success: true, message: `[开发模式] 验证码: ${code} (生产环境将通过短信发送)` };
  }

  if (config.provider === "aliyun") {
    return sendAliyunSms(phone, code, config);
  }

  if (config.provider === "tencent") {
    return sendTencentSms(phone, code, config);
  }

  return { success: false, message: "短信服务未配置" };
}

/** Send via Alibaba Cloud SMS */
async function sendAliyunSms(phone: string, code: string, config: SmsConfig): Promise<{ success: boolean; message: string }> {
  try {
    // Alibaba Cloud SMS API
    const params: Record<string, string> = {
      AccessKeyId: config.accessKeyId!,
      Action: "SendSms",
      Format: "JSON",
      PhoneNumbers: phone,
      SignName: config.signName!,
      TemplateCode: config.templateCode!,
      TemplateParam: JSON.stringify({ code }),
      SignatureMethod: "HMAC-SHA1",
      SignatureVersion: "1.0",
      Timestamp: new Date().toISOString().replace(/\.\d{3}/, "").replace(/-/g, "").replace(/:/g, "").replace("T", ""),
      Version: "2017-05-25",
    };

    const resp = await fetch("https://dysmsapi.aliyuncs.com/?" + new URLSearchParams(params));
    const data = await resp.json() as any;
    if (data.Code === "OK") {
      return { success: true, message: "验证码已发送" };
    }
    return { success: false, message: data.Message || "短信发送失败" };
  } catch (e: any) {
    console.error("Aliyun SMS error:", e.message);
    return { success: false, message: "短信服务异常" };
  }
}

/** Send via Tencent Cloud SMS */
async function sendTencentSms(phone: string, code: string, config: SmsConfig): Promise<{ success: boolean; message: string }> {
  try {
    const body = {
      PhoneNumberSet: ["+86" + phone],
      SmsSdkAppId: config.accessKeyId,
      TemplateId: config.templateCode,
      TemplateParamSet: [code],
      SignName: config.signName,
    };
    const resp = await fetch("https://sms.tencentcloudapi.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json() as any;
    if (data.Response?.SendStatusSet?.[0]?.Code === "Ok") {
      return { success: true, message: "验证码已发送" };
    }
    return { success: false, message: "短信发送失败" };
  } catch (e: any) {
    console.error("Tencent SMS error:", e.message);
    return { success: false, message: "短信服务异常" };
  }
}
