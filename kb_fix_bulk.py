#!/usr/bin/env python3
"""
KONTURBIZ — массовые безопасные правки по ТЗ аудита 2026-11-04.

Что делает:
  1. SEO.EXTERNAL_FOLLOW — внешним ссылкам добавляет rel:
       * партнёрские (p=f76143 / from=ref_cabinet)  -> "sponsored nofollow noopener"
       * остальные внешние                          -> "nofollow noopener"
     Не трогает: свои домены, gov/официальные источники (список TRUSTED),
     mailto/tel/якоря, ссылки у которых уже есть nofollow/sponsored/ugc.
  2. GEO.HREFLANG_* — на индексируемых страницах (есть canonical, нет noindex)
     добавляет <link rel="alternate" hreflang="ru"> и hreflang="x-default"
     с адресом = canonical.
  3. TOKENS — подключает /assets/css/tokens.css последним в <head> каждой страницы
     (идемпотентно, версия в ?v=).
  4. FOOTER_H4 — заголовки колонок подвала <h4 class="footer__title"> -> <p class="footer__title">
     (убирает пропуск H2->H4 на всех страницах; вид не меняется, стили по классу).
  5. SEO.HEADING_HIERARCHY — ТОЛЬКО отчёт (kb_heading_report.csv): где пропущен
     уровень. Автоматически теги не меняются, т.к. это ломает стили.

Запуск (из корня сайта):
    python kb_fix_bulk.py            # dry-run: ничего не пишет, показывает счётчики
    python kb_fix_bulk.py --apply    # применить; копии оригиналов в .kb_backup/

Кодировка и переводы строк (CRLF/LF) сохраняются.
"""
import argparse, csv, re, shutil, sys
from pathlib import Path
from urllib.parse import urlparse

OWN = ("konturbiz.ru", "www.konturbiz.ru", "rcbiz.ru", "www.rcbiz.ru")
TRUSTED_SUFFIX = (".gov.ru", "gosuslugi.ru", "nalog.ru", "cbr.ru", "rospatent.gov.ru",
                  "consultant.ru", "garant.ru", "duma.gov.ru")
SKIP_DIRS = {".git", ".kb_backup", "node_modules", "assets", "api", "files", "images",
             "components", "data", "konturscan", "m", "test-govsupport", "_reference"}
# Свои профили и аффилированные ресурсы (шапка/подвал на каждой странице) — rel не добавляем
SKIP_HOSTS = ("max.ru", "t.me", "vk.ru", "vk.com", "youtube.com", "www.youtube.com",
              "gor.press", "mikhaylova.spb.ru", "wa.me")
# Партнёрские/реферальные ссылки -> sponsored nofollow
PARTNER_MARK = re.compile(
    r"(p=f76143|from=ref_cabinet|code=LYHHKKRK|/r/[A-Z0-9]{6,}|invite_code=|promocode=|auth/register/|register-code)",
    re.I)

A_TAG = re.compile(r"<a\b([^>]*)>", re.I)
HREF = re.compile(r"""\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')""", re.I)
REL = re.compile(r"""\brel\s*=\s*(?:"([^"]*)"|'([^']*)')""", re.I)


def host_of(url):
    if url.startswith("//"):
        url = "https:" + url
    try:
        return (urlparse(url).hostname or "").lower()
    except ValueError:
        return ""


def fix_links(html):
    n = 0

    def repl(m):
        nonlocal n
        attrs = m.group(1)
        hm = HREF.search(attrs)
        if not hm:
            return m.group(0)
        href = (hm.group(1) or hm.group(2) or "").strip()
        if not re.match(r"(https?:)?//", href):
            return m.group(0)
        host = host_of(href)
        if not host or host in OWN or host.endswith(".konturbiz.ru"):
            return m.group(0)
        if any(host == s.lstrip(".") or host.endswith(s) for s in TRUSTED_SUFFIX):
            return m.group(0)
        if any(host == h or host.endswith("." + h) for h in SKIP_HOSTS):
            return m.group(0)
        rm = REL.search(attrs)
        cur = (rm.group(1) or rm.group(2) or "") if rm else ""
        tokens = cur.split()
        if {"nofollow", "sponsored", "ugc"} & set(tokens):
            return m.group(0)
        add = ["sponsored", "nofollow"] if PARTNER_MARK.search(href) else ["nofollow"]
        for t in add + ["noopener"]:
            if t not in tokens:
                tokens.append(t)
        new_rel = 'rel="%s"' % " ".join(tokens)
        new_attrs = attrs[:rm.start()] + new_rel + attrs[rm.end():] if rm else attrs.rstrip() + " " + new_rel
        n += 1
        return "<a" + (new_attrs if new_attrs.startswith((" ", "\n", "\t")) else " " + new_attrs) + ">"

    return A_TAG.sub(repl, html), n


