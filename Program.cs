using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace OrbitDesktop;

internal static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        if (args.Contains("--nasa-test"))
        {
            try
            {
                using var range = System.Text.Json.JsonDocument.Parse("{\"start\":\"2022-04-01T00:00\",\"end\":\"2022-04-01T01:00\"}");
                var result = new { donki = NasaData.Donki().GetAwaiter().GetResult(), radlab = NasaData.Radlab(range.RootElement).GetAwaiter().GetResult() };
                File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "nasa-connection-test.json"), System.Text.Json.JsonSerializer.Serialize(result));
            }
            catch (Exception ex) { File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "nasa-connection-test.json"), ex.ToString()); Environment.ExitCode = 1; }
            return;
        }
        ApplicationConfiguration.Initialize();
        Application.Run(new OrbitWindow(args.Contains("--smoke-test")));
    }
}

sealed class OrbitWindow : Form
{
    readonly WebView2 web = new() { Dock = DockStyle.Fill };
    readonly bool smokeTest;
    public OrbitWindow(bool smokeTest)
    {
        this.smokeTest = smokeTest;
        Text = "ORBIT — Decision Support";
        ClientSize = new Size(1280, 900);
        MinimumSize = new Size(420, 600);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(10, 16, 27);
        Controls.Add(web);
        Shown += Initialize;
    }

