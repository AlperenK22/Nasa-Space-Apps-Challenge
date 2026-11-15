namespace OrbitDesktop;
internal static class LocalSpeech
{
    static dynamic? speaker;
    static bool initialized;
    static bool english;
    static string status = "Speech system has not been checked yet.";
    static void Initialize()
    {
        if (initialized) return;
        initialized = true;
        try
        {
            var type = Type.GetTypeFromProgID("SAPI.SpVoice");
            if (type == null) throw new InvalidOperationException("Windows speech system is unavailable.");
            speaker = Activator.CreateInstance(type);
            dynamic voices = speaker!.GetVoices();
            for (var i = 0; i < (int)voices.Count; i++)
            {
                dynamic voice = voices.Item(i);
                string language = voice.GetAttribute("Language");
                // SAPI language tokens are hexadecimal LCIDs; primary language 9 is English.
                if (language.Split(';').Any(code => int.TryParse(code.Trim(), System.Globalization.NumberStyles.HexNumber, null, out var lcid) && (lcid & 0x3ff) == 9))
                {
                    speaker.Voice = voice;speaker.Volume = 75;speaker.Rate = -1;english = true;break;
                }
            }
            if (!english) speaker = null;
            status = english ? "English Windows voice ready; speech is processed locally." : "No English Windows voice installed; a warning tone will be used. Written warnings remain available.";
        }
        catch { speaker = null;status = "Local speech is unavailable; a warning tone may be used. Written warnings remain available."; }
    }
    public static object Status() { Initialize();return new { language = "en", available = english, message = status }; }
    public static object Speak(string text, bool suppressAudio, string? englishText = null)
    {
        Initialize();
        if (suppressAudio) return new { mode = "test-muted", message = "Audio muted during testing." };
        try
        {
            if (speaker != null)
            {
                var speech = string.IsNullOrWhiteSpace(englishText) ? text : englishText;
                speaker.Speak(speech.Length > 1200 ? speech[..1200] : speech, 3);
                return new { mode = "english-speech", message = "Warning is being read by the local English Windows voice." };
            }
            System.Media.SystemSounds.Exclamation.Play();return new { mode = "tone", message = status };
        }
        catch { return new { mode = "unavailable", message = "Audio could not be played; the written warning remains on screen." }; }
    }
    public static void Stop() { try { if (speaker != null) speaker.Speak("", 3); } catch { } }
}
