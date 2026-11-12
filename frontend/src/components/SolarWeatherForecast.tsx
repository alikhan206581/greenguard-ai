"use client";

import { useEffect, useState } from "react";
import {
  CloudSun,
  RefreshCw,
  Sun,
  Zap,
} from "lucide-react";

import { WeatherScene } from "./WeatherScene";
import { AnimatedNumber } from "./AnimatedNumber";
import { ForecastComparison } from "./ForecastComparison";

const cities = {
  Karachi: [24.8607, 67.0011],
  Lahore: [31.5204, 74.3587],
  Islamabad: [33.6844, 73.0479],
  Peshawar: [34.0151, 71.5249],
  Quetta: [30.1798, 66.975],
  Faisalabad: [31.4504, 73.135],
  Multan: [30.1575, 71.5249],
} as const;

type City = keyof typeof cities;
type MaybeNumber = number | null;

interface WeatherData {
  city: City;
  fetchedAt: string;

  current: {
    time: string;
    is_day: MaybeNumber;
    temperature_2m: MaybeNumber;
    cloud_cover: MaybeNumber;
    wind_speed_10m: MaybeNumber;
    weather_code: MaybeNumber;
  };

  daily: {
    time: string[];
    shortwave_radiation_sum: MaybeNumber[];
    temperature_2m_max: MaybeNumber[];
    weather_code: MaybeNumber[];
  };
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(
  value: MaybeNumber | undefined,
  suffix = ""
) {
  if (!isNumber(value)) return "—";

  return (
    value.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    }) + suffix
  );
}

function weatherCondition(code: MaybeNumber | undefined) {
  if (code === 0) return "Clear sky";

  if (code === 1 || code === 2) {
    return "Partly cloudy";
  }

  if (code === 3) return "Overcast";

  if (code === 45 || code === 48) {
    return "Fog";
  }

  if ([51, 53, 55, 56, 57].includes(code ?? -1)) {
    return "Drizzle";
  }

  if (
    [61, 63, 65, 66, 67, 80, 81, 82].includes(code ?? -1)
  ) {
    return "Rain";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) {
    return "Snow";
  }

  if ([95, 96, 99].includes(code ?? -1)) {
    return "Thunderstorm";
  }

  return "Unavailable";
}

function formatDate(date: string) {
  return new Date(
    `${date}T12:00:00+05:00`
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Karachi",
  });
}

function dayLabel(date: string, index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";

  return new Date(
    `${date}T12:00:00+05:00`
  ).toLocaleDateString("en-GB", {
    weekday: "short",
    timeZone: "Asia/Karachi",
  });
}

