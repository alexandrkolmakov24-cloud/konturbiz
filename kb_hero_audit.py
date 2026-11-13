#!/usr/bin/env python3
"""
KONTURBIZ — аудит hero и «каркаса» всех страниц (ничего не меняет).

Запуск из корня сайта:
    python kb_hero_audit.py
Создаёт kb_hero_audit.csv и печатает сводку по типам hero.

Типы hero:
  STD        эталон: <section class="page-hero"> с .page-hero__media и .page-hero__overlay
             прямыми детьми секции (картинка и градиент на всю ширину)
  NESTED     media/overlay лежат внутри контейнера (shell/inner) — «стенка» слева
  CUSTOM:<>  свой шаблон (about-hero, rp-hero, ...), не page-hero
  NOHERO     hero не найден
Доп. признаки: нет header/footer, правило display:none для header/footer, нет hero-layout-fix.css,
нет tokens.css, длинный текст hero (h1+lead > 220 знаков), длинная последняя крошка.
"""
import csv, re, sys
from html.parser import HTMLParser
from pathlib import Path

SKIP_DIRS = {".git", ".kb_backup", "node_modules", "assets", "api", "files", "images",
             "components", "data", "konturscan", "m", "test-govsupport", "_reference"}
VOID = {"meta", "link", "img", "br", "hr", "input", "source", "area", "base", "col", "embed", "param", "track", "wbr"}


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # (tag, classes)
        self.hero = None         # dict
        self.in_hero_depth = None
        self.h1 = ""
        self.lead = ""
        self.last_crumb = ""
        self._cap = None
        self._li = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get("class") or "").split()
        if tag in VOID:
            return
        # старт hero
        if self.hero is None and tag in ("section", "div", "header") and any("hero" in c for c in cls) \
                and not any(c.startswith(("page-hero__", "kb-hero__")) for c in cls):
            self.hero = {"tag": tag, "classes": cls, "children": [], "all": []}
            self.in_hero_depth = len(self.stack)
        if self.hero is not None and self.in_hero_depth is not None:
            depth = len(self.stack) - self.in_hero_depth
            if depth >= 1:
                self.hero["all"].append((depth, cls))
                if depth == 1:
                    self.hero["children"].append(cls)
        self.stack.append((tag, cls))
        if self.hero is not None and self.in_hero_depth is not None:
            if tag == "h1" and not self.h1:
                self._cap = "h1"
            elif tag == "p" and ("lead" in cls or any("lead" in c for c in cls)) and not self.lead:
                self._cap = "lead"
        if tag == "li":
            self._li = True
            self._li_text = ""

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self._cap and tag in ("h1", "p"):
            self._cap = None
        if tag == "li" and self._li:
            self._li = False
        while self.stack:
            t, _ = self.stack.pop()
            if t == tag:
                break
        if self.in_hero_depth is not None and len(self.stack) <= self.in_hero_depth:
            self.in_hero_depth = None

    def handle_data(self, data):
        if self._cap == "h1":
            self.h1 += data
        elif self._cap == "lead":
            self.lead += data
        if self._li and any(c == "kb-breadcrumbs" for _, cl in self.stack for c in cl):
            self._li_text += data
            self.last_crumb = self._li_text


def classify(p):
    if not p.hero:
        return "NOHERO"
    cls = p.hero["classes"]
    if "page-hero" in cls or "kb-hero" in cls:
        flat = [" ".join(c) for c in p.hero["children"]]
        direct_media = any("page-hero__media" in c or "kb-hero__bg" in c for c in flat)
        direct_ov = any("page-hero__overlay" in c or "kb-hero__grad" in c for c in flat)
        any_media = any("page-hero__media" in " ".join(c) or "kb-hero__bg" in " ".join(c) for _, c in p.hero["all"])
        if direct_media and direct_ov:
            return "STD"
        if any_media:
            return "NESTED"
        return "STD-NOIMG"      # page-hero без картинки (пластины) — допустимо
    return "CUSTOM:" + ".".join(cls[:2])


def main():
    root = Path(".").resolve()
    rows = []
    for f in sorted(root.rglob("*.html")):
        rel = f.relative_to(root)
        if set(rel.parts[:-1]) & SKIP_DIRS:
            continue
        try:
            html = f.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        p = P()
        try:
            p.feed(html)
        except Exception:
            pass
        css = " ".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S | re.I))
        low = html.lower()
        noindex = bool(re.search(r'name=["\']robots["\'][^>]*noindex', html, re.I))
        text_len = len(re.sub(r"\s+", " ", p.h1 + " " + p.lead).strip())
        hide = bool(re.search(r"(?:^|[},\s])(?:header|\.header)\s*,[^{}]*footer[^{}]*\{[^}]*display\s*:\s*none", css, re.I))
        crumb = re.sub(r"\s+", " ", p.last_crumb).strip()
        rows.append({
            "page": str(rel).replace("\\", "/"),
            "hero": classify(p),
            "noindex": int(noindex),
            "no_header": int("<header" not in low),
            "no_footer": int("<footer" not in low),
            "hides_chrome_css": int(hide),
            "no_hero_layout_fix": int("hero-layout-fix.css" not in low),
            "no_tokens": int("tokens.css" not in low),
            "hero_text_len": text_len,
            "long_text": int(text_len > 230),
            "long_crumb": int(len(crumb) > 45),
            "last_crumb": crumb[:60],
        })
    with open("kb_hero_audit.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(rows)
    from collections import Counter
    c = Counter(r["hero"].split(":")[0] if not r["hero"].startswith("CUSTOM") else r["hero"] for r in rows if not r["noindex"])
    print("Страниц (без noindex): %d" % sum(c.values()))
    for k, v in c.most_common():
        print("  %-28s %d" % (k, v))
    for flag, label in (("no_header", "нет <header>"), ("no_footer", "нет <footer>"),
                        ("hides_chrome_css", "CSS скрывает header/footer"),
                        ("no_hero_layout_fix", "нет hero-layout-fix.css"),
                        ("long_text", "длинный текст hero (>230 зн.)"),
                        ("long_crumb", "длинная последняя крошка (>45 зн.)")):
        n = [r["page"] for r in rows if r[flag] and not r["noindex"]]
        print("%-36s %d" % (label + ":", len(n)))
    print("\nПодробности: kb_hero_audit.csv  (открывать в Excel, разделитель ;)")


if __name__ == "__main__":
    sys.exit(main())