    async void Initialize(object? sender, EventArgs e)
    {
        try
        {
            var data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), smokeTest ? "ORBIT-Decision-Test" : "ORBIT-Decision", "WebView2");
            var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: data);
            await web.EnsureCoreWebView2Async(environment);
            var core = web.CoreWebView2;
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.AreBrowserAcceleratorKeysEnabled = false;
            core.NewWindowRequested += (_, ev) => ev.Handled = true;
            core.PermissionRequested += (_, ev) => ev.State = CoreWebView2PermissionState.Deny;
            core.WebMessageReceived += async (_, ev) =>
            {
                if (!ev.Source.StartsWith("https://orbit.example/", StringComparison.OrdinalIgnoreCase)) return;
                try
                {
                    using var message = System.Text.Json.JsonDocument.Parse(ev.WebMessageAsJson);
                    var root = message.RootElement;
                    var type = root.GetProperty("type").GetString();
                    if (type is "nasa-donki" or "nasa-radlab" or "manual-load" or "manual-save" or "voice-status" or "speak-alert" or "stop-alert")
                    {
                        var id = root.GetProperty("id").GetString();
                        try
                        {
                            object? result;
                            if (type == "voice-status") result = LocalSpeech.Status();
                            else if (type == "speak-alert") result = LocalSpeech.Speak(root.GetProperty("text").GetString() ?? "", smokeTest, root.TryGetProperty("englishText", out var english) ? english.GetString() : null);
                            else if (type == "stop-alert") { LocalSpeech.Stop(); result = new { stopped = true }; }
                            else if (type == "nasa-donki") result = await NasaData.Donki();
                            else if (type == "nasa-radlab") result = await NasaData.Radlab(root);
                            else
                            {
                                var path = Path.Combine(Path.GetDirectoryName(data)!, "manual-records.bin");
                                if (type == "manual-save")
                                {
                                    var records = root.GetProperty("records");
                                    if (records.ValueKind != System.Text.Json.JsonValueKind.Array || records.GetRawText().Length > 2_000_000) throw new InvalidOperationException("Invalid record size.");
                                    var encrypted = System.Security.Cryptography.ProtectedData.Protect(System.Text.Encoding.UTF8.GetBytes(records.GetRawText()), null, System.Security.Cryptography.DataProtectionScope.CurrentUser);
                                    Directory.CreateDirectory(Path.GetDirectoryName(path)!);
                                    File.WriteAllBytes(path + ".tmp", encrypted);File.Move(path + ".tmp", path, true);
                                    result = new { saved = true };
                                }
                                else
                                {
                                    var raw = File.Exists(path) ? System.Security.Cryptography.ProtectedData.Unprotect(File.ReadAllBytes(path), null, System.Security.Cryptography.DataProtectionScope.CurrentUser) : System.Text.Encoding.UTF8.GetBytes("[]");
                                    using var parsed = System.Text.Json.JsonDocument.Parse(raw);result = parsed.RootElement.Clone();
                                }
                            }
                            if (!IsDisposed) core.PostWebMessageAsJson(System.Text.Json.JsonSerializer.Serialize(new { type = "bridge-result", id, ok = true, data = result }));
                        }
                        catch (Exception error) { if (!IsDisposed) core.PostWebMessageAsJson(System.Text.Json.JsonSerializer.Serialize(new { type = "bridge-result", id, ok = false, error = error.Message })); }
                        return;
                    }
                    if (type != "export-report") return;
                    var report = message.RootElement.GetProperty("report");
                    if (!report.GetProperty("simulation").GetBoolean()) return;
                    using var dialog = new SaveFileDialog { Filter = "JSON report (*.json)|*.json", FileName = "ORBIT-report.json", Title = "Save prototype report" };
                    if (dialog.ShowDialog(this) == DialogResult.OK)
                        File.WriteAllText(dialog.FileName, System.Text.Json.JsonSerializer.Serialize(report, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }), System.Text.Encoding.UTF8);
                }
                catch (Exception error)
                {
                    MessageBox.Show(this, "Could not save the report: " + error.Message, "ORBIT", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            };
            core.SetVirtualHostNameToFolderMapping("orbit.example", Path.Combine(AppContext.BaseDirectory, "Assets"), CoreWebView2HostResourceAccessKind.DenyCors);
            core.NavigationStarting += (_, ev) =>
            {
                if (!ev.Uri.StartsWith("https://orbit.example/", StringComparison.OrdinalIgnoreCase)) ev.Cancel = true;
            };
            if (smokeTest)
            {
                await core.AddScriptToExecuteOnDocumentCreatedAsync("window.ORBIT_SMOKE_TEST=true;window.orbitRuntimeErrors=[];addEventListener('error',e=>orbitRuntimeErrors.push({name:e.message+' at '+e.filename+':'+e.lineno,ok:false}));");
                core.NavigationCompleted += async (_, ev) =>
                {
                    try
                    {
                        if (!ev.IsSuccess) throw new Exception("Navigation failed: " + ev.WebErrorStatus);
                        for (var i = 0; i < 50; i++)
                        {
                            if (await core.ExecuteScriptAsync("window.OrbitData?.ready === true") == "true") break;
                            await Task.Delay(100);
                        }
                        await core.ExecuteScriptAsync(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Assets", "data-tests.js")));
                        var smokeSource = System.Text.Json.JsonSerializer.Serialize(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Assets", "smoke.js")));
                        var result = await core.ExecuteScriptAsync("(()=>{try{return eval(" + smokeSource + ");}catch(e){window.testResults=[...(window.orbitRuntimeErrors||[]),{name:e.stack||e.message,ok:false}];return false;}})()");
                        if (result == "\"pending\"")
                        {
                            for (var i = 0; i < 200; i++)
                            {
                                await Task.Delay(100);
                                result = await core.ExecuteScriptAsync("window.testDone ?? null");
                                if (result is "true" or "false") break;
                            }
                        }
                        Environment.ExitCode = result == "true" ? 0 : 2;
                        File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "smoke-test.txt"), result);
                        var details = await core.ExecuteScriptAsync("window.testResults || []");
                        File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "smoke-test-details.json"), details);
                    }
                    catch (Exception ex)
                    {
                        Environment.ExitCode = 3;
                        File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "smoke-test.txt"), ex.ToString());
                    }
                    Close();
                };
            }
            core.Navigate("https://orbit.example/index.html");
        }
        catch (Exception ex)
        {
            if (smokeTest) { Environment.ExitCode = 4; Close(); return; }
            MessageBox.Show("Could not start the application. Microsoft Edge WebView2 Runtime must be installed.\n\n" + ex.Message, "ORBIT", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }
}
