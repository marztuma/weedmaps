"use client";

import { useState, useEffect } from "react";

export default function LearnUpdaterDashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/cron/learn-status");
      const data = await res.json();
      setStatus(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function manualTrigger() {
    setTriggering(true);
    try {
      const cron_secret = prompt(
        "Enter CRON_SECRET to trigger update (or cancel):"
      );
      if (!cron_secret) {
        setTriggering(false);
        return;
      }

      const res = await fetch("/api/cron/update-learn", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cron_secret}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setLastUpdate({
          time: new Date().toLocaleString(),
          articlesAdded: data.articlesAdded,
        });
        fetchStatus();
        alert(
          `✓ Update triggered successfully! Articles added: ${data.articlesAdded}`
        );
      } else {
        alert(`✗ Update failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return <p className="wp-notice is-grey">Loading...</p>;
  }

  if (error) {
    return (
      <div className="wp-notice is-error">
        <p>
          <strong>Error:</strong> {error}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="wp-title">Learn Content Updater</h1>

      <div className="wp-box">
        <div className="wp-box-head">Automated Update Status</div>
        <div className="wp-box-body">
          {status?.learnContentStatus && (
            <>
              <table className="wp-table">
                <tbody>
                  <tr>
                    <td>
                      <strong>Total Articles</strong>
                    </td>
                    <td>{status.learnContentStatus.totalArticles}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Average Read Time</strong>
                    </td>
                    <td>{status.learnContentStatus.averageReadTime} min</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Content Status</strong>
                    </td>
                    <td>
                      {status.learnContentStatus.allArticlesComplete ? (
                        <span className="wp-pill is-green">All Complete</span>
                      ) : (
                        <span className="wp-pill is-amber">
                          {status.learnContentStatus.missingFieldCount} issues
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Next Scheduled Update</strong>
                    </td>
                    <td>
                      {new Date(
                        status.nextScheduledUpdate
                      ).toLocaleString()}
                      <span className="wp-pill is-blue" style={{ marginLeft: 8 }}>
                        Saturday 8 PM UTC
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Last Manual Check</strong>
                    </td>
                    <td>
                      {lastUpdate
                        ? `${lastUpdate.time} (+${lastUpdate.articlesAdded} articles)`
                        : "None yet"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 16 }}>
                <button
                  className="wp-btn"
                  onClick={manualTrigger}
                  disabled={triggering}
                >
                  {triggering ? "Triggering..." : "Trigger Manual Update"}
                </button>
                <p className="wp-help">
                  Manually run the update now (requires CRON_SECRET). Useful for
                  testing.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Articles</div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr>
                <th>Title</th>
                <th style={{ width: 80 }}>Read Time</th>
                <th style={{ width: 60 }}>Sections</th>
                <th style={{ width: 80 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {status?.learnContentStatus?.articles.map((article) => (
                <tr key={article.title}>
                  <td>{article.title}</td>
                  <td>{article.readTime}</td>
                  <td>{article.sections}</td>
                  <td>
                    {article.complete ? (
                      <span className="wp-pill is-green">✓</span>
                    ) : (
                      <span className="wp-pill is-red">!</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Setup Instructions</div>
        <div className="wp-box-body">
          <h3 style={{ marginTop: 0 }}>To enable automated updates:</h3>

          <div style={{ marginBottom: 16 }}>
            <strong>1. Set Environment Variable</strong>
            <p className="wp-help">
              In Vercel dashboard → Settings → Environment Variables, add:
            </p>
            <code
              style={{
                display: "block",
                padding: "8px 12px",
                backgroundColor: "#f0f0f0",
                borderRadius: 4,
                marginTop: 8,
              }}
            >
              CRON_SECRET=your-secure-random-string-here
            </code>
          </div>

          <div style={{ marginBottom: 16 }}>
            <strong>2. Deploy</strong>
            <p className="wp-help">
              Push your changes (vercel.json is already configured). Vercel will
              set up the cron job automatically.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <strong>3. Verify</strong>
            <p className="wp-help">
              Check this page weekly. The status will show the next scheduled
              update time and article count.
            </p>
          </div>

          <div style={{ marginBottom: 0 }}>
            <strong>Schedule:</strong>
            <p className="wp-help">
              Every Saturday at 8 PM UTC (update in vercel.json to change)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
