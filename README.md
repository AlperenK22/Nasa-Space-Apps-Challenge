# 🚀 ORBIT — Astronaut Health Monitoring & Decision Support

![Status](https://img.shields.io/badge/Status-Research%20Prototype-blue)
![Platform](https://img.shields.io/badge/Platform-Windows%20x64-0078D4)
![Interface](https://img.shields.io/badge/Interface-English-success)

**ORBIT** is a Windows desktop research prototype that combines astronaut health records, public NASA environmental data, and simulated mission scenarios in one dashboard. It explores how clear warnings and structured reports could support crews facing communication delays and limited onboard medical resources.

> Research prototype, not a certified medical device. Sensor connections, mission response rules and report delivery are simulated. ORBIT does not provide validated diagnoses, autonomous triage or treatment protocols.

## Problem and approach

Long-duration missions expose crews to radiation, altered gravity and fatigue. Communication delays complicate timely consultation with Earth. ORBIT organizes health information with visible sources and timestamps, highlights supported reference deviations, and demonstrates combined-signal review and delayed reporting.

Personal measurements, public NASA data and synthetic demo data remain separate. Missing personal measurements are never filled with demo values.

## Five health modules

| Module | Measurements |
|---|---|
| Vital signs | Heart rate, respiration and a derived demo sleep-quality score |
| Radiation | Personal/environment dose rates, daily and 30-day dose records, career effective-dose model record |
| Muscle & bone | sEMG fatigue model, ARED peak load and strength change from baseline |
| Eyes & SANS | OCT baseline change and self-reported blurred vision |
| Laboratory | Absolute lymphocytes and 24-hour urinary calcium |

Astroskin, HERA, CAD, sEMG, ARED and OCT are represented as potential sources; live hardware integration is not implemented. OCT does not directly measure intracranial or intraocular pressure, and ARED load cells do not directly measure bone density.

## Features

- Interactive 2D body map, separate pages and a collapsible sidebar.
- ISS, Moon, Mars and EVA demonstration profiles with illustrative thresholds and communication delays.
- Manual measurements and validated CSV import, separated by crew member and environment.
- Color, text and local English voice warnings for supported adult or user-supplied reference intervals.
- Explicit missing-data, stale-data and measurement-context labels.
- NASA DONKI space-weather events and historical ISS/DosTel radiation records.
- Demo cross-alerts, hypothetical exposure comparisons and dual-destination report queues.
- JSON report export and Windows-user-bound encryption of personal measurement records.

## NASA data

**DONKI:** retrieves FLR, CME and SEP events from the past seven days, retaining event times and last successful fetch times. Failed refreshes preserve dated cached records rather than inventing replacements.

**RadLab:** retrieves historical ISS/DosTel absorbed dose rates over a selected UTC interval of up to six hours. These are archive measurements in µGy/h, not the selected astronaut's current personal dose. They are not converted into career effective dose.

Personal measurements, crew names and medical reports are not sent to NASA.

## Technology

| Layer | Implementation |
|---|---|
| Desktop | C# / .NET 10 / Windows Forms |
| Embedded UI | Microsoft Edge WebView2 |
| Interface | HTML5, CSS3, vanilla JavaScript |
| Charts | HTML Canvas |
| Demo logic | JavaScript rules; no trained ML model |
| NASA requests | .NET HttpClient |
| Record protection | Windows DPAPI CurrentUser |
| Voice alerts | Local Windows SAPI English speech |

## Build and run

Requirements: Windows x64, .NET 10 SDK for building, and Microsoft Edge WebView2 Runtime for running. The initial build requires network access to restore the WebView2 NuGet dependency.

```bash
git clone https://github.com/AlperenK22/Nasa-Space-Apps-Challenge.git
cd Nasa-Space-Apps-Challenge
dotnet publish OrbitDecision.csproj -c Release -r win-x64 --self-contained true -o dist
```

Run `dist/ORBIT-Decision.exe`. Keep it together with the published DLL files and Assets folder. The self-contained build does not need a separate .NET installation.

PowerShell shortcut:

```powershell
.\build.ps1
```

## Try the prototype

1. Open **Health map** and inspect the five modules. Personal records is the default mode; missing values stay empty.
2. Choose **Separate demo scenarios**, then select the radiation or OCT scenario.
3. Open **Decision support** to review illustrative findings and reference warnings.
4. Open **Medical reports** to inspect the locally simulated recipients and export JSON.
5. Open **NASA data** to fetch public events or a historical archive interval.

See [the user guide](docs/USER_GUIDE.md) for CSV fields, storage behavior, reference conditions and source links.

## Validation

The English edition passed **242 automated functional checks**, including navigation, measurement rendering, input/CSV validation, encrypted storage, reference warnings, speech requests, NASA parsing, cache preservation and legacy unit-label compatibility.

```powershell
.\dist\ORBIT-Decision.exe --smoke-test
.\dist\ORBIT-Decision.exe --nasa-test
```

The smoke test uses an isolated test profile and mutes speech. The NASA test needs network access. Automated checks do not establish clinical validity.

## Privacy and limitations

Personal measurements are encrypted at `%LOCALAPPDATA%\ORBIT-Decision\manual-records.bin` using Windows DPAPI CurrentUser. Personal reports remain in session memory unless exported; exported JSON is unencrypted. Clinical deployment would require additional authentication, auditing, access controls and institutional approval.

- No live sensor integration, cognitive testing suite or LBNP simulation.
- No trained Edge-AI triage engine or validated autonomous treatment system.
- No individual disease probability, progression timing or safe-stay prediction.
- Demo response rules are not applied to personal records.
- No actual station-to-Earth medical report transmission.
- General adult references are not validated personal spaceflight thresholds. Being within range does not establish health or fitness for flight.

## AI assistance and generated content

ChatGPT/Codex assisted with brainstorming, research support, code generation, debugging, test preparation, interface design, English translation and project documentation. AI assistance during development does not mean the application runs a trained clinical AI model.

The supernova background (`Assets/supernova.png`) was generated with OpenAI image generation. It is an illustrative visual, not a NASA telescope observation or scientific dataset. The application displays a visible **AI-generated background** label above this image on every page. The image file includes an embedded AI-generated watermark. An additional label supplied by `Assets/supernova.js` and `Assets/supernova.css` remains readable when the application crops or shades its background. Any separately shared image or screenshot must retain a visible AI disclosure.

Demo health values are synthetic fixtures generated by application code. NASA DONKI/RadLab records are retrieved public data, not AI-generated measurements. Personal records remain user-entered. Voice warnings use local Windows SAPI text-to-speech.

Machine-readable provenance is provided in [docs/AI_USAGE.json](docs/AI_USAGE.json). This declaration does not establish the origin or usage rights of other supplied visual assets or presentation materials; those require their own source and usage checks.

## Sources

- [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/)
- [DONKI API](https://ccmc.gsfc.nasa.gov/DONKI/api/)
- [NASA RadLab API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/)
- [RadLab absorbed dose rate](https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/absorbed_dose_rate)
- [NASA Human Research Program risks](https://www.nasa.gov/hrp/risks/)
- [MedlinePlus: adult vital signs](https://medlineplus.gov/ency/article/002341.htm)
- [Cleveland Clinic: lymphocytes](https://my.clevelandclinic.org/health/body/23342-lymphocytes)
- [MedlinePlus: urinary calcium](https://medlineplus.gov/ency/article/003603.htm)

Use of public NASA data does not imply NASA endorsement or certification.
