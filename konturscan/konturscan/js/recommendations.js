import {chooseBranding,chooseKontur} from './scoring.js';
export function buildRecommendations(answers,products,rules,diagnosis){
 const loyalty=products.loyalty;
 const branding=chooseBranding(answers,rules,products.branding);
 const kontur=chooseKontur(answers,rules,products.kontur);
 const reasons={
  loyalty:`В ответах есть сигналы по повторным продажам, клиентской базе или регулярной коммуникации. Поэтому первая рекомендация направлена на превращение удержания клиентов из отдельных действий в управляемый процесс.`,
  branding:`Ответы указывают на разрыв между текущими материалами бренда и единой системой коммуникации. Рекомендация направлена на устранение этого разрыва и повышение последовательности восприятия бизнеса.`,
  kontur:`В ответах обнаружена операционная задача, которую можно решать профильным цифровым инструментом. Рекомендация выбрана по совпадению с отмеченной проблемой, а не как общий каталог продукта.`
 };
 return [
  {category:'Лояльность и удержание клиентов',...loyalty,reason:reasons.loyalty},
  {category:'Брендинг',...branding,reason:reasons.branding},
  {category:'СКБ Контур',...kontur,reason:reasons.kontur}
 ];
}
