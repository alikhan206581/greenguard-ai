"use client";

import { useState } from "react";
import {
  Cloud,
  Moon,
  Pause,
  Play,
  Sun,
  MapPin,
  Wind,
} from "lucide-react";

interface WeatherSceneProps {
  city: string;
  isDay: number | null | undefined;
  temperature: number | null;
  cloudCover: number | null;
  wind: number | null;
  code: number | null;
  description: string;
  stale?: boolean;
}

export function WeatherScene({
  city,
  isDay,
  temperature,
  cloudCover,
  wind,
  code,
  description,
  stale = false,
}: WeatherSceneProps) {
  const [paused, setPaused] = useState(false);

  const mode =
    isDay === 1
      ? "day"
      : isDay === 0
      ? "night"
      : "unknown";

  const rainy = [
    51, 53, 55, 56, 57,
    61, 63, 65, 66, 67,
    80, 81, 82,
    95, 96, 99,
  ].includes(code ?? -1);

  const snowy = [71, 73, 75, 77, 85, 86].includes(
    code ?? -1
  );

  const cloudy =
    rainy ||
    snowy ||
    [2, 3, 45, 48].includes(code ?? -1) ||
    (cloudCover !== null && cloudCover > 25);

  function format(value: number | null, unit: string) {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      return "—";
    }

    return `${Math.round(value)}${unit}`;
  }

  const stars = [
    [8, 12],
    [30, 20],
    [63, 8],
    [84, 28],
    [18, 65],
    [77, 68],
    [94, 8],
    [49, 80],
    [5, 40],
  ];

  return (
    <section
      className={`gg-weather-scene ${mode} ${
        paused ? "motion-paused" : ""
      }`}
      aria-label={`${city}: ${description}. ${
        mode === "day"
          ? "Daytime"
          : mode === "night"
          ? "Nighttime"
          : "Daylight status unavailable"
      }${stale ? ". Last available weather data." : ""}`}
    >
      <div className="gg-weather-copy">
        <span className="gg-weather-location">
          <MapPin size={14} />

          {city}, Pakistan

          <span>
            {stale ? "LAST AVAILABLE" : "WEATHER MODEL"}
          </span>
        </span>

        <h3>
          {mode === "day"
            ? "A little sunshine. A lot of possibility."
            : mode === "night"
            ? "Rest tonight. Plan tomorrow’s energy."
            : "Your local weather outlook."}
        </h3>

        <div className="gg-weather-temperature">
          {format(temperature, "°")}

          <span>
            <strong>{description}</strong>

            <small>
              {mode === "day"
                ? "Daytime at your selected location"
                : mode === "night"
                ? "Nighttime at your selected location"
                : "Daylight information unavailable"}
            </small>
          </span>
        </div>

        <div className="gg-weather-facts">
          <span>
            <Wind size={15} />
            Wind {format(wind, " km/h")}
          </span>

          <span>
            <Cloud size={15} />
            Cloud cover {format(cloudCover, "%")}
          </span>
        </div>

        {mode === "night" && (
          <p className="gg-night-note">
            The energy cards show full-day forecasts,
            not generation happening tonight.
          </p>
        )}
      </div>

      {/* Decorative weather animation */}

      <div className="gg-weather-art" aria-hidden="true">
        {mode === "night" && (
          <div className="gg-stars">
            {stars.map(([left, top], index) => (
              <i
                key={index}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${index * 0.45}s`,
                }}
              />
            ))}
          </div>
        )}

        {mode === "day" ? (
          <div className="gg-sun-orbit">
            <Sun
              className="gg-weather-sun"
              size={120}
              strokeWidth={1.2}
            />
          </div>
        ) : mode === "night" ? (
          <div className="gg-moon-orbit">
            <Moon
              className="gg-weather-moon"
              size={100}
              strokeWidth={1.2}
            />
          </div>
        ) : (
          <Cloud
            className="gg-weather-unknown"
            size={90}
          />
        )}

        {(cloudy || mode === "unknown") && (
          <>
            <Cloud
              className="gg-scene-cloud cloud-one"
              size={110}
              strokeWidth={1}
            />

            <Cloud
              className="gg-scene-cloud cloud-two"
              size={75}
              strokeWidth={1}
            />
          </>
        )}

        {rainy && (
          <div className="gg-rain">
            {Array.from({ length: 7 }, (_, index) => (
              <i
                key={index}
                style={{
                  left: `${20 + index * 9}%`,
                  animationDelay: `${index * 0.23}s`,
                }}
              />
            ))}
          </div>
        )}

        {snowy && (
          <div className="gg-snow">
            {Array.from({ length: 7 }, (_, index) => (
              <i
                key={index}
                style={{
                  left: `${20 + index * 9}%`,
                  animationDelay: `${index * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="gg-weather-horizon" />
      </div>

      <button
        type="button"
        className="gg-motion-button"
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? (
          <Play size={13} />
        ) : (
          <Pause size={13} />
        )}

        {paused ? "Play animation" : "Pause animation"}
      </button>
    </section>
  );
}