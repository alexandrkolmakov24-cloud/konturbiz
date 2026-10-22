# KONTURBIZ — пакет исходных данных для ИИ-редактора

Дата сборки: 2026-10-22  
Источник структуры сайта: GitHub, ветка `ai-work`, репозиторий `alexandrkolmakov24-cloud/konturbiz`.  
Назначение: передать локальной модели Ollama факты о сайте, услугах, текущих статьях и правилах редакционного выбора.

## Главная задача модели

Не генерировать статьи ради объёма. Выбирать следующую тему на основе:
1. подтверждённого спроса из переданных выгрузок;
2. пробела в покрытии потребности пользователя;
3. отсутствия дублирования с существующими URL;
4. связи с услугами KONTURBIZ;
5. способности материала дать самостоятельный практический ответ;
6. свежести темы — только при наличии датированных источников;
7. трудоёмкости и ожидаемой полезности.

Если нет поисковых данных, нельзя придумывать частотность, динамику или говорить «тренд». Отмечать такие темы как гипотезы для проверки.

## Позиционирование KONTURBIZ

KONTURBIZ — цифровой центр развития бизнеса. Помогает предпринимателям определить приоритетную задачу, спроектировать решение и организовать внедрение. Принцип коммуникации: сначала задача, затем технология; цифровые инструменты должны работать как система.

Аудитория: ИП, самозанятые, малый и средний бизнес, торговля, HoReCa и сфера услуг. Контент — экспертный B2B, без инфобизнесовых обещаний и SEO-спама.

## Правила работы с сайтами и публикациями

- Текущая ветка проекта: `ai-work`. Не менять production/main и не публиковать статьи без отдельного подтверждения.
- Раздел базы знаний намеренно закрыт от индексации на этапе наполнения. `noindex, follow` сейчас — временное решение, не исправлять автоматически.
- Перед новой статьёй сначала проверить соответствующие существующие URL: возможно, лучше расширить уже имеющуюся страницу.
- Не обещать одобрение гранта, рост продаж или гарантированный SEO-результат.
- Не предлагать сторонние интеграции с 1С/Битрикс как стандартный вариант. Учитывать ограничения и фактический ассортимент KONTURBIZ/партнёров.
- RC CITY/RC PAY не продвигать в каждом материале без связи с задачей; упоминать там, где релевантны лояльность, платежи, удержание или экосистема.
- Для услуг SKB Контур учитывать отдельный партнёрский путь: клиент может уходить на сайт/форму партнёра, а не обращаться в KONTURBIZ.
- Не менять названия услуг и утверждения без подтверждения страницей-источником.

## Текущая база знаний

Хаб: https://konturbiz.ru/pages/knowledge/

Разделы:
- `digitalization/`
- `loyalty/`
- `automation/`
- `branding/`
- `marketing/`
- `retail/`
- `small-business/`
- `finance/`
- `management/`
- `partners/`
- `grants/`

### Существующие статьи — не создавать дубль без проверки

| Раздел | URL | Текущая тема |
|---|---|---|
| digitalization | `/pages/knowledge/digitalization/chto-takoe-cifrovoj-kontur.html` | Что такое цифровой контур |
| digitalization | `/pages/knowledge/digitalization/s-chego-nachat-cifrovizaciyu.html` | С чего начать цифровизацию |
| loyalty | `/pages/knowledge/loyalty/chto-takoe-programma-loyalnosti.html` | Что такое программа лояльности |
| loyalty | `/pages/knowledge/loyalty/bonusy-ili-skidki.html` | Бонусы или скидки |
| loyalty | `/pages/knowledge/loyalty/kak-rabotaet-rc-city.html` | Как работает RC CITY |
| automation | `/pages/knowledge/automation/chto-avtomatizirovat-v-malom-biznese.html` | Что автоматизировать в малом бизнесе |
| automation | `/pages/knowledge/automation/crm-nuzhna-li-malomu-biznesu.html` | Нужна ли CRM малому бизнесу |
| branding | `/pages/knowledge/branding/chem-brending-otlichaetsya-ot-logotipa.html` | Чем брендинг отличается от логотипа |
| branding | `/pages/knowledge/branding/kogda-nuzhen-rebrending.html` | Когда нужен ребрендинг |
| marketing | `/pages/knowledge/marketing/pochemu-sajt-ne-prinosit-klientov.html` | Почему сайт не приносит клиентов |
| retail | `/pages/knowledge/retail/povtornye-prodazhi-v-magazine.html` | Повторные продажи в магазине |
| small-business | `/pages/knowledge/small-business/cifrovye-instrumenty-dlya-ip.html` | Цифровые инструменты для ИП |
| finance | `/pages/knowledge/finance/ekonomika-programmy-loyalnosti.html` | Экономика программы лояльности |
| management | `/pages/knowledge/management/kakie-pokazateli-otlezhivat.html` | Какие показатели отслеживать |
| partners | `/pages/knowledge/partners/kak-vybrat-partnera-po-loyalnosti.html` | Как выбрать партнёра по лояльности |
| grants | `/pages/knowledge/grants/gospodderzhka-cifrovizacii.html` | Технически перенаправляет на страницу услуг господдержки; проверить прежде, чем считать отдельной статьёй |

Примечание по состоянию контента на 2026-10-22: предыдущая проверка показала, что большинство статей короткие и требуют редакционного наполнения. Это не означает, что все они должны быть заменены: сначала оценить их интент, полезность и спрос.

