import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { AlertRuleResponse } from "../domain/alertRules";
import { DEFAULT_ALERT_FORM, toAlertRuleRequest, type AlertFormState } from "./alertForm";

interface AlertListResponse {
  alerts: AlertRuleResponse[];
}

interface AlertCreateResponse {
  alert: AlertRuleResponse;
}

interface ApiErrorResponse {
  error: {
    message: string;
  };
}

export function AdminApp() {
  const [alerts, setAlerts] = useState<AlertRuleResponse[]>([]);
  const [form, setForm] = useState<AlertFormState>(DEFAULT_ALERT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Loading alert rules...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setError(null);

    try {
      const response = await requestJson<AlertListResponse>("/api/alerts");
      setAlerts(response.alerts);
      setMessage(response.alerts.length === 0 ? "No alert rules yet." : `${response.alerts.length} alert rule(s) loaded.`);
    } catch (loadError) {
      setError(readErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await requestJson<AlertCreateResponse>("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toAlertRuleRequest(form))
      });

      setAlerts((current) => [response.alert, ...current]);
      setForm(DEFAULT_ALERT_FORM);
      setMessage(`Created alert rule "${response.alert.name}".`);
    } catch (submitError) {
      setError(readErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function setAlertActive(alert: AlertRuleResponse, active: boolean) {
    setError(null);

    try {
      const response = await requestJson<AlertCreateResponse>(`/api/alerts/${encodeURIComponent(alert.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active })
      });

      setAlerts((current) => current.map((item) => (item.id === alert.id ? response.alert : item)));
      setMessage(`${response.alert.name} is now ${response.alert.active ? "active" : "disabled"}.`);
    } catch (updateError) {
      setError(readErrorMessage(updateError));
    }
  }

  async function deleteAlert(alert: AlertRuleResponse) {
    setError(null);

    try {
      await requestNoContent(`/api/alerts/${encodeURIComponent(alert.id)}`, { method: "DELETE" });
      setAlerts((current) => current.filter((item) => item.id !== alert.id));
      setMessage(`Deleted alert rule "${alert.name}".`);
    } catch (deleteError) {
      setError(readErrorMessage(deleteError));
    }
  }

  function updateField<K extends keyof AlertFormState>(field: K, value: AlertFormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateThresholdType(event: ChangeEvent<HTMLSelectElement>) {
    const thresholdType = event.target.value;
    setForm((current) => ({
      ...current,
      thresholdType,
      thresholdValue: thresholdType === "numeric" ? "5" : "high"
    }));
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Alert operations</p>
        <h1>Alert Notifications Admin</h1>
        <p>
          Create demo alert rules for world events, choose email or Slack, and
          keep the configuration visible before notification delivery is added.
        </p>
      </section>

      <section className="panel">
        <div>
          <p className="eyebrow">New rule</p>
          <h2>Create an alert</h2>
        </div>

        <form className="alert-form" onSubmit={handleSubmit}>
          <label>
            Rule name
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="High severity disasters"
              required
            />
          </label>

          <label>
            Category
            <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
              <option value="disaster">Natural disasters</option>
              <option value="breaking-news">Breaking news</option>
              <option value="market">Market movements</option>
            </select>
          </label>

          <label>
            Trigger type
            <select value={form.thresholdType} onChange={updateThresholdType}>
              <option value="severity">Severity</option>
              <option value="numeric">Numeric threshold</option>
            </select>
          </label>

          <label>
            Trigger value
            <input
              value={form.thresholdValue}
              onChange={(event) => updateField("thresholdValue", event.target.value)}
              placeholder={form.thresholdType === "numeric" ? "5" : "high"}
              required
            />
          </label>

          <label>
            Channel
            <select value={form.channel} onChange={(event) => updateField("channel", event.target.value)}>
              <option value="email">Email</option>
              <option value="slack">Slack</option>
            </select>
          </label>

          <label>
            Destination
            <input
              value={form.destination}
              onChange={(event) => updateField("destination", event.target.value)}
              placeholder={form.channel === "email" ? "ops@example.com" : "demo-slack"}
              required
            />
          </label>

          <label className="checkbox">
            <input
              checked={form.active}
              type="checkbox"
              onChange={(event) => updateField("active", event.target.checked)}
            />
            Active immediately
          </label>

          <button disabled={saving} type="submit">
            {saving ? "Creating..." : "Create alert"}
          </button>
        </form>

        <StatusMessage error={error} loading={loading} message={message} />
      </section>

      <section className="panel">
        <div className="table-heading">
          <div>
            <p className="eyebrow">Configured alerts</p>
            <h2>Rules</h2>
          </div>
          <button className="secondary" disabled={loading} onClick={() => void loadAlerts()} type="button">
            Refresh
          </button>
        </div>

        {alerts.length === 0 ? (
          <p className="empty">Create a rule to start the notification demo.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Trigger</th>
                  <th>Channel</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.name}</td>
                    <td>
                      {alert.category} / {alert.thresholdType} {alert.thresholdValue}
                    </td>
                    <td>{alert.channel}</td>
                    <td>{alert.destinationSummary}</td>
                    <td>
                      <span className={alert.active ? "pill active" : "pill"}>{alert.active ? "Active" : "Disabled"}</span>
                    </td>
                    <td className="actions">
                      <button className="secondary" onClick={() => void setAlertActive(alert, !alert.active)} type="button">
                        {alert.active ? "Disable" : "Enable"}
                      </button>
                      <button className="danger" onClick={() => void deleteAlert(alert)} type="button">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusMessage({ error, loading, message }: { error: string | null; loading: boolean; message: string }) {
  if (error) {
    return <p className="status error">{error}</p>;
  }

  return <p className="status">{loading ? "Loading..." : message}</p>;
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json()) as T | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in body ? body.error.message : "Request failed.");
  }

  return body as T;
}

async function requestNoContent(input: RequestInfo, init?: RequestInit): Promise<void> {
  const response = await fetch(input, init);

  if (!response.ok) {
    const body = (await response.json()) as ApiErrorResponse;
    throw new Error(body.error.message);
  }
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}
