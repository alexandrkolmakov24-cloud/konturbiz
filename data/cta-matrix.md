# Матрица CTA KONTURBIZ (MVP, 11.09.2026)

Правила: TYPE A = заявка contacts; TYPE B = RC ref; TYPE C = kontur.ru ?p=f76143. KONTURSCAN только если задача неясна.

| URL | TYPE | Primary | Secondary | Forbidden |
|-----|------|---------|-----------|-----------|
| / | A-hub | solutions / diagnostics | contacts | — |
| /pages/services/digital-audit.html | A | contacts?from=audit | RC PAY | konturscan primary |
| /pages/services/crm.html | A | contacts?from=crm | RC CITY | — |
| /pages/services/loyalty.html | A | contacts?from=loyalty | RC CITY | — |
| /pages/services/location-assessment.html | A | contacts?from=location-assessment | #pricing | — |
| /pages/services/index.html | A | список услуг | KONTURSCAN в «не знаю» | — |
| /pages/solutions/acquisition.html | A | digital-audit / web-dev | KONTURSCAN | diag on every card |
| /pages/solutions/retention.html | A | loyalty / crm | RC CITY | — |
| /pages/solutions/automation.html | A | crm / bots | KONTURSCAN | — |
| /pages/solutions/analytics.html | A | crm / audit | RC CITY | — |
| /pages/solutions/infrastructure.html | A | site / crm | KONTURSCAN | — |
| /pages/solutions/ | A | карточки направлений | diagnostics в конце | — |
| /pages/partners/kontur/ | C | ref kontur products | hub anchors | contacts primary, konturscan |
| /pages/partners/kontur/elba/ | C | ref elba f76143 | kontur hub | contacts, diagnostics primary |
| /pages/partners/rc-pay/ | B | ref RC PAY | — | contacts as primary |
| /pages/partners/rc-franchise/ | B | ref franchise promo | rc-pay | contacts primary |
| /pages/partners/rdo/ | B/partner | модель RDO | — | смешивать с Контур |
| /pages/partners/ | hub | kontur / rc / rdo | — | — |
| /pages/knowledge/ | knowledge | navigator | A/B/C by sense | empty article cards |
| /pages/diagnostics/konturscan.html | entry | scan flow | contacts | as only site CTA |
| /pages/about/contacts.html | A | form | — | — |
| /pages/about/legal.html | info | — | — | — |

Реф-константы:
- Kontur: `?p=f76143&from=ref_cabinet`
- RC PAY: https://rcpay.ru/r/ZRBEDA8S
- RC CITY: https://rc.city/register-code?code=LYHHKKRK
- RC Franchise: https://panel.rc.company/registration?promocode=LYHHKKRK
