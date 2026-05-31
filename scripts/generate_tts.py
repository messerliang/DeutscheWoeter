#!/usr/bin/env python3
"""
批量为 DeutscheWoeter 项目生成缺失的单词发音音频。

使用 Microsoft Edge TTS（edge-tts），免费且无需 API Key。

用法:
  pip install -r scripts/requirements.txt
  python scripts/generate_tts.py --dry-run          # 仅列出缺失音频
  python scripts/generate_tts.py                    # 生成全部缺失项
  python scripts/generate_tts.py --unit B1E1        # 仅生成指定单元
  python scripts/generate_tts.py --force            # 覆盖已存在文件
  python scripts/generate_tts.py --list-voices      # 列出德语语音
  python scripts/generate_tts.py --voice de-DE-ConradNeural

依赖:
  - Python 3.8+
  - 若需输出 .wav，请安装 ffmpeg 并加入 PATH（https://ffmpeg.org/）
    未安装 ffmpeg 时将保留 .mp3，网页端需自行适配扩展名。
"""

from __future__ import annotations

import argparse
import asyncio
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("请先安装依赖: pip install -r scripts/requirements.txt", file=sys.stderr)
    sys.exit(1)


def safe_print(message: str, *, file=None) -> None:
    stream = file or sys.stdout
    try:
        print(message, file=stream)
    except UnicodeEncodeError:
        print(message.encode(stream.encoding or "utf-8", errors="replace").decode(stream.encoding or "utf-8", errors="replace"), file=stream)


ROOT = Path(__file__).resolve().parent.parent
WOERTER_DIR = ROOT / "Woerter"
AUDIO_DIR = ROOT / "WoeterAudio"
SHARED_AUDIO_DIR = AUDIO_DIR / "shared"
DEFAULT_VOICE = "de-DE-KatjaNeural"

SKIP_FILES = {
    "curricula.js",
    "word-loader.js",
    "word-registry.js",
    "current_einheits.js",
    "Woeter.js",
}
WORD_FILE_PATTERN = re.compile(r"^.+\.js$")
ENTRY_PATTERN = re.compile(r"\{[^{}]*\}", re.DOTALL)
FIELD_PATTERN = re.compile(r"(\w+)\s*:\s*\"((?:\\.|[^\"])*)\"")
GENDER_IN_WORD = re.compile(r"^(der|die|das)\s+(.+)$", re.IGNORECASE)


@dataclass
class WordEntry:
    unit: str
    chinese: str
    word_type: str
    word: str
    gender: str | None

    @property
    def audio_subdir(self) -> str:
        return "shared"

    @property
    def audio_basename(self) -> str:
        word_clean = self.word.replace("/", "")
        if self.word_type == "nom" and self.gender:
            return f"{self.gender}_{word_clean}"
        return word_clean

    @property
    def tts_text(self) -> str:
        if self.word_type == "nom" and self.gender:
            return f"{self.gender} {self.word}"
        if self.word_type in ("trennV", "trenV"):
            return self.word.replace("/", " ")
        return self.word

    def existing_audio(self) -> Path | None:
        shared = SHARED_AUDIO_DIR / f"{self.audio_basename}.wav"
        if shared.is_file():
            return shared
        for ext in (".mp3",):
            path = SHARED_AUDIO_DIR / f"{self.audio_basename}{ext}"
            if path.is_file():
                return path
        return None

    def target_path(self, ext: str) -> Path:
        return SHARED_AUDIO_DIR / f"{self.audio_basename}{ext}"


def parse_word_file(path: Path) -> list[WordEntry]:
    unit = path.stem
    content = path.read_text(encoding="utf-8")
    entries: list[WordEntry] = []

    for block in ENTRY_PATTERN.findall(content):
        fields: dict[str, str] = {}
        for key, value in FIELD_PATTERN.findall(block):
            fields[key] = value.replace('\\"', '"')

        if "word" not in fields or "type" not in fields:
            continue

        word = fields["word"].strip()
        word_type = fields["type"].strip()
        gender = fields.get("gender", "").strip()
        chinese = fields.get("chinese", "").strip()

        if gender in ("", "nan", "none"):
            gender = None

        if word_type == "nom" and not gender:
            match = GENDER_IN_WORD.match(word)
            if match:
                gender = match.group(1).lower()
                word = match.group(2)

        entries.append(
            WordEntry(
                unit=unit,
                chinese=chinese,
                word_type=word_type,
                word=word,
                gender=gender,
            )
        )

    return entries


def load_all_entries(units: list[str] | None = None) -> list[WordEntry]:
    entries: list[WordEntry] = []
    seen_basenames: set[str] = set()

    for path in sorted(WOERTER_DIR.glob("*.js")):
        if path.name in SKIP_FILES or not WORD_FILE_PATTERN.match(path.name):
            continue
        if units and path.stem not in units:
            continue

        for entry in parse_word_file(path):
            if entry.audio_basename in seen_basenames:
                continue
            seen_basenames.add(entry.audio_basename)
            entries.append(entry)

    return entries


