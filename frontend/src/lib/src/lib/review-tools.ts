export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];

  let row: string[] = [];
  let value = "";
  let quoted = false;
  let closed = false;

  const input = text.replace(/^\uFEFF/, "");

  const finishCell = () => {
    row.push(value.trim());
    value = "";
    closed = false;
  };

  for (let i = 0; i < input.length; i++) {
    const character = input[i];

    if (quoted) {
      if (character === '"') {
        if (input[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        value += character;
      }

      continue;
    }

    if (character === '"' && !value && !closed) {
      quoted = true;
    } else if (character === ",") {
      finishCell();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[i + 1] === "\n") {
        i++;
      }

      finishCell();

      if (row.some(Boolean)) {
        rows.push(row);
      }

      row = [];
    } else {
      if (closed && character.trim()) {
        throw new Error("Unexpected text after a quoted CSV field.");
      }

      if (character === '"') {
        throw new Error("Quotes must surround the entire CSV field.");
      }

      value += character;
    }
  }

  if (quoted) {
    throw new Error("Unclosed quote in CSV.");
  }

  finishCell();

  if (row.some(Boolean)) {
    rows.push(row);
  }

  if (rows.length < 2) {
    throw new Error("Include a header and at least one data row.");
  }

  const headers = rows[0].map((header) => header.toLowerCase());

  if (
    headers.some((header) => !header) ||
    new Set(headers).size !== headers.length
  ) {
    throw new Error("Column names must be non-empty and unique.");
  }

  rows.slice(1).forEach((record, index) => {
    if (record.length !== headers.length) {
      throw new Error(
        `Row ${index + 2}: expected ${headers.length} columns, found ${record.length}.`,
      );
    }
  });

  return rows;
}

export function validDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function checkEvidence(text: string) {
  const [originalHeaders, ...rows] = parseCsv(text);
  const headers = originalHeaders.map((header) => header.toLowerCase());

  const errors: string[] = [];
  const warnings: string[] = [];

  const dateIndex = headers.findIndex((header) =>
    ["month", "date", "timestamp"].includes(header),
  );

  const energyIndexes = headers
    .map((header, index) => (/kwh$/.test(header) ? index : -1))
    .filter((index) => index >= 0);

  const identityIndexes = headers
    .map((header, index) =>
      ["facility_id", "meter_id", "inverter_id", "period"].includes(header)
        ? index
        : -1,
    )
    .filter((index) => index >= 0);

  if (dateIndex < 0) {
    warnings.push(
      "No month, date or timestamp column detected. Confirm your backend’s required date column.",
    );
  }

  if (!energyIndexes.length) {
    warnings.push(
      "No kWh columns detected. Confirm energy column names with your backend.",
    );
  }

  const seen = new Set<string>();
  const months = new Set<number>();

  rows.forEach((record, index) => {
    energyIndexes.forEach((column) => {
      const value = record[column];

      if (
        !value ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
      ) {
        errors.push(
          `Row ${index + 2}: ${originalHeaders[column]} must be a non-negative number.`,
        );
      }
    });

    if (dateIndex < 0) return;

    const date = record[dateIndex];

    if (!date) {
      errors.push(`Row ${index + 2}: missing date.`);
      return;
    }

    const identity = JSON.stringify([
      date,
      ...identityIndexes.map((column) => record[column]),
    ]);

    if (seen.has(identity)) {
      errors.push(
        `Row ${index + 2}: duplicate date for the same meter/facility/period.`,
      );
    }

    seen.add(identity);

    if (
      /^\d{4}-\d{2}$/.test(date) &&
      Number(date.slice(5)) >= 1 &&
      Number(date.slice(5)) <= 12
    ) {
      months.add(
        Number(date.slice(0, 4)) * 12 + Number(date.slice(5)) - 1,
      );
    } else if (!validDate(date)) {
      warnings.push(
        `Row ${index + 2}: date is not YYYY-MM or YYYY-MM-DD; backend must validate it.`,
      );
    }
  });

  if (months.size) {
    const values = [...months];

    const missing =
      Math.max(...values) - Math.min(...values) + 1 - months.size;

    if (missing > 0) {
      warnings.push(
        `${missing} month(s) missing within the overall date range. Check each facility’s coverage too.`,
      );
    }
  }

  const periodIndex = headers.indexOf("period");

  if (periodIndex >= 0) {
    for (const period of ["baseline", "reporting"]) {
      if (
        !rows.some(
          (record) => record[periodIndex].toLowerCase() === period,
        )
      ) {
        warnings.push(`No ${period} rows found.`);
      }
    }
  }

  return {
    count: rows.length,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  };
}

export function actualReadings(
  text: string,
): { date: string; kwh: number }[] {
  const [originalHeaders, ...rows] = parseCsv(text);
  const headers = originalHeaders.map((header) => header.toLowerCase());

  const dateIndex = headers.indexOf("date");
  const energyIndex = headers.indexOf("actual_kwh");

  if (dateIndex < 0 || energyIndex < 0) {
    throw new Error(
      "Use columns date,actual_kwh — one completed day per row.",
    );
  }

  const seen = new Set<string>();

  return rows.map((record, index) => {
    const date = record[dateIndex];
    const value = record[energyIndex];

    if (!validDate(date) || seen.has(date)) {
      throw new Error(
        `Row ${index + 2}: invalid or duplicate date. Use YYYY-MM-DD.`,
      );
    }

    seen.add(date);

    if (
      !value ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0
    ) {
      throw new Error(
        `Row ${index + 2}: actual_kwh must be a non-negative number.`,
      );
    }

    return { date, kwh: Number(value) };
  });
}

export function eligibleForecastDays<T extends { date: string }>(
  days: T[],
  todayIso: string,
  fetchedAt: string,
  savedAt: string,
): T[] {
  return days.filter((day) => {
    const start = Date.parse(`${day.date}T00:00:00+05:00`);

    return (
      validDate(day.date) &&
      day.date < todayIso &&
      start > Date.parse(fetchedAt) &&
      start > Date.parse(savedAt)
    );
  });
}

export function downloadText(
  name: string,
  text: string,
  type = "text/csv",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = name;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readSaved<T>(key: string): T[] {
  const text = localStorage.getItem(key);

  if (!text) return [];

  const value = JSON.parse(text);

  if (!Array.isArray(value)) {
    throw new Error("Saved data has an unsupported format.");
  }

  return value;
}

export function writeSaved<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
  window.dispatchEvent(new Event("greenguard-saved"));
}

export const fmt = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-US", { maximumFractionDigits: 1 })
    : "—";
    