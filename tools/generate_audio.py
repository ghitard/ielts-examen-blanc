"""Generate the exam audio (Listening recording, sound check, Speaking examiner prompts).

Uses the Kokoro-82M neural TTS (kokoro-onnx). Model files are not stored in the repo:
download kokoro-v1.0.onnx and voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
and pass their folder with --models.

    python3 tools/generate_audio.py --models /path/to/models

Outputs:
    audio/listening.mp3            one continuous recording, pauses included
    audio/soundcheck.mp3
    audio/speaking/<prompt>.mp3
    data/listening-timings.js      part start times and the line-by-line timeline, in seconds
"""
import argparse, hashlib, json, os, re, subprocess, sys
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 24000

ap = argparse.ArgumentParser()
ap.add_argument("--models", required=True)
ap.add_argument("--cache", default=os.path.join(ROOT, ".tts-cache"))
ap.add_argument("--only", choices=["all", "listening", "speaking", "soundcheck"], default="all")
args = ap.parse_args()
os.makedirs(args.cache, exist_ok=True)

from kokoro_onnx import Kokoro  # noqa: E402

kokoro = Kokoro(os.path.join(args.models, "kokoro-v1.0.onnx"), os.path.join(args.models, "voices-v1.0.bin"))

TARGET_RMS = 10 ** (-20 / 20)  # -20 dBFS speech level


def split_sentences(text):
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z\"'])", text.strip())
    return [p for p in parts if p]


def synth_sentence(text, voice, lang, speed):
    key = hashlib.sha1(f"{voice}|{lang}|{speed}|{text}".encode()).hexdigest()
    path = os.path.join(args.cache, key + ".npy")
    if os.path.exists(path):
        return np.load(path)
    audio, sr = kokoro.create(text, voice=voice, speed=speed, lang=lang)
    assert sr == SR
    audio = trim(audio.astype(np.float32))
    np.save(path, audio)
    return audio


def trim(a, thr=0.004):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    start = max(0, idx[0] - int(0.02 * SR))
    end = min(len(a), idx[-1] + int(0.06 * SR))
    return a[start:end]


def level(a):
    rms = float(np.sqrt(np.mean(a ** 2))) if len(a) else 0.0
    if rms < 1e-6:
        return a
    a = a * (TARGET_RMS / rms)
    peak = float(np.max(np.abs(a)))
    if peak > 0.95:
        a = a * (0.95 / peak)
    return a


def silence(sec):
    return np.zeros(int(round(sec * SR)), dtype=np.float32)


def synth_turn(text, v):
    sentences = split_sentences(text.replace(" — ", ", "))
    chunks = []
    for i, s in enumerate(sentences):
        chunks.append(level(synth_sentence(s, v["voice"], v["lang"], v["speed"])))
        if i < len(sentences) - 1:
            chunks.append(silence(0.28))
    return np.concatenate(chunks) if chunks else silence(0.1)


def to_mp3(wav_path, mp3_path, bitrate="48k", gain_db=0.0):
    af = ["-af", f"volume={gain_db}dB"] if gain_db else []
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, *af, "-ac", "1", "-ar", str(SR),
                    "-c:a", "libmp3lame", "-b:a", bitrate, mp3_path], check=True)


def render_segments(segments, voices, timeline, t0_offset=0.0, part=None):
    out = []
    t = t0_offset
    prev_speaker = None
    for seg in segments:
        if "pause" in seg:
            a = silence(seg["pause"])
            out.append(a); t += len(a) / SR
            prev_speaker = None
            continue
        spk = seg["s"]
        v = voices[spk]
        if prev_speaker is not None:
            gap = 0.5 if prev_speaker != spk else 0.7
            if prev_speaker == "NARRATOR" or spk == "NARRATOR":
                gap = 0.9
            out.append(silence(gap)); t += gap
        a = synth_turn(seg["t"], v)
        timeline.append({"part": part, "speaker": spk, "start": round(t, 2), "end": round(t + len(a) / SR, 2), "text": seg["t"]})
        out.append(a); t += len(a) / SR
        prev_speaker = spk
        sys.stdout.write("."); sys.stdout.flush()
    return out, t


def build_listening():
    script = json.load(open(os.path.join(ROOT, "content", "listening-script.json")))
    voices = script["voices"]
    timeline, chunks = [], []
    t = 0.0
    a, t = render_segments(script["intro"], voices, timeline, t, part=0)
    chunks += a
    parts = []
    for p in script["parts"]:
        start = t
        # cue = moment the narrator says "Now listen ... answer questions"
        a, t = render_segments(p["segments"], voices, timeline, t, part=p["id"])
        chunks += a
        parts.append({"id": p["id"], "start": round(start, 2), "end": round(t, 2)})
        print(f"\n part {p['id']}: {start:.1f}s -> {t:.1f}s ({(t-start)/60:.1f} min)")
    audio = np.concatenate(chunks)
    wav = os.path.join(args.cache, "listening.wav")
    sf.write(wav, audio, SR)
    os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
    to_mp3(wav, os.path.join(ROOT, "audio", "listening.mp3"), gain_db=-1.5)
    words = sum(len(x["text"].split()) for x in timeline if x["speaker"] != "NARRATOR")
    speech = sum(x["end"] - x["start"] for x in timeline if x["speaker"] != "NARRATOR")
    print(f" total {len(audio)/SR/60:.1f} min, dialogue pace {words/(speech/60):.0f} wpm")
    timings = {"duration": round(len(audio) / SR, 2), "parts": parts, "timeline": timeline}
    with open(os.path.join(ROOT, "data", "listening-timings.js"), "w") as f:
        f.write("// Generated by tools/generate_audio.py. Do not edit by hand.\n")
        f.write("export const LISTENING_TIMINGS = " + json.dumps(timings, ensure_ascii=False, indent=1) + ";\n")


def build_soundcheck():
    script = json.load(open(os.path.join(ROOT, "content", "listening-script.json")))
    tl = []
    a, _ = render_segments(script["soundcheck"], script["voices"], tl)
    wav = os.path.join(args.cache, "soundcheck.wav")
    sf.write(wav, np.concatenate([silence(0.3)] + a + [silence(0.3)]), SR)
    to_mp3(wav, os.path.join(ROOT, "audio", "soundcheck.mp3"))


def build_speaking():
    script = json.load(open(os.path.join(ROOT, "content", "speaking-script.json")))
    v = script["examiner"]
    outdir = os.path.join(ROOT, "audio", "speaking")
    os.makedirs(outdir, exist_ok=True)
    durations = {}
    for pid, text in script["prompts"].items():
        a = np.concatenate([silence(0.15), synth_turn(text, v), silence(0.25)])
        wav = os.path.join(args.cache, f"sp_{pid}.wav")
        sf.write(wav, a, SR)
        to_mp3(wav, os.path.join(outdir, f"{pid}.mp3"), bitrate="40k")
        durations[pid] = round(len(a) / SR, 2)
        sys.stdout.write("."); sys.stdout.flush()
    print("\n speaking prompts:", len(durations))


if args.only in ("all", "soundcheck"):
    build_soundcheck(); print("soundcheck ok")
if args.only in ("all", "speaking"):
    build_speaking()
if args.only in ("all", "listening"):
    build_listening()
print("done")
