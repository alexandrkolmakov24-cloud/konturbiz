#!/usr/bin/env python3
"""
KONTURBIZ — добавить на страницу шапку (header), подвал (footer), базовые стили и скрипты сайта.

Шапка и подвал берутся с «страницы-донора» (по умолчанию pages/services/loyalty.html),
потому что файлы components/*.html отстали от живых страниц.

Запуск из корня сайта:
    python kb_add_chrome.py pages/services/loyalty-calculator.html            # dry-run
    python kb_add_chrome.py pages/services/loyalty-calculator.html --apply    # записать
    python kb_add_chrome.py <страница> --donor pages/services/acquisition.html --apply

Что делает (идемпотентно):
  1. <head>: добавляет konturbiz.css, header.css, footer.css (до собственных <style> страницы),
             buttons.css и hero-layout-fix.css (после kb-motion.css), если их нет.
  2. <body>: после <body> вставляет skip-ссылку и <header>, если <header> отсутствует.
  3. <main>: добавляет id="main" (для skip-ссылки).
  4. Перед скриптами в конце <body> вставляет <footer>, если <footer> отсутствует.
  5. Добавляет /assets/js/app.js и navigation.js (defer), если их нет.
Копия оригинала: <страница>.bak (создаётся при --apply, один раз).
"""
import argparse, re, shutil, sys
from pathlib import Path


def block(html, tag):
    m = re.search(r"<%s\b.*?</%s>" % (tag, tag), html, re.S | re.I)
    return m.group(0) if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page")
    ap.add_argument("--donor", default="pages/services/loyalty.html")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()

    page, donor = Path(a.page), Path(a.donor)
    raw = page.read_bytes()
    html = raw.decode("utf-8")
    nl = "\r\n" if "\r\n" in html else "\n"
    dh = donor.read_bytes().decode("utf-8").replace("\r\n", "\n")
    header, footer = block(dh, "header"), block(dh, "footer")
    if not header or not footer:
        sys.exit("В доноре не найден <header> или <footer>: " + str(donor))
    skip = re.search(r'<a class="skip-to-content"[^>]*>.*?</a>', dh, re.S)
    skip = skip.group(0) if skip else '<a class="skip-to-content" href="#main">Перейти к содержанию</a>'

    def tonl(s):
        return s.replace("\n", nl)

    done = []
    # 1. head links
    head_end = html.lower().find("</head>")
    head = html[:head_end]

    def has(name):
        return name in head

    redesign = re.search(r'<link[^>]*konturbiz-redesign\.css[^>]*>', html)
    pre = ""
    for css in ("konturbiz.css", "header.css", "footer.css"):
        if not has("/assets/css/" + css):
            pre += '<link rel="stylesheet" href="/assets/css/%s">%s' % (css, nl)
            done.append(css)
    if pre:
        # базовые стили — ДО собственных <style> страницы (чтобы они не переписали её оформление)
        first_style = re.search(r"<style\b", html[:html.lower().find("</head>")], re.I)
        if first_style:
            at = first_style.start()
        elif redesign:
            at = redesign.start()
        else:
            at = html.lower().find("</head>")
        html = html[:at] + pre + html[at:]
    head_end = html.lower().find("</head>")
    head = html[:head_end]
    post = ""
    for css, v in (("buttons.css", "?v=20261026-hero-standard"), ("hero-layout-fix.css", "?v=20261028-hero-std")):
        if not has("/assets/css/" + css):
            post += '<link rel="stylesheet" href="/assets/css/%s%s">%s' % (css, v, nl)
            done.append(css)
    if post:
        tok = re.search(r'<link[^>]*tokens\.css[^>]*>', html)
        i = tok.start() if tok else html.lower().find("</head>")
        html = html[:i] + post + html[i:]

    # 2. header
    if not re.search(r"<header\b", html, re.I):
        m = re.search(r"<body[^>]*>", html, re.I)
        html = html[:m.end()] + nl + tonl(skip) + nl + tonl(header) + nl + html[m.end():]
        done.append("header")
    # 3. main id
    m = re.search(r"<main(?![^>]*\bid=)([^>]*)>", html)
    if m:
        html = html[:m.start()] + '<main id="main"%s>' % m.group(1) + html[m.end():]
        done.append("main#id")
    # 4. footer
    if not re.search(r"<footer\b", html, re.I):
        main_end = html.lower().rfind("</main>")
        pos = html.find("<script", main_end if main_end != -1 else 0)
        if pos == -1:
            pos = html.lower().rfind("</body>")
        html = html[:pos] + tonl(footer) + nl + nl + html[pos:]
        done.append("footer")
    # 5. scripts
    add = ""
    for js in ("app.js", "navigation.js"):
        if "/assets/js/" + js not in html:
            add += '<script src="/assets/js/%s" defer></script>%s' % (js, nl)
            done.append(js)
    if add:
        i = html.lower().rfind("</body>")
        html = html[:i] + add + html[i:]

    print(("ПРИМЕНЕНО" if a.apply else "DRY-RUN") + ": " + (", ".join(done) if done else "ничего не нужно"))
    if a.apply and done:
        bak = page.with_suffix(page.suffix + ".bak")
        if not bak.exists():
            shutil.copy2(page, bak)
        page.write_bytes(html.encode("utf-8"))
    elif not a.apply and done:
        print("Для записи добавьте --apply (копия: %s.bak)" % page.name)


if __name__ == "__main__":
    main()
