import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import Icon from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function CampaignDetail({ params }) {
  const campaignId = Number((await params).id);
  if (!campaignId) return <div>Campaign not found</div>;

  const [campaign] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    return <div className="wp-container"><h1>Campaign not found</h1></div>;
  }

  const emailLogs = await db
    .select()
    .from(schema.emailLog)
    .where(eq(schema.emailLog.providerId, `campaign-${campaignId}`))
    .orderBy(schema.emailLog.createdAt);

  const statusCounts = {
    queued: emailLogs.filter((e) => e.status === "queued").length,
    sent: emailLogs.filter((e) => e.status === "sent").length,
    delivered: emailLogs.filter((e) => e.status === "delivered").length,
    bounced: emailLogs.filter((e) => e.status === "bounced").length,
    complained: emailLogs.filter((e) => e.status === "complained").length,
    failed: emailLogs.filter((e) => e.status === "failed").length,
  };

  const when = (d) =>
    d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/campaigns" className="wp-btn" style={{ marginBottom: 12 }}>
          ← Back to Campaigns
        </Link>
        <h1 className="wp-title">{campaign.name}</h1>
      </div>

      {/* Campaign Overview */}
      <div className="wp-box" style={{ marginBottom: 24 }}>
        <div className="wp-box-head">Campaign Summary</div>
        <div className="wp-box-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "#666", textTransform: "uppercase" }}>Status</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: "bold" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 20,
                    backgroundColor: campaign.status === "sent" ? "#d4edda" : "#fff3cd",
                    color: campaign.status === "sent" ? "#155724" : "#856404",
                    fontSize: 14,
                  }}
                >
                  {campaign.status}
                </span>
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "#666", textTransform: "uppercase" }}>Sent</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: "#27ae60" }}>{campaign.sentCount}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "#666", textTransform: "uppercase" }}>Failed</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: campaign.failedCount > 0 ? "#d63638" : "#999" }}>
                {campaign.failedCount}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "#666", textTransform: "uppercase" }}>Sent At</p>
              <p style={{ margin: 0, fontSize: 14 }}>{when(campaign.sentAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="wp-box" style={{ marginBottom: 24 }}>
        <div className="wp-box-head">Email Content</div>
        <div className="wp-box-body">
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#666", textTransform: "uppercase" }}>Subject</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: "bold" }}>{campaign.subject}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#666", textTransform: "uppercase" }}>Message</p>
            <div
              style={{
                backgroundColor: "#f5f5f5",
                padding: 16,
                borderRadius: 4,
                fontFamily: "monospace",
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {campaign.body}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Status */}
      <div className="wp-box" style={{ marginBottom: 24 }}>
        <div className="wp-box-head">Delivery Status</div>
        <div className="wp-box-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {[
              { label: "Queued", count: statusCounts.queued, color: "#f39c12" },
              { label: "Sent", count: statusCounts.sent, color: "#3498db" },
              { label: "Delivered", count: statusCounts.delivered, color: "#27ae60" },
              { label: "Bounced", count: statusCounts.bounced, color: "#e74c3c" },
              { label: "Complained", count: statusCounts.complained, color: "#c0392b" },
              { label: "Failed", count: statusCounts.failed, color: "#7f8c8d" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", padding: 12, backgroundColor: "#f9f9f9", borderRadius: 4 }}>
                <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#666" }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: s.color }}>{s.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email Log Details */}
      {emailLogs.length > 0 && (
        <div className="wp-box">
          <div className="wp-box-head">Email Log ({emailLogs.length} messages)</div>
          <div className="wp-table-wrap">
            <table className="wp-table">
              <thead>
                <tr>
                  <th style={{ width: 200 }}>Recipient</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 120 }}>Sent At</th>
                  <th style={{ width: 120 }}>Delivered At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="wp-help">{log.recipient}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 3,
                          fontSize: 12,
                          backgroundColor:
                            log.status === "delivered"
                              ? "#d4edda"
                              : log.status === "sent"
                              ? "#d1ecf1"
                              : log.status === "failed" || log.status === "bounced"
                              ? "#f8d7da"
                              : "#e2e3e5",
                          color:
                            log.status === "delivered"
                              ? "#155724"
                              : log.status === "sent"
                              ? "#0c5460"
                              : log.status === "failed" || log.status === "bounced"
                              ? "#721c24"
                              : "#383d41",
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="wp-help">{when(log.sentAt)}</td>
                    <td className="wp-help">{when(log.deliveredAt)}</td>
                    <td className="wp-help" style={{ color: "#d63638", maxWidth: 300 }}>
                      {log.error || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