def fix_hreflang(html):
    head_end = re.search(r"</head>", html, re.I)
    if not head_end:
        return html, False
    head = html[:head_end.start()]
    if re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex', head, re.I):
        return html, False
    cm = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', head, re.I) \
        or re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']canonical["\']', head, re.I)
    if not cm:
        return html, False
    url = cm.group(1)
    nl = "\r\n" if "\r\n" in html else "\n"
    have_ru = re.search(r'hreflang=["\']ru["\']', head, re.I)
    have_xd = re.search(r'hreflang=["\']x-default["\']', head, re.I)
    add = ""
    if not have_ru:
        add += '<link rel="alternate" hreflang="ru" href="%s">%s' % (url, nl)
    if not have_xd:
        add += '<link rel="alternate" hreflang="x-default" href="%s">%s' % (url, nl)
    if not add:
        return html, False
    # вставляем сразу после canonical-тега
    line_end = html.find(">", cm.start()) + 1
    return html[:line_end] + nl + add.rstrip("\r\n") + html[line_end:], True


TOKENS_LINK = '<link rel="stylesheet" href="/assets/css/tokens.css?v=20261105-tokens">'


def add_tokens(html):
    if "tokens.css" in html:
        return html, False
    m = re.search(r"</head>", html, re.I)
    if not m:
        return html, False
    nl = "\r\n" if "\r\n" in html else "\n"
    return html[:m.start()] + TOKENS_LINK + nl + html[m.start():], True


FOOT_H4 = re.compile(r'<h4(\s+class="footer__title"[^>]*)>(.*?)</h4>', re.S)


def fix_footer(html):
    new, n = FOOT_H4.subn(lambda m: "<p%s>%s</p>" % (m.group(1), m.group(2)), html)
    return new, n


def heading_skips(html):
    body = re.sub(r"<(script|style)\b.*?</\1>", "", html, flags=re.S | re.I)
    prev, out = 0, []
    for m in re.finditer(r"<h([1-6])\b[^>]*>(.*?)</h\1>", body, re.S | re.I):
        lvl = int(m.group(1))
        if prev and lvl > prev + 1:
            txt = re.sub(r"<[^>]+>", "", m.group(2)).strip()[:60]
            out.append("H%d->H%d (%s)" % (prev, lvl, txt))
        prev = lvl
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--root", default=".")
    a = ap.parse_args()
    root = Path(a.root).resolve()
    backup = root / ".kb_backup"
    files = [p for p in root.rglob("*.html")
             if not (set(p.relative_to(root).parts[:-1]) & SKIP_DIRS)]
    tot_links = tot_hl = tot_tok = tot_foot = changed = 0
    rows = []
    for p in sorted(files):
        raw = p.read_bytes()
        try:
            html = raw.decode("utf-8")
        except UnicodeDecodeError:
            print("SKIP (не utf-8):", p)
            continue
        new, nl = fix_links(html)
        new, hl = fix_hreflang(new)
        new, tk = add_tokens(new)
        new, ft = fix_footer(new)
        for s in heading_skips(html):
            rows.append((str(p.relative_to(root)).replace("\\", "/"), s))
        if new != html:
            changed += 1
            tot_links += nl
            tot_hl += int(hl)
            tot_tok += int(tk)
            tot_foot += ft
            if a.apply:
                dst = backup / p.relative_to(root)
                dst.parent.mkdir(parents=True, exist_ok=True)
                if not dst.exists():
                    shutil.copy2(p, dst)
                p.write_bytes(new.encode("utf-8"))
    with open(root / "kb_heading_report.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["page", "skip"])
        w.writerows(rows)
    print("%s: файлов изменено %d из %d | ссылок с rel: %d | hreflang: %d | tokens.css подключён: %d | h4 подвала -> p: %d | пропусков заголовков: %d (см. kb_heading_report.csv)"
          % ("ПРИМЕНЕНО" if a.apply else "DRY-RUN", changed, len(files), tot_links, tot_hl, tot_tok, tot_foot, len(rows)))
    if not a.apply:
        print("Для записи запустите с --apply (копии в .kb_backup/).")


if __name__ == "__main__":
    sys.exit(main())
