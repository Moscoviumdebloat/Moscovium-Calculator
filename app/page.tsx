"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackspaceRounded,
  BoltRounded,
  CalendarMonthRounded,
  CalculateRounded,
  CodeRounded,
  CompressRounded,
  CurrencyExchangeRounded,
  DataUsageRounded,
  DeleteSweepRounded,
  DeviceThermostatRounded,
  GridOnRounded,
  HistoryRounded,
  MenuRounded,
  ScaleRounded,
  ScheduleRounded,
  ScienceRounded,
  ShowChartRounded,
  SpeedRounded,
  StraightenRounded,
  SwapHorizRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  ThemeProvider,
  Tooltip,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import { AdvancedMode, type CalculatorMode } from "./advanced-modes";

type Operator = "+" | "−" | "×" | "÷";
type HistoryItem = { expression: string; result: string };

declare global {
  interface Window {
    desktopApi?: {
      setWindowLayout: (layout: { mode: CalculatorMode; historyOpen: boolean }) => void;
    };
  }
}

const operators: Record<Operator, (a: number, b: number) => number> = {
  "+": (a, b) => a + b,
  "−": (a, b) => a - b,
  "×": (a, b) => a * b,
  "÷": (a, b) => a / b,
};

function formatResult(value: number) {
  if (!Number.isFinite(value)) return "Error";
  const rounded = Number(value.toPrecision(12));
  const text = String(rounded);
  return text.length > 15 ? rounded.toExponential(8) : text;
}

const modeGroups: Array<{ label?: string; items: Array<{ id: CalculatorMode; label: string; icon: React.ReactNode }> }> = [
  { items: [
    { id: "standard", label: "Standard", icon: <CalculateRounded /> },
    { id: "scientific", label: "Scientific", icon: <ScienceRounded /> },
    { id: "graphing", label: "Graphing", icon: <ShowChartRounded /> },
    { id: "programmer", label: "Programmer", icon: <CodeRounded /> },
    { id: "date", label: "Date calculation", icon: <CalendarMonthRounded /> },
  ] },
  { label: "Converter", items: [
    { id: "currency", label: "Currency", icon: <CurrencyExchangeRounded /> },
    { id: "volume", label: "Volume", icon: <GridOnRounded /> },
    { id: "length", label: "Length", icon: <StraightenRounded /> },
    { id: "mass", label: "Weight and mass", icon: <ScaleRounded /> },
    { id: "temperature", label: "Temperature", icon: <DeviceThermostatRounded /> },
    { id: "energy", label: "Energy", icon: <BoltRounded /> },
    { id: "area", label: "Area", icon: <GridOnRounded /> },
    { id: "speed", label: "Speed", icon: <SpeedRounded /> },
    { id: "time", label: "Time", icon: <ScheduleRounded /> },
    { id: "power", label: "Power", icon: <BoltRounded /> },
    { id: "data", label: "Data", icon: <DataUsageRounded /> },
    { id: "pressure", label: "Pressure", icon: <CompressRounded /> },
    { id: "angle", label: "Angle", icon: <SwapHorizRounded /> },
  ] },
];

