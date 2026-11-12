"use client";

import { useEffect, useRef, useState } from "react";

import {
  actualReadings,
  eligibleForecastDays,
  readSaved,
  writeSaved,
  downloadText,
  fmt,
} from "../lib/review-tools";

const STORAGE_KEY = "greenguard-forecast-v1";

interface ForecastSnapshot {
  id: string;
  site: string;
  city: string;
  capacity: number;
  performance: number;
  fetchedAt: string;
  savedAt: string;
  days: { date: string; kwh: number }[];
}

interface ForecastComparisonProps {
  city: string;
  capacity: number;
  performance: number;
  fetchedAt?: string;
  days: { date: string; kwh: number | null }[];
  disabled: boolean;
}

function getSnapshots(): ForecastSnapshot[] {
  const snapshots = readSaved<ForecastSnapshot>(STORAGE_KEY);

  if (
    snapshots.some(
      (snapshot) =>
        !snapshot ||
        !snapshot.id ||
        !Array.isArray(snapshot.days) ||
        !snapshot.fetchedAt,
    )
  ) {
    throw new Error("Unsupported saved forecast format.");
  }

  return snapshots;
}

export function ForecastComparison({
  city,
  capacity,
  performance,
  fetchedAt,
  days,
  disabled,
}: ForecastComparisonProps) {
  const [site, setSite] = useState("");
  const [saved, setSaved] = useState<ForecastSnapshot[]>([]);
  const [selected, setSelected] = useState("");

  const [message, setMessage] = useState("");
  const [actual, setActual] = useState<{ date: string; kwh: number }[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [fileName, setFileName] = useState("");

  const request = useRef(0);

  useEffect(() => {
    try {
      setSaved(getSnapshots());
    } catch (error) {
      setMessage(String(error));
    }
  }, []);

  const snapshot = saved.find((item) => item.id === selected);

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const todayIso = ["year", "month", "day"]
    .map((part) => dateParts.find((item) => item.type === part)?.value)
    .join("-");

  const eligible = snapshot
    ? eligibleForecastDays(
        snapshot.days,
        todayIso,
        snapshot.fetchedAt,
        snapshot.savedAt,
      )
    : [];

  const matched = confirmed
    ? eligible.flatMap((day) => {
        const reading = actual.find((item) => item.date === day.date);

        return reading
          ? [{ ...day, actual: reading.kwh }]
          : [];
      })
    : [];

  const expected = matched.reduce((sum, day) => sum + day.kwh, 0);
  const measured = matched.reduce((sum, day) => sum + day.actual, 0);

  const canSave =
    !disabled &&
    !!site.trim() &&
    !!fetchedAt &&
    days.length === 7 &&
    days.every((day) => day.kwh !== null);

  function resetReadings() {
    request.current++;
    setActual([]);
    setConfirmed(false);
    setFileName("");
  }

  function saveForecast() {
    if (!canSave || !fetchedAt) return;

    try {
      const next: ForecastSnapshot = {
        id: crypto.randomUUID(),
        site: site.trim(),
        city,
        capacity,
        performance,
        fetchedAt,
        savedAt: new Date().toISOString(),
        days: days.map((day) => ({
          date: day.date,
          kwh: day.kwh!,
        })),
      };

      const snapshots = [next, ...getSnapshots()].slice(0, 50);

      writeSaved(STORAGE_KEY, snapshots);
      setSaved(snapshots);
      setSelected(next.id);
      resetReadings();

      setMessage(
        "Forecast saved. Upload measured daily readings after the forecast days have finished.",
      );
    } catch {
      setMessage(
        "Could not save forecast. Browser storage may be unavailable or full.",
      );
    }
  }

  async function upload(file?: File) {
    const id = ++request.current;

    setActual([]);
    setConfirmed(false);
    setFileName("");

    if (!file) return;

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Choose a CSV below 10 MB.");
      }

      const readings = actualReadings(await file.text());

      if (id !== request.current) return;

      setActual(readings);
      setFileName(file.name);

      setMessage(
        `${readings.length} readings loaded. Confirm the site and settings below.`,
      );
    } catch (error) {
      if (id === request.current) {
        setMessage(
          error instanceof Error ? error.message : "Unable to read CSV.",
        );
      }
    }
  }

  return (
    <section className="gg-tool-panel gg-forecast-comparison">
      <span className="gg-eyebrow">PREDICTED VS ACTUAL</span>

      <h3>Save a forecast. Check what happened.</h3>

      <p>
        Preserve today’s estimate before the measured days begin.
        Compare it with daily inverter readings later. The latest 50
        snapshots stay in this browser.
      </p>

      <div className="gg-tool-actions">
        <label>
          Site / installation name
          <input
            maxLength={100}
            value={site}
            placeholder="e.g. Karachi office roof"
            onChange={(event) => setSite(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="gg-primary"
          disabled={!canSave}
          onClick={saveForecast}
        >
          Save this forecast
        </button>
      </div>

      <p role="status">{message}</p>

      <label>
        Saved forecast
        <select
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value);
            resetReadings();
            setMessage("");
          }}
        >
          <option value="">Choose a saved snapshot</option>

          {saved.map((item) => (
            <option key={item.id} value={item.id}>
              {item.site} · {item.city} ·{" "}
              {new Date(item.savedAt).toLocaleString()}
            </option>
          ))}
        </select>
      </label>

      {snapshot && (
        <>
          <p>
            <b>{snapshot.site}</b> · {snapshot.city} ·{" "}
            {snapshot.capacity} kWp · {snapshot.performance}% performance
          </p>

          <small>
            Data fetched: {new Date(snapshot.fetchedAt).toLocaleString()}
            {" · "}
            Snapshot saved: {new Date(snapshot.savedAt).toLocaleString()}
            {" · "}
            Day boundaries: Pakistan time. Values are frozen at save time.
          </small>

          <div className="gg-tool-actions">
            <button
              type="button"
              className="gg-secondary"
              onClick={() =>
                downloadText(
                  "actual-generation-template.csv",
                  "date,actual_kwh\n" +
                    snapshot.days.map((day) => `${day.date},`).join("\n"),
                )
              }
            >
              Download actual readings template
            </button>

            <button
              type="button"
              className="gg-secondary"
              onClick={() =>
                downloadText(
                  "forecast-snapshot.json",
                  JSON.stringify(snapshot, null, 2),
                  "application/json",
                )
              }
            >
              Export snapshot
            </button>
          </div>

          <label>
            Actual generation CSV: date,actual_kwh
            <input
              key={selected}
              type="file"
              accept=".csv"
              onChange={(event) => {
                void upload(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>

          <small>
            Fill the template with measured daily kWh. Remove unfinished
            days; blank values are rejected. {fileName}
          </small>

          {actual.length > 0 && (
            <label className="gg-confirm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              These are complete daily readings for {snapshot.site},
              with the same {snapshot.capacity} kWp system and Pakistan
              timezone.
            </label>
          )}

          <p>
            {eligible.length} completed day(s) eligible for an
            advance-forecast comparison. Today, future days and dates
            already started when the forecast was fetched or saved are
            excluded.
          </p>

          {matched.length > 0 ? (
            <>
              <div className="gg-tool-grid">
                <div>
                  <h4>Expected · matched dates</h4>
                  <strong>{fmt(expected)} kWh</strong>
                </div>

                <div>
                  <h4>Measured · matched dates</h4>
                  <strong>{fmt(measured)} kWh</strong>
                </div>

                <div>
                  <h4>Actual − expected</h4>
                  <strong>{fmt(measured - expected)} kWh</strong>
                  <p>
                    {expected > 0
                      ? `${fmt(((measured - expected) / expected) * 100)}%`
                      : "Percentage unavailable"}
                  </p>
                </div>
              </div>

              <div className="gg-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Forecast kWh</th>
                      <th>Actual kWh</th>
                      <th>Difference kWh</th>
                    </tr>
                  </thead>

                  <tbody>
                    {matched.map((day) => (
                      <tr key={day.date}>
                        <td>{day.date}</td>
                        <td>{fmt(day.kwh)}</td>
                        <td>{fmt(day.actual)}</td>
                        <td>{fmt(day.actual - day.kwh)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p>
                {matched.length} date(s) matched;{" "}
                {eligible.length - matched.length} eligible date(s)
                missing readings. {actual.length - matched.length} CSV
                row(s) excluded. Totals cover matched dates only.
              </p>

              <p>
                A generation gap is a signal to investigate weather
                uncertainty, shading, system downtime and meter quality.
                It does not establish fraud.
              </p>
            </>
          ) : (
            <p>
              {confirmed
                ? "No eligible dates match this CSV. Save a forecast in advance and return after those days finish."
                : "Upload readings and confirm the site to compare."}
            </p>
          )}
        </>
      )}
    </section>
  );
}