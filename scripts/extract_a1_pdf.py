#!/usr/bin/env python3
"""从 docs/A1.pdf 提取词汇，输出为 Woerter/*.js 格式。"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("请先安装: pip install pdfplumber", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "docs" / "A1.pdf"
OUT_PATH = ROOT / "Woerter" / "goethe_A1.js"
REPORT_PATH = ROOT / "docs" / "A1_extract_report.json"

SKIP_LINE_PATTERNS = [
    r"Goethe-Institut",
    r"^A1级别在线德语课程",
    r"^deutsch$",
    r"^online A1$",
    r"^词汇表$",
    r"^第1 - 18章$",
    r"^如何使用词汇表",
    r"^本词汇表包括",
    r"^• ",
    r"^单词词条按以下规律",
    r"特别重要的词汇",
    r"本词汇表不包括",
]

NEW_ENTRY_RE = re.compile(
    r"^(?:"
    r"(?:der|die|das)\s+"
    r"|\(sich\)\s+\w"
    r"|\(\([^)]+\)\)"
    r"|@ @"
    r"|-mal\b"
    r"|[A-Za-zÄÖÜäöüß@][\w\s\-/().=!?]+?[\u4e00-\u9fff（]"
    r")"
)

NOUN_RE = re.compile(
    r"^(der|die|das)\s+(.+?),\s*(\S+(?:\s*\([^)]*\))?)\s+([\u4e00-\u9fff（].+)$"
)
NOUN_SINGULAR_RE = re.compile(
    r"^(der|die|das)\s+(.+?)\s+\((Singular|Plural|singular|plural)\)\s+([\u4e00-\u9fff（].+)$"
)
NOUN_NO_PLURAL_RE = re.compile(
    r"^(der|die|das)\s+(.+?),\s+([\u4e00-\u9fff（].+)$"
)
REFLEXIVE_RE = re.compile(r"^\(sich\)\s+(\S+)\s+([\u4e00-\u9fff（].+)$")
BOLD_RE = re.compile(r"^\(\((.+?)\)\)\s+([\u4e00-\u9fff（].+)$")
CHINESE_RE = re.compile(r"[\u4e00-\u9fff（）、/…]+")
GERMAN_WORD_RE = re.compile(r"^[A-ZÄÖÜ][a-zäöüßA-ZÄÖÜ-]+$")

KONJ = {
    "aber", "als", "also", "bevor", "dass", "denn", "ob", "oder", "und", "wenn", "weil",
}
PRAP = {
    "ab", "an", "auf", "aus", "bei", "mit", "nach", "von", "zu", "in", "für", "gegen", "ohne",
    "um", "durch", "bis", "seit", "über", "unter", "vor", "hinter", "neben", "zwischen",
}
PRON = {
    "ich", "du", "er", "sie", "es", "wir", "ihr", "man", "alle", "alles", "beide", "beides",
    "wer", "was", "wo", "woher", "wohin", "welch", "mich", "dich", "sich",
}
ADJ_SUFFIXES = (
    "lich", "ig", "isch", "bar", "sam", "haft", "los", "end", "ent", "iv", "al", "ell", "ions",
)
ADJ_WORDS = {
    "alt", "falsch", "aktiv", "zufrieden", "neu", "gut", "schön", "wichtig", "möglich", "richtig",
    "falsch", "bekannt", "beliebt", "berühmt", "frisch", "sauber", "kaputt", "krank", "gesund",
    "arabisch", "automatisch", "zeitlich", "zentral", "wunderbar", "anstrengend", "aufregend",
}


def should_skip_line(line: str) -> bool:
    return any(re.search(p, line) for p in SKIP_LINE_PATTERNS)


def is_new_entry(line: str) -> bool:
    line = line.strip()
    if not line:
        return False
    if re.fullmatch(r"\((?:der|die|das)\)", line):
        return False
    return bool(NEW_ENTRY_RE.match(line))


def merge_lines(lines: list[str]) -> list[str]:
    merged: list[str] = []
    buffer = ""
    for raw in lines:
        line = raw.strip()
        if not line or should_skip_line(line):
            continue
        if re.fullmatch(r"\((?:der|die|das)\)", line):
            continue
        if not buffer:
            buffer = line
            continue
        if is_new_entry(line):
            merged.append(buffer)
            buffer = line
        else:
            buffer += " " + line
    if buffer:
        merged.append(buffer)
    return merged


def clean_example(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^[，,、\s]+", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def split_chinese_and_example(rest: str) -> tuple[str, str]:
    chinese_parts: list[str] = []
    examples: list[str] = []
    current = rest.strip()

    while current:
        m = CHINESE_RE.search(current)
        if not m:
            if current.strip():
                examples.append(current.strip())
            break

        before = current[: m.start()].strip()
        if before:
            examples.append(before)

        zh = m.group(0).strip(" ，,")
        if zh:
            chinese_parts.append(zh)

        current = current[m.end() :].strip()
        if not current:
            break
        if CHINESE_RE.match(current):
            continue

        next_zh = CHINESE_RE.search(current)
        if next_zh:
            chunk = current[: next_zh.start()].strip()
            if chunk:
                examples.append(chunk)
            current = current[next_zh.start() :].strip()
        else:
            examples.append(current.strip())
            break

    chinese = "，".join(dict.fromkeys(p for p in chinese_parts if p))
    example = clean_example(" ".join(ex for ex in examples if ex))
    return chinese, example


def expand_plural(word: str, plural_part: str) -> str:
    plural_part = plural_part.strip()
    if re.search(r"\(Singular\)|\(singular\)", plural_part, re.I):
        return "o.Pl"
    if re.search(r"\(Plural\)|\(plural\)", plural_part, re.I):
        return word
    plural_part = re.sub(r"\s*\([^)]*\)", "", plural_part).strip()
    if not plural_part or plural_part == "-":
        return word
    if plural_part.startswith("-"):
        suffix = plural_part[1:]
        if suffix == "e":
            return word + "e"
        if suffix == "n":
            if word.endswith("e"):
                return word + "n"
            if word.endswith("el"):
                return word + "n"
            if word.endswith("um"):
                return word[:-2] + "en"
            return word + "n"
        if suffix == "en":
            if word.endswith("e"):
                return word + "n"
            return word + "en"
        if suffix == "s":
            return word + "s"
        if "/" in suffix:
            return word + suffix.split("/")[0]
        return word + suffix
    if "/" in plural_part:
        return plural_part.split("/")[0]
    if GERMAN_WORD_RE.match(plural_part) and plural_part.lower() != word.lower():
        return plural_part
    return plural_part


def extract_trailing_plural(example: str, word: str) -> tuple[str, str | None]:
    parts = example.split()
    if not parts:
        return example, None
    last = parts[-1].rstrip(".,;:!?")
    if (
        GERMAN_WORD_RE.match(last)
        and last.lower() != word.lower()
        and len(last) > 2
        and (last.lower().startswith(word[:4].lower()) or word[:3].lower() in last.lower())
    ):
        return clean_example(" ".join(parts[:-1]) + (parts[-1][len(last):] if len(parts[-1]) > len(last) else "")), last
    return example, None


def classify_type(head: str, word: str, is_noun: bool) -> str:
    if is_noun:
        return "nom"
    w = word.lower().rstrip("?!-")
    if head.startswith("(sich)"):
        return "inf"
    if w in KONJ:
        return "konj"
    if w in PRAP or word.startswith(("zum ", "zur ", "am ", "an ", "zu ")):
        if w in PRAP or word in {"zum Beispiel", "zum Glück", "zu Fuß", "zu Ende", "zu Mittag", "zu Hause", "zu hause", "an Bord"}:
            return "prap"
    if w in PRON or word.endswith("?"):
        return "pron"
    if word.endswith("!"):
        return "inter"
    if w in ADJ_WORDS or any(w.endswith(s) for s in ADJ_SUFFIXES):
        return "adj"
    if w.endswith("en") and word[0].islower() and w not in {"zusammen", "zuerst", "zuletzt"}:
        return "inf"
    if word.endswith("-") or w.endswith("-"):
        return "adj"
    if word[0].isupper() and w.endswith("isch"):
        return "adj"
    return "adv"


def make_entry(
    chinese: str,
    word_type: str,
    gender: str,
    word: str,
    plural: str,
    example: str,
) -> dict | None:
    if not word or not chinese:
        return None
    return {
        "chinese": chinese,
        "type": word_type,
        "gender": gender,
        "word": word,
        "plural": plural,
        "example": example,
    }


def parse_noun(gender: str, word: str, plural_part: str, rest: str) -> dict | None:
    chinese, example = split_chinese_and_example(rest)
    example, trailing_plural = extract_trailing_plural(example, word.strip())
    plural = expand_plural(word.strip(), plural_part or trailing_plural or "-")
    return make_entry(chinese, "nom", gender.lower(), word.strip(), plural, example)


def parse_entry(raw: str) -> dict | None:
    raw = re.sub(r"\s+", " ", raw.strip())

    for regex, has_plural in ((NOUN_RE, True),):
        m = regex.match(raw)
        if m:
            gender, word, plural_part, rest = m.groups()
            return parse_noun(gender, word, plural_part, rest)

    m = NOUN_SINGULAR_RE.match(raw)
    if m:
        gender, word, sing_pl, rest = m.groups()
        plural_part = "(Singular)" if sing_pl.lower() == "singular" else "(Plural)"
        return parse_noun(gender, word, plural_part, rest)

    m = NOUN_NO_PLURAL_RE.match(raw)
    if m:
        gender, word, rest = m.groups()
        return parse_noun(gender, word, "-", rest)

    m = REFLEXIVE_RE.match(raw)
    if m:
        word, rest = m.groups()
        chinese, example = split_chinese_and_example(rest)
        return make_entry(chinese, "inf", "nan", word, "nan", example)

    m = BOLD_RE.match(raw)
    if m:
        word, rest = m.groups()
        chinese, example = split_chinese_and_example(rest)
        return make_entry(chinese, classify_type("", word, False), "nan", word, "nan", example)

    m = re.match(r"^-mal\b(.+)$", raw)
    if m:
        chinese, example = split_chinese_and_example(m.group(1).strip())
        return make_entry(chinese or "…次", "adv", "nan", "-mal", "nan", example)

    m = re.match(r"^@ @\s+(.+)$", raw)
    if m:
        chinese, example = split_chinese_and_example(m.group(1))
        return make_entry(chinese or "at 符号", "nan", "nan", "@", "nan", example)

    m = re.match(r"^(.+?)\s+([\u4e00-\u9fff（].+)$", raw)
    if not m:
        return None

    head, rest = m.group(1).strip(), m.group(2).strip()
    chinese, example = split_chinese_and_example(rest)

    article_match = re.match(r"^(der|die|das)\s+(.+)$", head, re.I)
    if article_match:
        gender, word = article_match.groups()
        return parse_noun(gender, word, "(Singular)", f"{chinese} {example}")

    head_clean = re.sub(r"\s*\([^)]*\)", "", head).strip()
    word = head_clean
    word_type = classify_type(head, word, False)
    gender = "nan"
    plural = "nan"
    if word_type == "nom":
        gender = "none"
        plural = "o.Pl"
    return make_entry(chinese, word_type, gender, word, plural, example)


def js_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def format_entry(entry: dict) -> str:
    return (
        f'\t{{chinese:"{js_escape(entry["chinese"])}",type:"{entry["type"]}", '
        f'gender:"{entry["gender"]}", word:"{js_escape(entry["word"])}", '
        f'plural:"{js_escape(entry["plural"])}", example:"{js_escape(entry["example"])}", }}'
    )


def extract_pdf_text() -> list[str]:
    lines: list[str] = []
    with pdfplumber.open(PDF_PATH) as doc:
        for page in doc.pages:
            text = page.extract_text() or ""
            lines.extend(text.split("\n"))
    return lines


def main() -> int:
    lines = extract_pdf_text()
    merged = merge_lines(lines)

    entries: list[dict] = []
    failed: list[str] = []
    for raw in merged:
        entry = parse_entry(raw)
        if entry:
            entries.append(entry)
        else:
            failed.append(raw)

    # 手动补充 PDF 提取失败的少量词条
    supplements = [
        {"chinese": "CD", "type": "nom", "gender": "die", "word": "CD", "plural": "CDs", "example": "Ich habe eine neue CD.", },
        {"chinese": "书", "type": "nom", "gender": "das", "word": "Buch", "plural": "Bücher", "example": "Das ist ein Buch.", },
        {"chinese": "DVD", "type": "nom", "gender": "die", "word": "DVD", "plural": "DVDs", "example": "Im dritten Stock gibt es DVDs.", },
        {"chinese": "MP3播放器", "type": "nom", "gender": "der", "word": "MP3-Player", "plural": "MP3-Player", "example": "Das ist mein MP3-Player.", },
        {"chinese": "X光片", "type": "nom", "gender": "das", "word": "Röntgenbild", "plural": "Röntgenbilder", "example": "Wir machen ein Röntgenbild.", },
        {"chinese": "T恤", "type": "nom", "gender": "das", "word": "T-Shirt", "plural": "T-Shirts", "example": "Wir brauchen Hosen, T-Shirts, Hemden, Jacken und Schuhe.", },
        {"chinese": "U盘", "type": "nom", "gender": "der", "word": "USB-Stick", "plural": "USB-Sticks", "example": "Der USB-Stick kostet 12,90 Euro.", },
    ]
    existing_words = {e["word"].lower() for e in entries}
    for item in supplements:
        if item["word"].lower() not in existing_words:
            entries.append(item)

    out_lines = ["const goethe_A1 = ["]
    out_lines.extend(format_entry(e) + "," for e in entries)
    if out_lines[-1].endswith(","):
        out_lines[-1] = out_lines[-1][:-1]
    out_lines.append("];")
    OUT_PATH.write_text("\n".join(out_lines) + "\n", encoding="utf-8")

    report = {
        "total_merged_lines": len(merged),
        "parsed_entries": len(entries),
        "failed_count": len(failed),
        "failed_samples": failed[:40],
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"合并行数: {len(merged)}")
    print(f"成功解析: {len(entries)}")
    print(f"解析失败: {len(failed)}")
    print(f"输出: {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