## Коммерческие страницы и направления

### Услуги KONTURBIZ
- Каталог услуг: https://konturbiz.ru/pages/services/
- Разработка сайта: https://konturbiz.ru/pages/services/web-development.html
- Брендинг: https://konturbiz.ru/pages/services/branding.html
- CRM: https://konturbiz.ru/pages/services/crm.html
- Цифровой аудит: https://konturbiz.ru/pages/services/digital-audit.html
- Программа лояльности: https://konturbiz.ru/pages/services/loyalty.html
- Господдержка по ИНН, гранты и субсидии: https://konturbiz.ru/pages/services/grants.html
- Telegram-боты: https://konturbiz.ru/pages/services/telegram-bots.html
- Бизнес-план: https://konturbiz.ru/pages/services/business-plan.html
- Графический дизайн: https://konturbiz.ru/pages/services/graphic-design.html
- Интеграция: https://konturbiz.ru/pages/services/integration.html
- Расчётный счёт: https://konturbiz.ru/pages/services/account-opening.html
- Сравнение банков: https://konturbiz.ru/pages/services/bank-comparison.html
- Способы оплаты: https://konturbiz.ru/pages/services/payment-methods.html
- Цены: https://konturbiz.ru/pages/services/prices.html
- Тарифы: https://konturbiz.ru/pages/services/tariffs.html
- SMM & Content Kit: https://konturbiz.ru/pages/services/smm-content-kit.html
- Калькулятор лояльности: https://konturbiz.ru/pages/services/loyalty-calculator.html
- Руководство к калькулятору: https://konturbiz.ru/pages/services/loyalty-calculator-guide.html
- Оценка локации: https://konturbiz.ru/pages/services/location-assessment.html
- Заказ RC Pay: https://konturbiz.ru/pages/services/rc-pay-order.html

### Страницы решений
- Привлечение клиентов: https://konturbiz.ru/pages/solutions/acquisition.html
- Удержание клиентов: https://konturbiz.ru/pages/solutions/retention.html
- Автоматизация: https://konturbiz.ru/pages/solutions/automation.html
- Аналитика: https://konturbiz.ru/pages/solutions/analytics.html
- Инфраструктура: https://konturbiz.ru/pages/solutions/infrastructure.html

### Другие важные URL
- Отрасли: https://konturbiz.ru/pages/industries/
- Малый бизнес: https://konturbiz.ru/pages/industries/small-business.html
- Розница: https://konturbiz.ru/pages/industries/retail.html
- HoReCa: https://konturbiz.ru/pages/industries/ho-re-ca.html
- Услуги: https://konturbiz.ru/pages/industries/services.html
- Диагностика: https://konturbiz.ru/pages/diagnostics/
- Цифровой портрет: https://konturbiz.ru/pages/diagnostics/digital-portrait.html
- GEO-аудит: https://konturbiz.ru/pages/diagnostics/geo-audit.html
- KONTURSCAN: https://konturbiz.ru/pages/diagnostics/konturscan.html
- Партнёры: https://konturbiz.ru/pages/partners/
- SKB Контур: https://konturbiz.ru/pages/partners/kontur/
- RC CITY / Русский цифровой: https://konturbiz.ru/pages/partners/rcbiz/
- RC PAY: https://konturbiz.ru/pages/partners/rc-pay/
- Партнёрская модель RC: https://konturbiz.ru/pages/partners/rc-franchise/

## Уже известные данные Wordstat

Данные предоставлены пользователем ранее. Точная дата выгрузки и регион в текущем наборе не подтверждены — считать предварительными до повторной проверки.

| Запрос | Частотность |
|---|---:|
| автоматизация бизнеса | 12100 |
| автоматизация бизнес процессов | 5696 |
| автоматизация продаж | 2300 |
| автоматизация отдела продаж | 317 |
| автоматизация воронки продаж | 125 |
| программа для учета клиентов | 310 |
| CRM | 209341 |
| CRM это | 33005 |
| CRM система что это такое | 9106 |
| CRM для бизнеса | 1552 |
| CRM для малого бизнеса | 734 |
| CRM система для малого бизнеса | 295 |
| CRM для бизнеса бесплатно | 135 |
| внедрение CRM для бизнеса | 101 |
| автоматизация бизнеса с ии | 616 |
| ии автоматизация бизнес процессов | 476 |
| автоматизация продаж с помощью ии | 12 |
| автоматизация | 500241 |

Важно: запрос «автоматизация» слишком широкий и загрязнён другими интентами; не использовать его как показатель чистого спроса на автоматизацию бизнеса. «CRM» тоже очень широкий запрос. Сравнивать значения только при одинаковой методике и регионе.

## Чего пока не хватает для полноценного выбора тем

1. Свежая выгрузка Wordstat с регионом, периодом и одинаковой методикой.
2. Экспорт Яндекс Вебмастера: запросы, показы, клики, CTR, позиции, URL.
3. Google Search Console (если доступна): запросы, показы, клики, страницы.
4. По возможности — выгрузка коммерческих URL с Title, Description, H1, robots и статусом индексации.
5. Список приоритетных услуг/маржинальности, если бизнес хочет оптимизировать не только трафик, но и лиды.

Пока этих данных нет, строить первую версию плана по существующему покрытию и известным Wordstat-данным, но явно отмечать низкую/среднюю уверенность и не выдавать гипотезы за подтверждённый спрос.
