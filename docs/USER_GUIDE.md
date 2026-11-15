# ORBIT — Supernova / English Edition

Run dist/ORBIT-Decision.exe. The portable package is ORBIT-Ana-Surum.zip. Keep the executable together with its Assets folder and DLL files. A separate .NET installation is not required; Microsoft Edge WebView2 Runtime is required.

## Data modes

Personal records is the default mode. Missing measurements display a dash / NO RECORD and are never filled with demo values. Demo medical rules are not applied to personal measurements. No clinical model is connected; personal disease probability, prognosis, effective dose or safe stay duration is not calculated.

Separate demo scenarios enables illustrative simulations. Demo values and personal records do not overwrite each other. Demo thresholds and draft responses are not clinically validated.

## Manual entry and CSV

Data entry accepts a measurement, value, fixed unit, UTC measurement time, source, measurement conditions and an optional note. The crew member and environment come from the selections above. Records are separated by person, environment and metric; the latest measurement is displayed and older records remain in history. Refresh records does not change measurement timestamps.

Both decimal points and decimal commas are accepted. Empty or invalid values, invalid or future timestamps, unknown metric codes and incorrect units are rejected. Broad numeric validation bounds only prevent entry errors; they are not healthy reference intervals. No numerical unit conversion is performed. A user-supplied device name does not establish a connection, calibration or medical verification.

Existing Turkish unit labels are accepted and displayed using the equivalent English labels: atım/dk → bpm, nefes/dk → breaths/min, µSv/saat → µSv/h, µGy/saat → µGy/h and mg/24 saat → mg/24 h. Values, user-entered source descriptions, notes and personal names are preserved. Historical report content remains as originally recorded.

Records are encrypted using Windows DPAPI CurrentUser in %LOCALAPPDATA%/ORBIT-Decision/manual-records.bin. They may not be decryptable under another Windows account or computer. This is not a complete clinical security system: clinical deployment requires authentication, role permissions, audit records, retention policies and institutional approval. Records are not automatically deleted; new entries are rejected above 1,000 records.

CSV files must be UTF-8, no larger than 1 MB and contain 1–1,000 data rows. Required headers: metric,value,unit,measuredAt,source. Optional headers: note,context,referenceLow,referenceHigh,referenceSource. Metric codes: hr, resp, sleep, rate, area, daily, monthly, career, fatigue, force, strength, oct, blur, lymph, calcium. Units appear in the form. Use explicit UTC timestamps such as 2026-11-15T08:30:00Z. Comma and semicolon separators and quoted fields are supported. Crew / environment columns are not accepted; the preview shows the selected destination. One invalid row rejects the entire batch. Import occurs only after reviewing the preview and clicking Import. Duplicate records are not added again.

Personal charts show recorded sample points at their actual timestamps. No synthetic measurements or intermediate laboratory curves fill missing periods.

## NASA data

NASA data has its own page and is never automatically written into personal health records. Personal measurements, crew names and reports are not sent to NASA.

DONKI retrieves FLR (solar flare), CME (coronal mass ejection) and SEP (solar energetic particle) events from NASA CCMC for the past seven days. Refresh on startup and every 15 minutes is enabled by default and can be disabled. Event time, publication time where available, instruments and last successful fetch are shown. Failed sources retain their previous successful records with their original dates. An empty successful response is distinguished from a connection failure. DONKI supports research / prototyping and does not independently support clinical or mission decisions. An event does not establish exposure of the selected astronaut.

RadLab queries the historical ISS / DosTel archive over a selected past UTC interval of up to six hours. The initial example is April 1, 2022, 00:00–01:00 UTC. Measurements include the instrument, timestamp and absorbed dose rate in µGy/h. These archive records do not represent the selected astronaut's personal dose or a current Moon/Mars/EVA dose. They are not converted into mSv or career effective dose. Empty and failed queries are explicit; an earlier successful query retains its own date range.

The application uses fixed official public NASA endpoints without a user API key. There is no general URL proxy. Date ranges and response sizes are limited. No credentials or personal health data are included in requests.

