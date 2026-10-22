# Hero: готов принять картинку

Эталон: 1200×400, фон `#01091C`, градиент слева, картинка справа (opacity 100%).
Стили: `/assets/css/hero.css` (классы `.page-hero`, `.page-hero__media`).

## Разметка (всегда одна и та же)

Не использовать `page-hero--no-media` на новых/пересобираемых страницах.
Слот под картинку **всегда** в HTML — даже если файла ещё нет.

```html
<section class="page-hero" aria-labelledby="page-h1">
  <!-- СЛОТ КАРТИНКИ: достаточно заменить src -->
  <div class="page-hero__media">
    <img
      src="/images/heroes/ИМЯ-СТРАНИЦЫ.webp"
      alt="Краткое описание сцены"
      width="1200"
      height="400"
      decoding="async"
    >
  </div>
  <div class="page-hero__overlay" aria-hidden="true"></div>

  <div class="container">
    <span class="eyebrow eyebrow--gold">Раздел · тема</span>
    <nav class="kb-breadcrumbs" aria-label="Хлебные крошки">
      <ol>
        <li><a href="/">Главная</a></li>
        <li aria-current="page">Текущая</li>
      </ol>
    </nav>
    <h1 id="page-h1">Заголовок<br>вторая строка</h1>
    <p class="lead">Короткий лид до 2–3 строк.</p>
    <div class="button-group">
      <a href="..." class="button button--gold">Основное действие</a>
      <a href="..." class="button button--white-outline">Второе</a>
    </div>
  </div>
</section>
```

## Как добавить картинку позже

1. Положить файл: `/images/heroes/ИМЯ-СТРАНИЦЫ.webp` (рекомендуемо 1200×400 или 2400×800).
2. В HTML поменять только `src` у `<img>` (или сразу указать правильный путь).
3. **Не** переписывать секцию, **не** добавлять `page-hero--no-media`.

Пока файла нет: hero остаётся navy + градиент + текст (фон секции `#01091C`).
После загрузки файла на тот же `src` картинка встаёт в правую зону 1200×400 без правки CSS.

## Правила

| Правило | Да / нет |
|--------|----------|
| Высота desktop 400px | да |
| Макс. 2 кнопки в ряд | да |
| Eyebrow — короткий, не bar на 100% ширины | да |
| `page-hero--no-media` | не использовать на шаблоне «с медиа» |
| Full-bleed картинка на весь экран | нет |
| Затемнение картинки (opacity &lt; 1) desktop | нет |
| Mobile: картинка слабее / текст читаем (уже в hero.css) | да |

## Пути-имена (договорённость)

```
/images/heroes/solutions.webp
/images/heroes/services.webp
/images/heroes/diagnostics.webp
/images/heroes/industries-retail.webp
/images/heroes/industries-services.webp
/images/heroes/industries-horeca.webp
/images/heroes/industries-smb.webp
/images/heroes/branding.webp
/images/heroes/partners-kontur.webp
...
```

Страницы с отдельным hero (about-hero, главная .hero) не ломать — у about уже свой media-слот.
