# News Bot — Macro Themes

Theme → expected sector reaction → ETF mapping. The macro-scan routine reads this to translate a headline into an ETF trade.

## Theme catalog

### US monetary policy

| Trigger                                          | Direction | ETFs (long / short)                        |
|--------------------------------------------------|-----------|--------------------------------------------|
| Fed cuts more than expected / dovish surprise    | Risk-on   | Long: `QQQ`, `XLK`, `XLY`, `IWM`, `TLT`     |
| Fed hikes more than expected / hawkish surprise  | Risk-off  | Long: `XLP`, `XLU`, `USD`. Short: `IWM`, `TLT` |
| CPI hotter than expected                         | Hawkish   | Long: `XLE`, `USD`. Trim: `TLT`, `XLY`     |
| CPI cooler than expected                         | Dovish    | Long: `TLT`, `XLK`, `IWM`                  |

### China growth

| Trigger                                          | Direction | ETFs                                       |
|--------------------------------------------------|-----------|--------------------------------------------|
| Major stimulus announcement                      | Long      | `FXI`, `EEM`, `IYM` (materials)            |
| Tariff escalation / export controls              | Short     | Short `FXI`, `TSM`. Long `XLK` (US semis hedge) |

### Energy

| Trigger                                          | Direction | ETFs                                       |
|--------------------------------------------------|-----------|--------------------------------------------|
| OPEC+ supply cut > 1M bpd                        | Long oil  | `XLE`, `USO`                               |
| OPEC+ supply increase                            | Short oil | Short `XLE`                                |
| Major Middle East escalation                     | Long oil + safe haven | `XLE`, `USO`, `GLD`            |

### AI / semis

| Trigger                                          | Direction | ETFs                                       |
|--------------------------------------------------|-----------|--------------------------------------------|
| Big-tech earnings beat with raised AI capex      | Long      | `XLK`, `SMH` (semis)                       |
| New US export controls on AI chips               | Short     | Short `SMH`. Long `XLI` (defence-adjacent) |

### Defence

| Trigger                                          | Direction | ETFs                                       |
|--------------------------------------------------|-----------|--------------------------------------------|
| NATO budget increase / new conflict escalation   | Long      | `XLI`, `ITA` (aero-defence)                |
| Major peace announcement / ceasefire             | Short     | Short `ITA`                                |

## How to add a theme

1. Append a new section with the trigger criteria, direction, and ETF mapping.
2. Commit with `news: macro-themes += <theme>`.
3. The next macro-scan will recognize it.

## Don't

- Don't trade leveraged ETFs (TQQQ, SOXL, etc). Hard rule from `strategy.md`.
- Don't trade a theme twice in a day, even if the headline repeats from a different outlet (the `news-filter` dedupe should catch it; this is the second line of defence).