## Reference warnings and speech

Cards use amber for below-reference results and pink/red for above-reference results, with written direction labels. Being within range does not establish health or fitness for flight. Written explanations appear on Decision support and are captured in medical reports. This module compares reference intervals; it does not diagnose, classify emergencies or prescribe treatment.

General Earth-based adult references: resting heart rate 60–100 bpm; resting respiration 12–18 breaths/min; absolute lymphocytes 1.0–4.8 ×10⁹/L; normal-diet complete 24-hour urinary calcium 100–250 mg/24 h. Individual and laboratory intervals may differ. These are not spaceflight-validated personal thresholds or emergency treatment thresholds.

Resting references are not applied during known activity or sleep. The general urinary calcium interval is not applied when the diet context is incompatible. Unknown conditions are disclosed. Outdated measurements are labeled and do not trigger current voice alerts. No general normal intervals are invented for OCT, sleep quality, fatigue, strength or radiation.

Optional laboratory / physician reference limits require both lower and upper bounds, lower < upper, and a source description. The unit must match the measurement. A record-specific interval overrides the general interval but is not assumed medically verified. Context values: unknown, rest, activity, sleep, normal-diet, other-diet. Older records without context load as unknown.

Voice alert preference is saved. New current out-of-range records are read once; refreshing the same screen does not repeat them. Read warnings and Stop speech are available. English Windows SAPI speech is processed locally; health data is not sent to an external speech service. If no English voice is available, a warning tone is attempted and the status is shown. Written warnings remain available. Software cannot verify that speakers are audible or system volume is unmuted. Automated tests mute speech.

## Reports and future risks

Reports capture the data mode, measurement snapshot, sources, timestamps and reference warnings. Both recipients and delivery remain local simulations. Personal health reports remain in session memory and are not stored in plaintext localStorage. They can be exported using the Windows JSON save dialog. Exported JSON is unencrypted and must be protected by the user. Demo reports may remain in the local cache.

Future risks shows available personal records without generating disease probability, prognosis or radiation projections. Hypothetical numerical exposure comparisons are available only in demo mode. OCT does not directly measure intracranial or intraocular pressure; lymphocytes and urinary calcium alone cannot establish a diagnosis. Fluid and exercise interventions require an individual medical plan. CAD personal dose is not directly added to career effective dose. The displayed NASA career effective dose limit is 600 mSv.

## Appearance and validation

The main Supernova theme retains its fixed 60% background brightness, transparent collapsible sidebar, interactive 2D body map and separate pages. Interface labels, generated messages, new reports and voice alerts are English; personal content is preserved. Numeric display uses English decimal formatting.

242 automated checks passed, covering measurements, navigation, theme behavior, manual validation, CSV, encrypted storage, reference alerts, local speech calls, NASA parsers, cache preservation, English labels and legacy unit compatibility. Visual inspection and live NASA connectivity are separate from these functional checks.

Run ORBIT-Decision.exe --smoke-test for automated checks using the isolated ORBIT-Decision-Test profile. Results are written to smoke-test.txt and smoke-test-details.json. Run ORBIT-Decision.exe --nasa-test for live connectivity checks; results are written to nasa-connection-test.json. Live service availability depends on network access.

## Sources

- DONKI service and data limitations: https://ccmc.gsfc.nasa.gov/tools/DONKI/
- DONKI API: https://ccmc.gsfc.nasa.gov/DONKI/api/
- RadLab API: https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- RadLab absorbed dose rate: https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/absorbed_dose_rate
- NASA human data sharing: https://www.nasa.gov/directorates/esdmd/hhp/human-health-and-performance-data-sharing/
- NASA risk framework: https://www.nasa.gov/hrp/risks/
- Adult vital signs: https://medlineplus.gov/ency/article/002341.htm
- Lymphocytes: https://my.clevelandclinic.org/health/body/23342-lymphocytes
- Urinary calcium: https://medlineplus.gov/ency/article/003603.htm

## Build

    dotnet publish OrbitDecision.csproj -c Release -r win-x64 --self-contained true -o dist
