"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";

export type CalculatorMode =
  | "standard"
  | "scientific"
  | "graphing"
  | "programmer"
  | "date"
  | "currency"
  | "volume"
  | "length"
  | "mass"
  | "temperature"
  | "energy"
  | "area"
  | "speed"
  | "time"
  | "power"
  | "data"
  | "pressure"
  | "angle";

type Token = { type: "number" | "name" | "operator" | "paren"; value: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
    } else if (/[0-9.]/.test(char)) {
      let value = char;
      index += 1;
      while (index < source.length && /[0-9.eE]/.test(source[index])) value += source[index++];
      if (!Number.isFinite(Number(value))) throw new Error("Invalid number");
      tokens.push({ type: "number", value });
    } else if (/[a-z]/i.test(char)) {
      let value = char;
      index += 1;
      while (index < source.length && /[a-z0-9]/i.test(source[index])) value += source[index++];
      tokens.push({ type: "name", value: value.toLowerCase() });
    } else if ("+-*/^%".includes(char)) {
      tokens.push({ type: "operator", value: char });
      index += 1;
    } else if ("()".includes(char)) {
      tokens.push({ type: "paren", value: char });
      index += 1;
    } else {
      throw new Error("Unsupported character");
    }
  }
  return tokens;
}

function evaluateExpression(source: string, variables: Record<string, number> = {}) {
  const tokens = tokenize(source.replaceAll("×", "*").replaceAll("÷", "/").replaceAll("−", "-"));
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];

  const factorial = (value: number) => {
    if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error("Factorial range");
    let result = 1;
    for (let n = 2; n <= value; n += 1) result *= n;
    return result;
  };

  const functions: Record<string, (value: number) => number> = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    log: Math.log10,
    ln: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    exp: Math.exp,
    fact: factorial,
  };

  const primary = (): number => {
    const token = take();
    if (!token) throw new Error("Incomplete expression");
    if (token.type === "number") return Number(token.value);
    if (token.type === "paren" && token.value === "(") {
      const value = expression();
      if (take()?.value !== ")") throw new Error("Missing parenthesis");
      return value;
    }
    if (token.type === "name") {
      if (token.value === "pi") return Math.PI;
      if (token.value === "e") return Math.E;
      if (token.value in variables) return variables[token.value];
      const fn = functions[token.value];
      if (!fn || take()?.value !== "(") throw new Error("Unknown function");
      const value = expression();
      if (take()?.value !== ")") throw new Error("Missing parenthesis");
      return fn(value);
    }
    throw new Error("Unexpected token");
  };

  const unary = (): number => {
    if (peek()?.value === "+") {
      take();
      return unary();
    }
    if (peek()?.value === "-") {
      take();
      return -unary();
    }
    return primary();
  };

  const power = (): number => {
    const left = unary();
    if (peek()?.value === "^") {
      take();
      return left ** power();
    }
    return left;
  };

  const term = (): number => {
    let value = power();
    while (["*", "/", "%"].includes(peek()?.value)) {
      const operator = take().value;
      const right = power();
      value = operator === "*" ? value * right : operator === "/" ? value / right : value % right;
    }
    return value;
  };

  const expression = (): number => {
    let value = term();
    while (["+", "-"].includes(peek()?.value)) {
      const operator = take().value;
      const right = term();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  const result = expression();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error("Cannot calculate");
  return result;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "Error";
  const rounded = Number(value.toPrecision(12));
  return String(rounded).length > 16 ? rounded.toExponential(9) : String(rounded);
}

export function ScientificMode() {
  const [expression, setExpression] = useState("0");
  const [answer, setAnswer] = useState("0");

  const insert = (value: string) => setExpression((current) => (current === "0" ? value : current + value));
  const calculate = () => {
    try {
      const result = formatNumber(evaluateExpression(expression));
      setAnswer(result);
      setExpression(result);
    } catch {
      setAnswer("Error");
    }
  };

  const keys = [
    ["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["π", "pi"], ["e", "e"], ["(", "("],
    ["sin⁻¹", "asin("], ["cos⁻¹", "acos("], ["tan⁻¹", "atan("], ["log", "log("], ["ln", "ln("], [")", ")"],
    ["x²", "^2"], ["xʸ", "^"], ["√", "sqrt("], ["|x|", "abs("], ["1/x", "1/("], ["n!", "fact("],
    ["7", "7"], ["8", "8"], ["9", "9"], ["÷", "/"], ["mod", "%"], ["AC", "clear"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["×", "*"], ["exp", "exp("], ["⌫", "back"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["−", "-"], ["+", "+"], ["=", "equals"],
    ["0", "0"], [".", "."],
  ];

  return (
    <Box className="mode-content scientific-mode">
      <Box className="advanced-display">
        <Typography color="text.secondary" className="advanced-expression">{expression}</Typography>
        <Typography className="advanced-result">{answer}</Typography>
      </Box>
      <Box className="scientific-grid">
        {keys.map(([label, value], index) => (
          <Button
            key={`${label}-${index}`}
            className={value === "equals" ? "primary-mode-key" : "mode-key"}
            onClick={() => {
              if (value === "clear") { setExpression("0"); setAnswer("0"); }
              else if (value === "back") setExpression((current) => current.length > 1 ? current.slice(0, -1) : "0");
              else if (value === "equals") calculate();
              else insert(value);
            }}
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

function GraphCanvas({ expression, min, max }: { expression: string; min: number; max: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    const width = rect.width;
    const height = rect.height;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = theme.palette.divider;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2, height);
    context.stroke();

    context.strokeStyle = theme.palette.primary.main;
    context.lineWidth = 2;
    context.beginPath();
    let drawing = false;
    for (let pixel = 0; pixel <= width; pixel += 1) {
      const x = min + (pixel / width) * (max - min);
      try {
        const y = evaluateExpression(expression, { x });
        const screenY = height / 2 - (y / (max - min)) * height;
        if (!Number.isFinite(screenY) || screenY < -height * 2 || screenY > height * 3) {
          drawing = false;
        } else if (!drawing) {
          context.moveTo(pixel, screenY);
          drawing = true;
        } else {
          context.lineTo(pixel, screenY);
        }
      } catch {
        drawing = false;
      }
    }
    context.stroke();
  }, [expression, max, min, theme.palette.divider, theme.palette.primary.main]);

  return <canvas ref={ref} className="graph-canvas" aria-label={`Graph of ${expression}`} />;
}

export function GraphingMode() {
  const [expression, setExpression] = useState("sin(x)");
  const [range, setRange] = useState(10);
  const valid = useMemo(() => {
    try { evaluateExpression(expression, { x: 1 }); return true; } catch { return false; }
  }, [expression]);

  return (
    <Box className="mode-content graphing-mode">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} className="mode-controls">
        <TextField
          fullWidth
          size="small"
          label="f(x)"
          value={expression}
          error={!valid}
          helperText={valid ? "Functions: sin, cos, tan, log, ln, sqrt, abs" : "Check the expression"}
          onChange={(event) => setExpression(event.target.value)}
        />
        <TextField
          size="small"
          type="number"
          label="Range ±"
          value={range}
          slotProps={{ htmlInput: { min: 1, max: 100 } }}
          onChange={(event) => setRange(Math.max(1, Math.min(100, Number(event.target.value) || 10)))}
        />
      </Stack>
      <GraphCanvas expression={valid ? expression : "0"} min={-range} max={range} />
    </Box>
  );
}

type ProgrammerOperator = "AND" | "OR" | "XOR" | "<<" | ">>";
const baseLabels = { 16: "HEX", 10: "DEC", 8: "OCT", 2: "BIN" } as const;

function parseBigInt(value: string, base: 16 | 10 | 8 | 2) {
  if (!value) return BigInt(0);
  if (base === 16) return BigInt(`0x${value}`);
  if (base === 8) return BigInt(`0o${value}`);
  if (base === 2) return BigInt(`0b${value}`);
  return BigInt(value);
}

export function ProgrammerMode() {
  const [base, setBase] = useState<16 | 10 | 8 | 2>(10);
  const [input, setInput] = useState("0");
  const [stored, setStored] = useState<bigint | null>(null);
  const [operator, setOperator] = useState<ProgrammerOperator | null>(null);
  const value = useMemo(() => {
    try { return parseBigInt(input, base); } catch { return BigInt(0); }
  }, [base, input]);
  const unsigned = BigInt.asUintN(64, value);
  const conversions = [16, 10, 8, 2] as const;

  const selectBase = (next: 16 | 10 | 8 | 2) => {
    setInput(unsigned.toString(next).toUpperCase());
    setBase(next);
  };
  const append = (digit: string) => {
    const allowed = "0123456789ABCDEF".indexOf(digit) < base;
    if (!allowed) return;
    setInput((current) => (current === "0" ? digit : current + digit).slice(0, 64));
  };
  const choose = (next: ProgrammerOperator) => { setStored(value); setOperator(next); setInput("0"); };
  const equals = () => {
    if (stored === null || !operator) return;
    const result = operator === "AND" ? stored & value
      : operator === "OR" ? stored | value
      : operator === "XOR" ? stored ^ value
      : operator === "<<" ? stored << value
      : stored >> value;
    setInput(BigInt.asUintN(64, result).toString(base).toUpperCase());
    setStored(null);
    setOperator(null);
  };

  return (
    <Box className="mode-content programmer-mode">
      <Typography className="programmer-value">{input}</Typography>
      <Stack className="base-readout" spacing={0.3}>
        {conversions.map((item) => (
          <Button key={item} onClick={() => selectBase(item)} className={base === item ? "active-base" : ""}>
            <span>{baseLabels[item]}</span><strong>{unsigned.toString(item).toUpperCase()}</strong>
          </Button>
        ))}
      </Stack>
      <Box className="programmer-grid">
        {["AND", "OR", "XOR", "NOT", "<<", ">>", "A", "B", "C", "D", "E", "F", "7", "8", "9", "AC", "4", "5", "6", "⌫", "1", "2", "3", "=", "0"].map((key) => (
          <Button
            key={key}
            className={key === "=" ? "primary-mode-key" : "mode-key"}
            disabled={/^[A-F]$/.test(key) && base !== 16}
            onClick={() => {
              if (["AND", "OR", "XOR", "<<", ">>"].includes(key)) choose(key as ProgrammerOperator);
              else if (key === "NOT") setInput(BigInt.asUintN(64, ~value).toString(base).toUpperCase());
              else if (key === "AC") { setInput("0"); setStored(null); setOperator(null); }
              else if (key === "⌫") setInput((current) => current.length > 1 ? current.slice(0, -1) : "0");
              else if (key === "=") equals();
              else append(key);
            }}
          >{key}</Button>
        ))}
      </Box>
    </Box>
  );
}

function isoToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function DateMode() {
  const [tab, setTab] = useState(0);
  const [from, setFrom] = useState(isoToday());
  const [to, setTo] = useState(isoToday());
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState("days");
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const difference = Math.round(Math.abs(new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
  const adjusted = useMemo(() => {
    const result = new Date(`${from}T12:00:00`);
    const signed = direction === "add" ? amount : -amount;
    if (unit === "days") result.setDate(result.getDate() + signed);
    if (unit === "weeks") result.setDate(result.getDate() + signed * 7);
    if (unit === "months") result.setMonth(result.getMonth() + signed);
    if (unit === "years") result.setFullYear(result.getFullYear() + signed);
    return result.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }, [amount, direction, from, unit]);

  return (
    <Box className="mode-content date-mode">
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
        <Tab label="Difference" /><Tab label="Add or subtract" />
      </Tabs>
      {tab === 0 ? (
        <Stack spacing={2} className="date-fields">
          <TextField label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <Paper className="date-result" elevation={0}>
            <Typography variant="h4">{difference}</Typography>
            <Typography color="text.secondary">days · {Math.floor(difference / 7)} weeks and {difference % 7} days</Typography>
          </Paper>
        </Stack>
      ) : (
        <Stack spacing={2} className="date-fields">
          <TextField label="Starting date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <ToggleButtonGroup exclusive fullWidth value={direction} onChange={(_, value) => value && setDirection(value)} size="small">
            <ToggleButton value="add">Add</ToggleButton><ToggleButton value="subtract">Subtract</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" spacing={1}>
            <TextField label="Amount" type="number" value={amount} onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))} />
            <FormControl fullWidth><InputLabel>Unit</InputLabel><Select label="Unit" value={unit} onChange={(event) => setUnit(event.target.value)}>
              {['days', 'weeks', 'months', 'years'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select></FormControl>
          </Stack>
          <Paper className="date-result" elevation={0}><Typography variant="h6">{adjusted}</Typography></Paper>
        </Stack>
      )}
    </Box>
  );
}

type Unit = { label: string; symbol: string; factor: number };
type ConverterDefinition = { title: string; units: Unit[] };

const converters: Record<Exclude<CalculatorMode, "standard" | "scientific" | "graphing" | "programmer" | "date" | "currency" | "temperature">, ConverterDefinition> = {
  volume: { title: "Volume", units: [
    { label: "Milliliters", symbol: "mL", factor: 0.001 }, { label: "Liters", symbol: "L", factor: 1 },
    { label: "Cubic meters", symbol: "m³", factor: 1000 }, { label: "Teaspoons", symbol: "tsp", factor: 0.00492892159375 },
    { label: "Tablespoons", symbol: "tbsp", factor: 0.01478676478125 }, { label: "Cups", symbol: "cup", factor: 0.2365882365 },
    { label: "Pints", symbol: "pt", factor: 0.473176473 }, { label: "Gallons", symbol: "gal", factor: 3.785411784 },
  ]},
  length: { title: "Length", units: [
    { label: "Millimeters", symbol: "mm", factor: 0.001 }, { label: "Centimeters", symbol: "cm", factor: 0.01 },
    { label: "Meters", symbol: "m", factor: 1 }, { label: "Kilometers", symbol: "km", factor: 1000 },
    { label: "Inches", symbol: "in", factor: 0.0254 }, { label: "Feet", symbol: "ft", factor: 0.3048 },
    { label: "Yards", symbol: "yd", factor: 0.9144 }, { label: "Miles", symbol: "mi", factor: 1609.344 },
  ]},
  mass: { title: "Weight and mass", units: [
    { label: "Milligrams", symbol: "mg", factor: 0.000001 }, { label: "Grams", symbol: "g", factor: 0.001 },
    { label: "Kilograms", symbol: "kg", factor: 1 }, { label: "Ounces", symbol: "oz", factor: 0.028349523125 },
    { label: "Pounds", symbol: "lb", factor: 0.45359237 }, { label: "Stone", symbol: "st", factor: 6.35029318 },
    { label: "Metric tonnes", symbol: "t", factor: 1000 },
  ]},
  energy: { title: "Energy", units: [
    { label: "Joules", symbol: "J", factor: 1 }, { label: "Kilojoules", symbol: "kJ", factor: 1000 },
    { label: "Calories", symbol: "cal", factor: 4.184 }, { label: "Kilocalories", symbol: "kcal", factor: 4184 },
    { label: "Watt-hours", symbol: "Wh", factor: 3600 }, { label: "Kilowatt-hours", symbol: "kWh", factor: 3_600_000 },
    { label: "BTU", symbol: "BTU", factor: 1055.05585262 },
  ]},
  area: { title: "Area", units: [
    { label: "Square millimeters", symbol: "mm²", factor: 0.000001 }, { label: "Square centimeters", symbol: "cm²", factor: 0.0001 },
    { label: "Square meters", symbol: "m²", factor: 1 }, { label: "Square kilometers", symbol: "km²", factor: 1_000_000 },
    { label: "Square inches", symbol: "in²", factor: 0.00064516 }, { label: "Square feet", symbol: "ft²", factor: 0.09290304 },
    { label: "Acres", symbol: "acre", factor: 4046.8564224 }, { label: "Hectares", symbol: "ha", factor: 10_000 },
    { label: "Square miles", symbol: "mi²", factor: 2_589_988.110336 },
  ]},
  speed: { title: "Speed", units: [
    { label: "Meters per second", symbol: "m/s", factor: 1 }, { label: "Kilometers per hour", symbol: "km/h", factor: 0.2777777778 },
    { label: "Miles per hour", symbol: "mph", factor: 0.44704 }, { label: "Feet per second", symbol: "ft/s", factor: 0.3048 },
    { label: "Knots", symbol: "kn", factor: 0.5144444444 },
  ]},
  time: { title: "Time", units: [
    { label: "Milliseconds", symbol: "ms", factor: 0.001 }, { label: "Seconds", symbol: "s", factor: 1 },
    { label: "Minutes", symbol: "min", factor: 60 }, { label: "Hours", symbol: "h", factor: 3600 },
    { label: "Days", symbol: "day", factor: 86400 }, { label: "Weeks", symbol: "week", factor: 604800 },
  ]},
  power: { title: "Power", units: [
    { label: "Watts", symbol: "W", factor: 1 }, { label: "Kilowatts", symbol: "kW", factor: 1000 },
    { label: "Megawatts", symbol: "MW", factor: 1_000_000 }, { label: "Horsepower", symbol: "hp", factor: 745.6998716 },
    { label: "BTU per hour", symbol: "BTU/h", factor: 0.29307107 },
  ]},
  data: { title: "Data", units: [
    { label: "Bits", symbol: "bit", factor: 0.125 }, { label: "Bytes", symbol: "B", factor: 1 },
    { label: "Kilobytes", symbol: "KB", factor: 1000 }, { label: "Megabytes", symbol: "MB", factor: 1_000_000 },
    { label: "Gigabytes", symbol: "GB", factor: 1_000_000_000 }, { label: "Terabytes", symbol: "TB", factor: 1_000_000_000_000 },
  ]},
  pressure: { title: "Pressure", units: [
    { label: "Pascals", symbol: "Pa", factor: 1 }, { label: "Kilopascals", symbol: "kPa", factor: 1000 },
    { label: "Bar", symbol: "bar", factor: 100000 }, { label: "PSI", symbol: "psi", factor: 6894.757293 },
    { label: "Atmospheres", symbol: "atm", factor: 101325 }, { label: "Torr", symbol: "Torr", factor: 133.3223684 },
  ]},
  angle: { title: "Angle", units: [
    { label: "Degrees", symbol: "°", factor: Math.PI / 180 }, { label: "Radians", symbol: "rad", factor: 1 },
    { label: "Gradians", symbol: "grad", factor: Math.PI / 200 }, { label: "Turns", symbol: "turn", factor: Math.PI * 2 },
  ]},
};

type CurrencyOption = { code: string; name: string };
type CurrencyPayload = { date?: string; [base: string]: string | Record<string, number> | undefined };

const fallbackCurrencyCodes = [
  "AED", "ARS", "AUD", "BDT", "BGN", "BHD", "BRL", "CAD", "CHF", "CLP", "CNY", "COP",
  "CZK", "DKK", "DZD", "EGP", "EUR", "GBP", "GEL", "GHS", "HKD", "HRK", "HUF", "IDR",
  "ILS", "INR", "ISK", "JPY", "KES", "KRW", "KWD", "KZT", "LKR", "MAD", "MXN", "MYR",
  "NGN", "NOK", "NZD", "OMR", "PEN", "PHP", "PKR", "PLN", "QAR", "RON", "RSD", "RUB",
  "SAR", "SEK", "SGD", "THB", "TRY", "TWD", "UAH", "USD", "VND", "XAF", "XCD", "XOF", "ZAR",
];

function currencyName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function currencySymbol(code: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
      .formatToParts(0).find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

async function fetchWithFallback<T>(urls: string[]): Promise<T> {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Rate service returned ${response.status}`);
      return await response.json() as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("Rate service unavailable");
}

function CurrencyMode() {
  const [amount, setAmount] = useState("1");
  const [fromCode, setFromCode] = useState("USD");
  const [toCode, setToCode] = useState("RON");
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(() =>
    fallbackCurrencyCodes.map((code) => ({ code, name: currencyName(code) })),
  );
  const [rates, setRates] = useState<Record<string, number>>({});
  const [rateDate, setRateDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const cached = localStorage.getItem("calculator:currency-list");
      // This effect hydrates the bundled offline list from the browser cache.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (cached) setCurrencies(JSON.parse(cached));
    } catch { /* Ignore damaged cache data. */ }

    void fetchWithFallback<Record<string, string>>([
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json",
      "https://latest.currency-api.pages.dev/v1/currencies.min.json",
    ]).then((payload) => {
      const list = Object.entries(payload)
        .filter(([code, name]) => code && typeof name === "string")
        .map(([code, name]) => ({ code: code.toUpperCase(), name: name.replace(/\b\w/g, (letter) => letter.toUpperCase()) }))
        .sort((left, right) => left.name.localeCompare(right.name));
      if (list.length) {
        setCurrencies(list);
        localStorage.setItem("calculator:currency-list", JSON.stringify(list));
      }
    }).catch(() => { /* The bundled fiat list remains available offline. */ });
  }, []);

  const updateRates = useCallback(async () => {
    const base = fromCode.toLowerCase();
    setLoading(true);
    setError("");
    try {
      const cached = localStorage.getItem(`calculator:rates:${base}`);
      if (cached) {
        const saved = JSON.parse(cached) as { date: string; rates: Record<string, number> };
        setRates(saved.rates);
        setRateDate(saved.date);
      }
    } catch { /* Ignore damaged cache data. */ }

    try {
      const payload = await fetchWithFallback<CurrencyPayload>([
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.min.json`,
        `https://latest.currency-api.pages.dev/v1/currencies/${base}.min.json`,
      ]);
      const nextRates = payload[base];
      if (!nextRates || typeof nextRates === "string") throw new Error("No rates returned");
      const normalized = Object.fromEntries(Object.entries(nextRates).map(([code, value]) => [code.toUpperCase(), value]));
      setRates(normalized);
      setRateDate(payload.date ?? new Date().toISOString().slice(0, 10));
      localStorage.setItem(`calculator:rates:${base}`, JSON.stringify({ date: payload.date, rates: normalized }));
    } catch {
      setError("Couldn’t update rates. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [fromCode]);

  // Refresh whenever the selected base currency changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void updateRates(); }, [updateRates]);

  const numericAmount = Number(amount) || 0;
  const rate = rates[toCode] ?? (fromCode === toCode ? 1 : 0);
  const result = numericAmount * rate;
  const selectedFrom = currencies.find((currency) => currency.code === fromCode) ?? { code: fromCode, name: currencyName(fromCode) };
  const selectedTo = currencies.find((currency) => currency.code === toCode) ?? { code: toCode, name: currencyName(toCode) };
  const append = (digit: string) => setAmount((current) => {
    if (digit === "." && current.includes(".")) return current;
    if (current === "0" && digit !== ".") return digit;
    return (current + digit).slice(0, 15);
  });
  const currencyLabel = (option: CurrencyOption) => `${option.name} — ${option.code}`;

  return (
    <Box className="mode-content currency-mode">
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Currency</Typography>

      <Box className="currency-amount-block">
        <Stack direction="row" className="currency-number-line">
          <Typography className="currency-symbol">{currencySymbol(fromCode)}</Typography>
          <TextField
            fullWidth
            variant="standard"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
            slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": "Amount to convert" } }}
          />
        </Stack>
        <Autocomplete
          disableClearable
          options={currencies}
          value={selectedFrom}
          getOptionLabel={currencyLabel}
          isOptionEqualToValue={(option, value) => option.code === value.code}
          onChange={(_, value) => setFromCode(value.code)}
          renderInput={(params) => <TextField {...params} variant="standard" label="From" />}
        />
      </Box>

      <Box className="currency-amount-block currency-output">
        <Stack direction="row" className="currency-number-line">
          <Typography className="currency-symbol">{currencySymbol(toCode)}</Typography>
          <Typography className="currency-result">{rate ? formatNumber(result) : "—"}</Typography>
        </Stack>
        <Autocomplete
          disableClearable
          options={currencies}
          value={selectedTo}
          getOptionLabel={currencyLabel}
          isOptionEqualToValue={(option, value) => option.code === value.code}
          onChange={(_, value) => setToCode(value.code)}
          renderInput={(params) => <TextField {...params} variant="standard" label="To" />}
        />
      </Box>

      <Stack className="rate-status" direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {rate ? `1 ${fromCode} = ${formatNumber(rate)} ${toCode}` : "Rate unavailable"}
          </Typography>
          <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ display: "block" }}>
            {error || (rateDate ? `Updated ${rateDate} · ${currencies.length} currencies` : "Loading latest rates…")}
          </Typography>
        </Box>
        <Button size="small" onClick={() => void updateRates()} disabled={loading}>
          {loading ? <CircularProgress size={16} /> : "Update"}
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} className="currency-actions">
        <Button onClick={() => setAmount("0")}>CE</Button>
        <Button onClick={() => setAmount((current) => current.length > 1 ? current.slice(0, -1) : "0")}>⌫</Button>
        <Button onClick={() => { setFromCode(toCode); setToCode(fromCode); }}>⇄</Button>
      </Stack>
      <Box className="currency-keypad">
        {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "."].map((digit) => (
          <Button key={digit} className={digit === "0" ? "currency-zero" : ""} onClick={() => append(digit)}>{digit}</Button>
        ))}
      </Box>
    </Box>
  );
}

export function ConverterMode({ mode }: { mode: CalculatorMode }) {
  const [input, setInput] = useState("1");
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(1);

  // Converter modes have different unit arrays, so reset their indexes together.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setFromIndex(0); setToIndex(1); setInput("1"); }, [mode]);

  if (mode === "currency") return <CurrencyMode />;

  if (mode === "temperature") {
    const units = ["Celsius", "Fahrenheit", "Kelvin"];
    const value = Number(input) || 0;
    const celsius = fromIndex === 0 ? value : fromIndex === 1 ? (value - 32) * 5 / 9 : value - 273.15;
    const result = toIndex === 0 ? celsius : toIndex === 1 ? celsius * 9 / 5 + 32 : celsius + 273.15;
    return <GenericConverter title="Temperature" input={input} setInput={setInput} units={units.map((label) => ({ label, symbol: label === "Celsius" ? "°C" : label === "Fahrenheit" ? "°F" : "K", factor: 1 }))} fromIndex={fromIndex} setFromIndex={setFromIndex} toIndex={toIndex} setToIndex={setToIndex} result={result} />;
  }

  const definition = converters[mode as keyof typeof converters];
  if (!definition) return null;
  const value = Number(input) || 0;
  const result = value * definition.units[fromIndex].factor / definition.units[toIndex].factor;
  return <GenericConverter title={definition.title} input={input} setInput={setInput} units={definition.units} fromIndex={fromIndex} setFromIndex={setFromIndex} toIndex={toIndex} setToIndex={setToIndex} result={result} />;
}

function GenericConverter({ title, input, setInput, units, fromIndex, setFromIndex, toIndex, setToIndex, result }: {
  title: string; input: string; setInput: (value: string) => void; units: Unit[];
  fromIndex: number; setFromIndex: (value: number) => void; toIndex: number; setToIndex: (value: number) => void; result: number;
}) {
  return (
    <Box className="mode-content converter-mode">
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{title}</Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Paper className="conversion-card" elevation={0}>
          <TextField fullWidth variant="standard" type="number" value={input} onChange={(event) => setInput(event.target.value)} />
          <FormControl fullWidth size="small"><Select value={fromIndex} onChange={(event) => setFromIndex(Number(event.target.value))}>{units.map((unit, index) => <MenuItem key={unit.label} value={index}>{unit.label} ({unit.symbol})</MenuItem>)}</Select></FormControl>
        </Paper>
        <Button className="swap-button" onClick={() => { setFromIndex(toIndex); setToIndex(fromIndex); }}>⇅</Button>
        <Paper className="conversion-card conversion-result" elevation={0}>
          <Typography variant="h4">{formatNumber(result)}</Typography>
          <FormControl fullWidth size="small"><Select value={toIndex} onChange={(event) => setToIndex(Number(event.target.value))}>{units.map((unit, index) => <MenuItem key={unit.label} value={index}>{unit.label} ({unit.symbol})</MenuItem>)}</Select></FormControl>
        </Paper>
      </Stack>
    </Box>
  );
}

export function AdvancedMode({ mode }: { mode: CalculatorMode }) {
  if (mode === "scientific") return <ScientificMode />;
  if (mode === "graphing") return <GraphingMode />;
  if (mode === "programmer") return <ProgrammerMode />;
  if (mode === "date") return <DateMode />;
  return <ConverterMode mode={mode} />;
}
