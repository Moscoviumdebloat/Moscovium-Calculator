"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackspaceRounded,
  CalculateRounded,
  DeleteSweepRounded,
  HistoryRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CssBaseline,
  IconButton,
  Paper,
  Stack,
  ThemeProvider,
  Tooltip,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";

type Operator = "+" | "−" | "×" | "÷";
type HistoryItem = { expression: string; result: string };

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
  }, [backspace, chooseOperator, clear, equals, inputDecimal, inputDigit, percent]);

  const buttonSx = {
    minWidth: 0,
    height: { xs: 62, sm: 68 },
    borderRadius: "18px",
    fontSize: "1.15rem",
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="main" className="app-shell">
        <Stack className="app-header" direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.4} alignItems="center">
            <Box className="element-mark" aria-hidden="true">
              <span>115</span>
              <strong>Mc</strong>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={750} lineHeight={1.1}>
                Moscovium
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Material calculator
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            label={`System · ${prefersDark ? "Dark" : "Light"}`}
            sx={{ bgcolor: "action.hover", fontWeight: 650 }}
          />
        </Stack>

        <Box className="workspace">
          <Paper className="calculator" elevation={0}>
            <Box className="display" aria-live="polite" aria-atomic="true">
              <Typography className="formula" color="text.secondary">
                {formula || "Ready"}
              </Typography>
              <Typography className="result" title={display}>
                {display}
              </Typography>
            </Box>

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
            </Box>

            <Stack className="shortcut-row" direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Keyboard ready
              </Typography>
              <Tooltip title="Delete last digit">
                <span>
                  <IconButton size="small" onClick={backspace} disabled={waiting} aria-label="Delete last digit">
                    <BackspaceRounded fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Paper>

          <Paper className="history-panel" elevation={0} component="aside">
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryRounded color="primary" />
                <Typography variant="subtitle1" fontWeight={750}>History</Typography>
              </Stack>
              <Tooltip title="Clear history">
                <span>
                  <IconButton size="small" onClick={() => setHistory([])} disabled={!history.length} aria-label="Clear history">
                    <DeleteSweepRounded fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {history.length ? (
              <Stack spacing={1.2} mt={2}>
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
              <Stack className="empty-history" alignItems="center" justifyContent="center" spacing={1.2}>
                <CalculateRounded />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Your calculations will appear here.
                </Typography>
              </Stack>
            )}
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
