export function buildDiagnosis(answers,score,issues){
 const labels={loyalty:'удержание клиентов',brand:'бренд и коммуникация',processes:'процессы и автоматизация',analytics:'данные и аналитика',kontur:'документооборот и операционные инструменты',security:'защита данных',improvement:'постоянное улучшение'};
 const main=issues[0]||{category:'processes',score:0};
 const category=labels[main.category]||'цифровая организация бизнеса';
 const profile=Object.entries(score.profile).sort((a,b)=>a[1]-b[1]);
 return {mainCategory:main.category,mainLabel:category,mainScore:main.score,weakest:profile.slice(0,3),summary:`Основная зона внимания сейчас — ${category}. Ответы показывают, что именно здесь есть наиболее заметный разрыв между текущим состоянием бизнеса и системным способом работы.`,facts:profile.map(([k,v])=>({category:k,score:v}))};
}