def has_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def mp3_to_wav(mp3_path: Path, wav_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(mp3_path),
            str(wav_path),
        ],
        check=True,
    )


async def synthesize(text: str, voice: str, output: Path) -> None:
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(output))


async def generate_one(
    entry: WordEntry,
    voice: str,
    force: bool,
    prefer_wav: bool,
    delay: float,
) -> tuple[str, str]:
    existing = entry.existing_audio()
    if existing and not force:
        return "skip", f"已存在: {existing.relative_to(ROOT)}"

    out_dir = SHARED_AUDIO_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    use_wav = prefer_wav and has_ffmpeg()
    out_ext = ".wav" if use_wav else ".mp3"
    final_path = entry.target_path(out_ext)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_mp3 = Path(tmp) / "speech.mp3"
        await synthesize(entry.tts_text, voice, tmp_mp3)

        if use_wav:
            mp3_to_wav(tmp_mp3, final_path)
        else:
            shutil.copy2(tmp_mp3, final_path)

    if delay > 0:
        await asyncio.sleep(delay)

    rel = final_path.relative_to(ROOT)
    return "ok", f"{entry.unit} | {entry.tts_text!r} -> {rel}"


async def run(args: argparse.Namespace) -> int:
    if args.list_voices:
        voices = await edge_tts.list_voices()
        german = [v for v in voices if v["Locale"].startswith("de-")]
        for v in sorted(german, key=lambda x: x["ShortName"]):
            print(f"{v['ShortName']:28} {v['Gender']:8} {v['FriendlyName']}")
        return 0

    units = args.unit or None
    entries = load_all_entries(units)
    if not entries:
        print("未找到任何单词条目。", file=sys.stderr)
        return 1

    missing = [e for e in entries if not e.existing_audio()]
    targets = entries if args.force else missing
    if args.limit and args.limit > 0:
        targets = targets[: args.limit]

    print(f"词库条目: {len(entries)}")
    print(f"已有音频: {len(entries) - len(missing)}")
    print(f"待生成:   {len(targets)}")
    print(f"语音:     {args.voice}")

    if args.prefer_wav and not has_ffmpeg():
        print("提示: 未检测到 ffmpeg，将输出 .mp3（网页 play() 目前只加载 .wav）", file=sys.stderr)

    if args.dry_run:
        for entry in targets:
            ext = ".wav" if args.prefer_wav and has_ffmpeg() else ".mp3"
            path = entry.target_path(ext)
            safe_print(f"[待生成] {entry.unit:6} {entry.tts_text:24} -> {path.relative_to(ROOT)}")
        return 0

    ok = skip = fail = 0
    for i, entry in enumerate(targets, 1):
        try:
            status, message = await generate_one(
                entry,
                voice=args.voice,
                force=args.force,
                prefer_wav=args.prefer_wav,
                delay=args.delay,
            )
            prefix = {"ok": "OK", "skip": "SKIP"}[status]
            safe_print(f"[{i}/{len(targets)}] {prefix} {message}")
            if status == "ok":
                ok += 1
            else:
                skip += 1
        except subprocess.CalledProcessError:
            fail += 1
            safe_print(f"[{i}/{len(targets)}] FAIL ffmpeg: {entry.unit} {entry.tts_text!r}", file=sys.stderr)
        except Exception as exc:
            fail += 1
            safe_print(f"[{i}/{len(targets)}] FAIL {entry.unit} {entry.tts_text!r}: {exc}", file=sys.stderr)

    safe_print(f"\n完成: 生成 {ok}, 跳过 {skip}, 失败 {fail}")
    return 1 if fail else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="批量生成 DeutscheWoeter 单词 TTS 音频")
    parser.add_argument(
        "--unit",
        action="append",
        metavar="BxEx",
        help="仅处理指定单元，可重复，如 --unit B1E1 --unit B2E3",
    )
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"TTS 语音（默认 {DEFAULT_VOICE}）")
    parser.add_argument("--dry-run", action="store_true", help="只列出待生成文件，不实际合成")
    parser.add_argument("--force", action="store_true", help="覆盖已存在的音频")
    parser.add_argument("--list-voices", action="store_true", help="列出可用德语语音")
    parser.add_argument(
        "--mp3",
        dest="prefer_wav",
        action="store_false",
        help="直接输出 mp3，不转换为 wav",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.3,
        help="每条之间的间隔秒数，避免请求过快（默认 0.3）",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="最多生成条数，0 表示不限制",
    )
    parser.set_defaults(prefer_wav=True)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args)))


if __name__ == "__main__":
    main()
