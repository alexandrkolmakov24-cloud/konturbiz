export function scoreAnswers(answers, questions, rules){
  const scale=rules.scale||{yes:1,system:1,high:1,edo:1,yes:1,partial:.5,medium:.5,mixed:.5,low:.25,email:.25,manual:.2,paper:0,lost:0,none:0,no:0,logo:.25,unknown:.25};
  const cats={};
  for(const q of questions){const v=answers[q.id]; if(v==null) continue; const cat=q.category||'other'; if(!cats[cat])cats[cat]={sum:0,max:0,count:0}; const n=typeof v==='number'?v:(scale[v]??0); cats[cat].sum+=n; cats[cat].max+=1; cats[cat].count++}
  const profile={}; for(const [k,v] of Object.entries(cats)) profile[k]=Math.round((v.max?v.sum/v.max:0)*100);
  return {profile,categories:cats};
}
export function rankIssues(answers,rules){
 const out=[]; for(const [category,items] of Object.entries(rules.categoryWeights||{})){let score=0; for(const [qid,vals] of Object.entries(items)){const v=answers[qid]; if(v!=null) score+=vals[v]||0} out.push({category,score})} return out.sort((a,b)=>b.score-a.score);
}
export function chooseBranding(answers,rules,products){
 let best={id:'brand-audit',score:0}; for(const rule of rules.brandingRules||[]){let s=0;for(const [q,v,w] of rule.when){if(answers[q]===v)s+=w}if(s>best.score)best={id:rule.product,score:s}} return products.find(x=>x.id===best.id)||products[0];
}
export function chooseKontur(answers,rules,products){
 let best={id:'diadoc',score:0}; for(const rule of rules.konturRules||[]){let s=0;for(const [q,v,w] of rule.when){if(answers[q]===v)s+=w}if(s>best.score&&s>=rule.min)best={id:rule.product,score:s}} return products.find(x=>x.id===best.id)||products.find(x=>x.id==='diadoc')||products[0];
}
