"use client";

import { useState } from "react";

export default function EmailSettingsForm({
  initialSettings,
  onSave,
  mailStatus,
  restrictedTo,
  alertsDeliverable,
  sendTestEmail,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    resendApiKey: initialSettings?.resendApiKey || process.env.RESEND_API_KEY || "",
    mailFrom: initialSettings?.mailFrom || process.env.MAIL_FROM || "",
    adminEmail: initialSettings?.adminEmail || process.env.ADMIN_EMAIL || "",
    resendWebhookSecret: initialSettings?.resendWebhookSecret || process.env.RESEND_WEBHOOK_SECRET || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Call server action with form data
      await onSave(formData);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {mailStatus.configured && mailStatus.usingTestSender ? (
        <div className="wp-notice is-warning" style={{ margin: 0, marginBottom: 16 }}>
          {alertsDeliverable ? (
            <>
              <p style={{ marginTop: 0 }}>
                <strong>Admin alerts are working. Customers cannot be reached yet.</strong>{" "}
                MAIL_FROM is Resend&rsquo;s shared sender, which anyone may use without owning a
                domain. It delivers only to the address the Resend account is registered under,
                and ADMIN_EMAIL is that address — so orders and reviews reach you, and nothing
                reaches a customer.
              </p>
              <p style={{ marginBottom: 0 }}>
                Order confirmations and payment receipts are built and tested, and will stay
                unsent until a domain is verified at resend.com/domains and MAIL_FROM points at
                an address on it.
              </p>
            </>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>
                <strong>Nothing is being delivered.</strong> MAIL_FROM is Resend&rsquo;s shared
                sender, which delivers only to the address the Resend account is registered
                under
                {restrictedTo ? <> — <strong>{restrictedTo}</strong></> : null}. Admin alerts
                are addressed to <strong>{formData.adminEmail ?? "nowhere"}</strong>, so every one
                is refused.
              </p>
              <p style={{ marginBottom: 0 }}>
                Either point ADMIN_EMAIL at{" "}
                {restrictedTo ? <strong>{restrictedTo}</strong> : "the Resend account address"} to
                get alerts today, or add a domain at resend.com/domains — the latter is the only
                thing that also lets <em>customers</em> receive order confirmations.
              </p>
            </>
          )}
        </div>
      ) : mailStatus.configured ? (
        <p className="wp-notice is-success" style={{ margin: 0, marginBottom: 16 }}>
          Email is configured. Sending as <strong>{formData.mailFrom}</strong>.
        </p>
      ) : (
        <p className="wp-notice is-warning" style={{ margin: 0, marginBottom: 16 }}>
          Email is not configured. Orders and reviews still record normally in the
          admin — nothing is lost — but nobody is told by email.
          {!formData.resendApiKey && " RESEND_API_KEY is not set."}
          {!formData.mailFrom && " MAIL_FROM is not set."}
        </p>
      )}

      {!isEditing ? (
        <>
          <table className="wp-table">
            <tbody>
              <tr>
                <td>API key</td>
                <td>
                  {formData.resendApiKey ? (
                    <code style={{ fontSize: "0.85em" }}>
                      {formData.resendApiKey.slice(0, 10)}...
                    </code>
                  ) : (
                    <span className="wp-pill is-red">missing</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>From address</td>
                <td>
                  {formData.mailFrom ? (
                    <>
                      {formData.mailFrom}
                      {mailStatus.usingTestSender && (
                        <span
                          className="wp-pill is-amber"
                          style={{ marginLeft: 8 }}
                        >
                          shared test sender — cannot reach customers
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="wp-pill is-red">missing</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>Admin recipient</td>
                <td>
                  {formData.adminEmail ? (
                    formData.adminEmail
                  ) : (
                    <span className="wp-pill is-amber">
                      missing — admin alerts cannot be sent
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td>Delivery webhook</td>
                <td>
                  {formData.resendWebhookSecret ? (
                    "signing secret set"
                  ) : (
                    <span className="wp-pill is-amber">
                      no secret — delivery and bounce reporting is off
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button
              type="button"
              className="wp-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Settings
            </button>
            <form action={sendTestEmail} style={{ display: "inline" }}>
              <button
                type="submit"
                className="wp-btn"
                disabled={!mailStatus.configured || !formData.adminEmail}
              >
                Send Test Email
              </button>
            </form>
          </div>
        </>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
              Resend API Key
            </label>
            <input
              type="password"
              name="resendApiKey"
              value={formData.resendApiKey}
              onChange={handleChange}
              placeholder="re_..."
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
                fontFamily: "monospace",
                fontSize: "0.9em",
              }}
            />
            <small style={{ color: "#666", display: "block", marginTop: 4 }}>
              From Resend dashboard → API Keys. Use SENDING ACCESS ONLY.
            </small>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
              From Address (Mail From)
            </label>
            <input
              type="text"
              name="mailFrom"
              value={formData.mailFrom}
              onChange={handleChange}
              placeholder="Weedmaps <orders@weedmap.store>"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
            <small style={{ color: "#666", display: "block", marginTop: 4 }}>
              Must be on a verified domain in Resend.
            </small>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
              Admin Email
            </label>
            <input
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              placeholder="admin@weedmap.store"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
            <small style={{ color: "#666", display: "block", marginTop: 4 }}>
              Where admin alerts (new orders, reviews) are sent.
            </small>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
              Resend Webhook Secret
            </label>
            <input
              type="password"
              name="resendWebhookSecret"
              value={formData.resendWebhookSecret}
              onChange={handleChange}
              placeholder="whsec_..."
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
                fontFamily: "monospace",
                fontSize: "0.9em",
              }}
            />
            <small style={{ color: "#666", display: "block", marginTop: 4 }}>
              From Resend → Webhooks → Signing Secret. Enables delivery tracking.
            </small>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              className="wp-btn"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
            <button
              type="button"
              className="wp-btn"
              style={{ backgroundColor: "#f0f0f0", color: "#333" }}
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}