export function SolarWeatherForecast() {
  const [city, setCity] = useState<City>("Karachi");

  const [capacity, setCapacity] = useState("5");
  const [performance, setPerformance] = useState("80");

  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<WeatherData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refresh every 15 minutes while the page is visible.
  // Also refresh when the user returns to this browser tab.
  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "visible") {
        setRefresh((value) => value + 1);
      }
    };

    const timer = window.setInterval(
      update,
      15 * 60 * 1000
    );

    document.addEventListener("visibilitychange", update);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener(
        "visibilitychange",
        update
      );
    };
  }, []);

  // Fetch when the city changes or a refresh is requested.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 15000);

    setLoading(true);
    setError(null);

    const loadWeather = async () => {
      try {
        const [latitude, longitude] = cities[city];

        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),

          current:
            "temperature_2m,cloud_cover,weather_code,wind_speed_10m,is_day",

          daily:
            "shortwave_radiation_sum,temperature_2m_max,weather_code",

          timezone: "Asia/Karachi",
          forecast_days: "7",
          temperature_unit: "celsius",
          wind_speed_unit: "kmh",
        });

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Weather service unavailable (${response.status}). Try again shortly.`
          );
        }

        const result = await response.json();
        const daily = result.daily;

        const validDailyArrays =
          Array.isArray(daily?.time) &&
          daily.time.length === 7 &&
          [
            daily.shortwave_radiation_sum,
            daily.temperature_2m_max,
            daily.weather_code,
          ].every(
            (values) =>
              Array.isArray(values) &&
              values.length === daily.time.length &&
              values.every(
                (value: unknown) =>
                  value === null || isNumber(value)
              )
          );

        if (
          result.error ||
          !result.current ||
          typeof result.current.time !== "string" ||
          !validDailyArrays ||
          result.daily_units?.shortwave_radiation_sum !==
            "MJ/m²"
        ) {
          throw new Error(
            "Weather service returned incomplete or unexpected data."
          );
        }

        if (!cancelled) {
          setData({
            city,
            fetchedAt: new Date().toISOString(),

            current: {
              time: result.current.time,

              is_day:
                result.current.is_day === 0 ||
                result.current.is_day === 1
                  ? result.current.is_day
                  : null,

              temperature_2m: isNumber(
                result.current.temperature_2m
              )
                ? result.current.temperature_2m
                : null,

              cloud_cover: isNumber(
                result.current.cloud_cover
              )
                ? result.current.cloud_cover
                : null,

              wind_speed_10m: isNumber(
                result.current.wind_speed_10m
              )
                ? result.current.wind_speed_10m
                : null,

              weather_code: isNumber(
                result.current.weather_code
              )
                ? result.current.weather_code
                : null,
            },

            daily,
          });
        }
      } catch (err) {
        if (cancelled) return;

        if (controller.signal.aborted) {
          setError(
            "Weather request timed out. Check your internet and retry."
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load weather."
          );
        }
      } finally {
        window.clearTimeout(timeout);

        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWeather();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [city, refresh]);

  // Avoid displaying another city's data after selection changes.
  const weather = data?.city === city ? data : null;

  const capacityKw = Number(capacity);
  const performanceRatio = Number(performance) / 100;

  const validSettings =
    capacity.trim() !== "" &&
    performance.trim() !== "" &&
    Number.isFinite(capacityKw) &&
    capacityKw > 0 &&
    capacityKw <= 100000 &&
    Number.isFinite(performanceRatio) &&
    performanceRatio >= 0.5 &&
    performanceRatio <= 0.95;

  const days =
    weather?.daily.time.map((date, index) => {
      const radiation =
        weather.daily.shortwave_radiation_sum[index];

      // Convert MJ/m² to kWh/m².
      // At reference irradiance of 1 kW/m²,
      // this gives equivalent peak-sun hours.
      const sunHours =
        isNumber(radiation) && radiation >= 0
          ? radiation / 3.6
          : null;

      const estimatedKwh =
        validSettings && sunHours !== null
          ? capacityKw * sunHours * performanceRatio
          : null;

      return {
        date,
        sunHours,
        kwh: estimatedKwh,
        temperature:
          weather.daily.temperature_2m_max[index],
        code: weather.daily.weather_code[index],
      };
    }) ?? [];

  const total =
    days.length === 7 &&
    days.every((day) => day.kwh !== null)
      ? days.reduce(
          (sum, day) => sum + (day.kwh ?? 0),
          0
        )
      : null;

  const maximum = Math.max(
    1,
    ...days.map((day) => day.kwh ?? 0)
  );

  const fieldClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800";

  return (
    <section
      className="rounded-2xl border border-emerald-200 bg-white p-6 space-y-5"
      aria-labelledby="weather-title"
    >
      {/* Heading */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="gg-eyebrow">
            WEATHER & SOLAR OUTLOOK
          </span>

          <h2
            id="weather-title"
            className="flex items-center gap-2 text-xl font-semibold text-slate-900"
          >
            <CloudSun className="text-emerald-600" />
            Weather today. Energy ahead.
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            Current model conditions + 7-day forecast.
            Refreshes every 15 minutes while this tab is active.
          </p>
        </div>

        <button
          type="button"
          className="gg-primary"
          disabled={loading}
          onClick={() =>
            setRefresh((value) => value + 1)
          }
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />

          {loading ? "Updating…" : "Refresh weather"}
        </button>
      </div>

      {/* Animated sun / moon scene */}

      {weather && (
        <WeatherScene
          city={city}
          isDay={weather.current.is_day}
          temperature={weather.current.temperature_2m}
          cloudCover={weather.current.cloud_cover}
          wind={weather.current.wind_speed_10m}
          code={weather.current.weather_code}
          description={weatherCondition(
            weather.current.weather_code
          )}
          stale={Boolean(error)}
        />
      )}

      {/* Forecast settings */}

      <div className="gg-forecast-controls grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="text-xs font-medium text-slate-600">
          Choose your city

          <select
            className={fieldClass}
            value={city}
            onChange={(event) =>
              setCity(event.target.value as City)
            }
          >
            {Object.keys(cities).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-600">
          Your solar capacity (kWp DC)

          <input
            className={fieldClass}
            type="number"
            min="0.1"
            max="100000"
            step="0.1"
            value={capacity}
            onChange={(event) =>
              setCapacity(event.target.value)
            }
          />
        </label>

        <label className="text-xs font-medium text-slate-600">
          System performance (%)

          <input
            className={fieldClass}
            type="number"
            min="50"
            max="95"
            step="1"
            value={performance}
            onChange={(event) =>
              setPerformance(event.target.value)
            }
          />
        </label>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Tip: enter your panel system’s rated capacity, for example
        5 kWp. Leave performance at 80% for an initial estimate.
        These settings are separate from the historical solar
        audit below. City coordinates are approximate.
      </p>

      {!validSettings && (
        <p role="alert" className="text-sm text-rose-700">
          Enter a capacity above 0 and up to 100,000 kWp,
          and a performance ratio between 50% and 95%.
        </p>
      )}

      {/* Error and loading states */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {error}

          {weather && (
            <p className="mt-2 text-xs">
              Showing the last successful fetch. These values
              may be outdated.
            </p>
          )}
        </div>
      )}

      {loading && !weather && (
        <p
          role="status"
          className="text-sm text-slate-500"
        >
          Fetching weather data for {city}…
        </p>
      )}

      {weather && (
        <>
          {/* Data timestamps */}

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span>
              {city} ·{" "}
              {error ? "Last available data" : "API data"}
            </span>

            <span>
              Fetched:{" "}
              {new Date(
                weather.fetchedAt
              ).toLocaleString("en-GB", {
                timeZone: "Asia/Karachi",
              })}{" "}
              PKT
            </span>

            <span>
              Model valid time:{" "}
              {weather.current.time.replace("T", " ")} PKT
            </span>
          </div>

          {/* Summary cards */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="gg-metric">
              <div>
                <span>Current conditions</span>
                <CloudSun size={18} />
              </div>

              <strong>
                {formatNumber(
                  weather.current.temperature_2m,
                  "°C"
                )}
              </strong>

              <small>
                {weatherCondition(
                  weather.current.weather_code
                )}
              </small>
            </div>

            <div className="gg-metric">
              <div>
                <span>Cloud cover</span>
                <CloudSun size={18} />
              </div>

              <strong>
                {formatNumber(
                  weather.current.cloud_cover,
                  "%"
                )}
              </strong>

              <small>
                Wind:{" "}
                {formatNumber(
                  weather.current.wind_speed_10m,
                  " km/h"
                )}
              </small>
            </div>

            <div className="gg-metric">
              <div>
                <span>Today · full-day estimate</span>
                <Zap size={18} />
              </div>

              <strong>
                <AnimatedNumber
                  value={days[0]?.kwh}
                  decimals={1}
                />
              </strong>

              <small>
                kWh estimated · not generated so far
              </small>
            </div>

            <div className="gg-metric">
              <div>
                <span>7-day estimate</span>
                <Zap size={18} />
              </div>

              <strong>
                <AnimatedNumber
                  value={total}
                  decimals={1}
                />
              </strong>

              <small>
                kWh estimated · includes today
              </small>
            </div>
          </div>

          {/* Seven-day cards */}

          <div className="gg-section-title">
            <h3 className="text-base font-semibold">
              Your next 7 days
            </h3>

            <span>Estimated daily output</span>
          </div>

          <div className="gg-forecast-days">
            {days.map((day, index) => (
              <article
                className="gg-forecast-day"
                key={day.date}
              >
                <span>{dayLabel(day.date, index)}</span>

                <small>{formatDate(day.date)}</small>

                {day.code === 0 ? (
                  <Sun size={25} />
                ) : (
                  <CloudSun size={25} />
                )}

                <p>{weatherCondition(day.code)}</p>

                <strong>
                  {formatNumber(day.kwh)}{" "}
                  <small>kWh</small>
                </strong>

                <div
                  className="gg-forecast-bar"
                  aria-hidden="true"
                >
                  <i
                    style={{
                      width: `${
                        ((day.kwh ?? 0) / maximum) * 100
                      }%`,
                    }}
                  />
                </div>

                <small>
                  High {formatNumber(day.temperature, "°C")}
                </small>
              </article>
            ))}
          </div>

          {/* Detailed forecast table */}

          <details className="gg-disclosure">
            <summary>
              View forecast data table

              <span>
                Daily radiation, weather and energy estimates
              </span>
            </summary>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px] text-left text-sm">
                <caption className="py-3 text-left text-sm font-semibold text-slate-700">
                  Daily solar generation outlook · Pakistan time
                </caption>

                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th scope="col" className="p-3">
                      Date
                    </th>

                    <th scope="col" className="p-3">
                      Weather
                    </th>

                    <th scope="col" className="p-3">
                      Max temp.
                    </th>

                    <th scope="col" className="p-3">
                      Peak-sun hours
                    </th>

                    <th scope="col" className="p-3">
                      Estimated energy
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {days.map((day) => (
                    <tr
                      key={day.date}
                      className="border-t border-slate-100"
                    >
                      <td className="whitespace-nowrap p-3">
                        {day.date}
                      </td>

                      <td className="p-3">
                        {weatherCondition(day.code)}
                      </td>

                      <td className="p-3">
                        {formatNumber(
                          day.temperature,
                          "°C"
                        )}
                      </td>

                      <td className="p-3">
                        {formatNumber(day.sunHours, " h")}
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-emerald-700">
                          {formatNumber(day.kwh, " kWh")}
                        </span>

                        <div
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-full rounded bg-emerald-50"
                        >
                          <div
                            className="h-full rounded bg-emerald-500 transition-all duration-700 motion-reduce:transition-none"
                            style={{
                              width: `${
                                ((day.kwh ?? 0) / maximum) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <ForecastComparison
        city={city}
        capacity={capacityKw}
        performance={Number(performance)}
        fetchedAt={weather?.fetchedAt}
        days={days}
        disabled={loading || !!error || !validSettings || !weather}
      />

      {/* Calculation explanation */}

      <details className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold">
          How the generation estimate works
        </summary>

        <p className="mt-3 leading-relaxed">
          Estimated kWh = installed kWp × (daily solar radiation
          in MJ/m² ÷ 3.6) × performance ratio.
          Solar radiation is forecast horizontal irradiation;
          cloud effects are already included. Peak-sun hours
          are equivalent irradiation hours, not daylight duration.
        </p>

        <p className="mt-2 leading-relaxed">
          This is an approximate planning estimate, not a
          calibrated PV simulation. Panel tilt, orientation,
          shading, inverter clipping and site-specific temperature
          effects are not modelled explicitly. The default 80%
          performance ratio assumes combined system losses.
        </p>

        <p className="mt-2 leading-relaxed">
          Actual generation requires inverter or meter data.
          Today’s number is a full-day estimate, not energy
          remaining or measured production.
        </p>
      </details>

      {/* Attribution */}

      <p className="text-xs leading-relaxed text-slate-500">
        Weather data:{" "}
        <a
          className="text-emerald-700 underline"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo
        </a>{" "}
        ·{" "}
        <a
          className="underline"
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 4.0
        </a>
        . Internet required. This weather request sends
        coordinates and forecast parameters, not uploaded
        evidence files.
      </p>
    </section>
  );
}