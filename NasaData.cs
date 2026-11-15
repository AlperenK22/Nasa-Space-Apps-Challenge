using System.Globalization;
using System.Text.Json;

namespace OrbitDesktop;

internal static class NasaData
{
    static readonly HttpClient Http = new(new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = TimeSpan.FromSeconds(25) };
    static async Task<JsonElement> GetJson(string url)
    {
        using var response = await Http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync();
        using var buffer = new MemoryStream();
        var bytes = new byte[8192]; int count;
        while ((count = await stream.ReadAsync(bytes)) > 0)
        {
            if (buffer.Length + count > 4_000_000) throw new InvalidOperationException("NASA response exceeded the size limit.");
            buffer.Write(bytes, 0, count);
        }
        using var json = JsonDocument.Parse(buffer.ToArray());
        return json.RootElement.Clone();
    }
    public static async Task<object> Donki()
    {
        var end = DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var start = DateTime.UtcNow.AddDays(-7).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var parts = new Dictionary<string, object>();
        var requests = new[] { "FLR", "CME", "SEP" }.Select(async kind =>
        {
            var url = $"https://ccmc.gsfc.nasa.gov/DONKI/WS/get/{kind}?startDate={start}&endDate={end}";
            try { return KeyValuePair.Create(kind, (object)new { ok = true, data = await GetJson(url), url, fetchedAt = DateTime.UtcNow }); }
            catch (Exception error) { return KeyValuePair.Create(kind, (object)new { ok = false, error = error is TaskCanceledException ? "NASA connection timed out." : "NASA request failed: " + error.Message, url }); }
        });
        foreach (var part in await Task.WhenAll(requests)) parts[part.Key] = part.Value;
        return new { source = "NASA DONKI", start, end, parts };
    }
    public static async Task<object> Radlab(JsonElement request)
    {
        var startText = request.GetProperty("start").GetString() ?? "";
        var endText = request.GetProperty("end").GetString() ?? "";
        if (!DateTime.TryParseExact(startText, "yyyy-MM-ddTHH:mm", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var start) ||
            !DateTime.TryParseExact(endText, "yyyy-MM-ddTHH:mm", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var end) ||
            end <= start || end - start > TimeSpan.FromHours(6) || end > DateTime.UtcNow)
            throw new InvalidOperationException("Archive interval must be in the past, chronological, and no longer than 6 hours (UTC).");
        // Public instrument archive only. No patient or manual measurement fields go to NASA.
        var url = "https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=DosTel&timestamp%3E=" + Uri.EscapeDataString(startText) + "&timestamp%3C=" + Uri.EscapeDataString(endText) + "&absorbed_dose_rate=&flux=&format=json";
        return new { source = "NASA RadLab", spacecraft = "ISS", instrument = "DosTel", start = startText, end = endText, url, fetchedAt = DateTime.UtcNow, data = await GetJson(url) };
    }
}
