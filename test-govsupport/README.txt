ТЕСТ: ПОДБОР ГОСПОДДЕРЖКИ ПО ИНН
================================

Заливка
-------
1. Создайте папку test-govsupport в корне сайта (public_html).
2. Загрузите все файлы из этого архива:
   - index.html
   - proxy.php
   - .htaccess
   - grants.webp
   - README.txt
3. Откройте: https://ваш-сайт.ru/test-govsupport/

Что внутри
----------
- Красивый hero (grants.webp), блоки «Как работает», источники, FAQ (AEO/SEO)
- Рабочий скрипт подбора через proxy.php (API Новаторикса)
- Форма обратной связи (mailto → info@konturbiz.ru)
- Без header/footer, noindex

Hero
----
grants.webp лежит рядом с index.html.
Если хотите общий путь сайта — положите файл в /images/services/grants.webp
и в index.html замените url("grants.webp") на url("/images/services/grants.webp").

Важно
-----
Тест доступа к API. Перед публичным использованием на основном домене
нужно согласие владельца источника данных.