export default function Home() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: true,
        palette: {
          mode: prefersDark ? "dark" : "light",
          primary: { main: prefersDark ? "#c5b4ff" : "#6750a4" },
          secondary: { main: prefersDark ? "#ffb77c" : "#8a4f00" },
          background: {
            default: prefersDark ? "#131217" : "#f6f3fa",
            paper: prefersDark ? "#1e1d23" : "#fffbff",
          },
        },
        shape: { borderRadius: 20 },
        typography: {
          fontFamily:
            'Inter, Roboto, "Segoe UI", system-ui, -apple-system, sans-serif',
          button: { textTransform: "none", fontWeight: 650 },
        },
        components: {
          MuiButton: { defaultProps: { disableElevation: true } },
        },
      }),
    [prefersDark],
  );

  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pending, setPending] = useState<Operator | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [formula, setFormula] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<CalculatorMode>("standard");
  const [memory, setMemory] = useState<number | null>(null);

  const clear = useCallback(() => {
    setDisplay("0");
    setAccumulator(null);
    setPending(null);
    setWaiting(false);
    setFormula("");
  }, []);

  const inputDigit = useCallback(
    (digit: string) => {
      if (display === "Error" || waiting) {
        setDisplay(digit);
        setWaiting(false);
        if (!pending) setFormula("");
        return;
      }
      if (display.replace("-", "").replace(".", "").length >= 12) return;
      setDisplay((value) => (value === "0" ? digit : value + digit));
    },
    [display, pending, waiting],
  );

  const inputDecimal = useCallback(() => {
    if (display === "Error" || waiting) {
      setDisplay("0.");
      setWaiting(false);
      if (!pending) setFormula("");
    } else if (!display.includes(".")) {
      setDisplay((value) => value + ".");
    }
  }, [display, pending, waiting]);

  const chooseOperator = useCallback(
    (nextOperator: Operator) => {
      const input = Number(display);
      if (!Number.isFinite(input)) {
        clear();
        return;
      }

      let nextAccumulator = input;
      if (accumulator !== null && pending && !waiting) {
        nextAccumulator = operators[pending](accumulator, input);
        const formatted = formatResult(nextAccumulator);
        setDisplay(formatted);
        if (formatted === "Error") {
          setAccumulator(null);
          setPending(null);
          setFormula("");
          return;
        }
      } else if (accumulator !== null) {
        nextAccumulator = accumulator;
      }

      setAccumulator(nextAccumulator);
      setPending(nextOperator);
      setFormula(`${formatResult(nextAccumulator)} ${nextOperator}`);
      setWaiting(true);
    },
    [accumulator, clear, display, pending, waiting],
  );

  const equals = useCallback(() => {
    if (accumulator === null || !pending || waiting) return;
    const input = Number(display);
    const result = operators[pending](accumulator, input);
    const formatted = formatResult(result);
    const expression = `${formatResult(accumulator)} ${pending} ${display}`;
    setDisplay(formatted);
    setHistory((items) => [{ expression, result: formatted }, ...items].slice(0, 5));
    setAccumulator(null);
    setPending(null);
    setFormula(`${expression} =`);
    setWaiting(true);
  }, [accumulator, display, pending, waiting]);

  const backspace = useCallback(() => {
    if (waiting || display === "Error") return;
    setDisplay((value) => {
      const next = value.slice(0, -1);
      return next === "" || next === "-" ? "0" : next;
    });
  }, [display, waiting]);

  const toggleSign = useCallback(() => {
    if (display === "0" || display === "Error") return;
    setDisplay((value) => (value.startsWith("-") ? value.slice(1) : `-${value}`));
  }, [display]);

  const percent = useCallback(() => {
    if (display === "Error") return;
    setDisplay(formatResult(Number(display) / 100));
  }, [display]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (mode !== "standard") return;
      if (/^[0-9]$/.test(event.key)) inputDigit(event.key);
      else if (event.key === "." || event.key === ",") inputDecimal();
      else if (event.key === "+") chooseOperator("+");
      else if (event.key === "-") chooseOperator("−");
      else if (event.key === "*") chooseOperator("×");
      else if (event.key === "/") chooseOperator("÷");
      else if (event.key === "%") percent();
      else if (event.key === "Enter" || event.key === "=") equals();
      else if (event.key === "Backspace") backspace();
      else if (event.key === "Escape" || event.key === "Delete") clear();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backspace, chooseOperator, clear, equals, inputDecimal, inputDigit, mode, percent]);

  const buttonSx = {
    minWidth: 0,
    height: 50,
    borderRadius: "13px",
    fontSize: "1rem",
  };

  const toggleHistory = () => {
    setHistoryOpen((open) => {
      const next = !open;
      window.desktopApi?.setWindowLayout({ mode, historyOpen: next });
      return next;
    });
  };

  const selectMode = (nextMode: CalculatorMode) => {
    setMode(nextMode);
    setMenuOpen(false);
    setHistoryOpen(false);
    window.desktopApi?.setWindowLayout({ mode: nextMode, historyOpen: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="main" className="app-shell">
        <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} className="mode-drawer">
          <Box className="drawer-content" role="navigation" aria-label="Calculator modes">
            <Typography variant="subtitle2" className="drawer-title">Calculator</Typography>
            {modeGroups.map((group, groupIndex) => (
              <Box key={group.label ?? "calculators"}>
                {groupIndex > 0 && <Divider />}
                {group.label && <Typography variant="caption" className="drawer-section">{group.label}</Typography>}
                <List dense disablePadding>
                  {group.items.map((item) => (
                    <ListItemButton key={item.id} selected={mode === item.id} onClick={() => selectMode(item.id)}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        </Drawer>

        <Box className={`workspace mode-${mode}${historyOpen ? " history-open" : ""}`}>
          <Paper className="calculator" elevation={0}>
            <Stack className="calculator-toolbar" direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Tooltip title="Calculator modes">
                <IconButton size="small" onClick={() => setMenuOpen(true)} aria-label="Open calculator modes">
                  <MenuRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title={historyOpen ? "Hide history" : "Show history"}>
                  <IconButton
                    size="small"
                    color={historyOpen ? "primary" : "default"}
                    onClick={toggleHistory}
                    aria-label={historyOpen ? "Hide history" : "Show history"}
                    aria-pressed={historyOpen}
                  >
                    <HistoryRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete last digit">
                  <span>
                    <IconButton size="small" onClick={backspace} disabled={mode !== "standard" || waiting} aria-label="Delete last digit">
                      <BackspaceRounded fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>

            {mode === "standard" ? <><Box className="display" aria-live="polite" aria-atomic="true">
              <Typography className="formula" color="text.secondary">
                {formula || "\u00a0"}
              </Typography>
              <Typography className="result" title={display}>
                {display}
              </Typography>
            </Box>

            <Stack className="memory-row" direction="row">
              <Button disabled={memory === null} onClick={() => setMemory(null)}>MC</Button>
              <Button disabled={memory === null} onClick={() => memory !== null && setDisplay(formatResult(memory))}>MR</Button>
              <Button onClick={() => setMemory((value) => (value ?? 0) + (Number(display) || 0))}>M+</Button>
              <Button onClick={() => setMemory((value) => (value ?? 0) - (Number(display) || 0))}>M−</Button>
              <Button onClick={() => setMemory(Number(display) || 0)}>MS</Button>
            </Stack>

            <Box className="keypad">
              <Button onClick={clear} sx={buttonSx} className="utility-key">
                AC
              </Button>
              <Button onClick={toggleSign} sx={buttonSx} className="utility-key">
                +/−
              </Button>
              <Button onClick={percent} sx={buttonSx} className="utility-key">
                %
              </Button>
              <Button onClick={() => chooseOperator("÷")} sx={buttonSx} className="operator-key" aria-label="Divide">
                ÷
              </Button>

              {["7", "8", "9"].map((digit) => (
                <Button key={digit} onClick={() => inputDigit(digit)} sx={buttonSx} className="number-key">
                  {digit}
                </Button>
              ))}
              <Button onClick={() => chooseOperator("×")} sx={buttonSx} className="operator-key" aria-label="Multiply">×</Button>

              {["4", "5", "6"].map((digit) => (
                <Button key={digit} onClick={() => inputDigit(digit)} sx={buttonSx} className="number-key">
                  {digit}
                </Button>
              ))}
              <Button onClick={() => chooseOperator("−")} sx={buttonSx} className="operator-key" aria-label="Subtract">−</Button>

              {["1", "2", "3"].map((digit) => (
                <Button key={digit} onClick={() => inputDigit(digit)} sx={buttonSx} className="number-key">
                  {digit}
                </Button>
              ))}
              <Button onClick={() => chooseOperator("+")} sx={buttonSx} className="operator-key" aria-label="Add">+</Button>

              <Button onClick={() => inputDigit("0")} sx={buttonSx} className="number-key zero-key">0</Button>
              <Button onClick={inputDecimal} sx={buttonSx} className="number-key">.</Button>
              <Button onClick={equals} variant="contained" color="primary" sx={buttonSx} className="equals-key" aria-label="Equals">=</Button>
            </Box></> : <AdvancedMode mode={mode} />}
          </Paper>

          {historyOpen && <Paper className="history-panel" elevation={0} component="aside">
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>History</Typography>
              <Tooltip title="Clear history">
                <span>
                  <IconButton size="small" onClick={() => setHistory([])} disabled={!history.length} aria-label="Clear history">
                    <DeleteSweepRounded fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {history.length ? (
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                {history.map((item, index) => (
                  <Button
                    key={`${item.expression}-${index}`}
                    className="history-item"
                    onClick={() => {
                      setDisplay(item.result);
                      setWaiting(true);
                      setFormula(item.expression + " =");
                    }}
                  >
                    <span>{item.expression}</span>
                    <strong>{item.result}</strong>
                  </Button>
                ))}
              </Stack>
            ) : (
              <Stack className="empty-history" spacing={1.2} sx={{ alignItems: "center", justifyContent: "center" }}>
                <CalculateRounded />
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                  Your calculations will appear here.
                </Typography>
              </Stack>
            )}
          </Paper>}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
