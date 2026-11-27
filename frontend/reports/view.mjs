import {buildReport} from './summary.mjs';
import {localDay} from '../ai/adaptive-learning/engine.mjs';
export function setupReport({catalog,readSnapshot,stopAudio}){
 const el=id=>document.getElementById(id);let epoch=0,previewSnapshot=null;
 const text=(tag,value,className='')=>{const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;};
 const fingerprint=snapshot=>JSON.stringify({events:snapshot.events,persisted:snapshot.persisted});
 const status=message=>{if(el('report-status').textContent!==message)el('report-status').textContent=message;};
 function cleanPrint(){document.getElementById('report-print-root')?.remove();document.body.classList.remove('printing-report');}
 function invalidate(message){
  const visible=!el('report-preview').hidden,busy=el('generate-report').disabled;epoch++;previewSnapshot=null;el('report-preview').replaceChildren();el('report-preview').hidden=true;el('print-report').disabled=true;el('generate-report').disabled=false;cleanPrint();
  if(message||visible||busy)status(message||'Os registros ou preferências mudaram. Gere uma nova prévia antes de imprimir.');
 }
 el('report-theme').replaceChildren(new Option('Todos os temas','all'),...catalog.themes.map(theme=>new Option(theme.label,theme.id)));
 const today=localDay(),monthAgo=new Date();monthAgo.setDate(monthAgo.getDate()-30);
 el('report-from').value=localDay(monthAgo);el('report-to').value=today;
 el('report-from').max=today;el('report-to').max=today;
 function filters(){return {themeId:el('report-theme').value,period:el('report-period').value,from:el('report-from').value,to:el('report-to').value,includeUndated:el('report-undated').checked};}
 function rows(title,values,undated){
  const section=document.createElement('section');section.append(text('h4',title));
  if(!values.length){section.append(text('p','Nenhuma conclusão incluída nesta seção. Ausência de registro não é dificuldade.'));return section;}
  for(const row of values){
   const article=document.createElement('article');article.className='report-row';article.dataset.wordId=row.wordId;article.dataset.activity=row.activity;
   article.append(text('h5',row.word+' — '+row.activityLabel),text('p',row.theme));
   const list=document.createElement('dl');list.className='report-measures';
   for(const [label,value] of [['Conclusões',row.completions],['Sem pistas registradas',row.independent],['Com apoio registrado',row.assisted],['Apoio não informado',row.unknownSupport],['Pista solicitada',row.hints],['Uso de pistas não informado',row.unknownHints],['Áudio solicitado',row.audioRequested],['Uso de áudio não informado',row.unknownAudio]]){
    const pair=document.createElement('div');pair.append(text('dt',label),text('dd',String(value)));list.append(pair);
   }
   article.append(list,text('p',undated?'Sem data válida. Estes registros não são atribuídos ao período escolhido.':`Primeiro registro datado: ${row.firstDay}. Último: ${row.lastDay}. Dias locais com conclusões: ${row.days.length}.`));section.append(article);
  }return section;
 }
 async function generate(event){
  event.preventDefault();invalidate();const token=epoch;el('generate-report').disabled=true;status('Preparando a prévia neste dispositivo…');
  try{
   const snapshot=await readSnapshot();if(token!==epoch)return;
   const report=buildReport({catalog,events:snapshot.events,today:localDay(),...filters()});
   const title=text('h3','Pequenas Girafas — Relatório local de exploração');title.id='report-preview-title';
   el('report-preview').append(title,text('p','Gerado em '+report.generatedOn+'. Tema: '+report.theme+'. Período: '+report.period+'.'),
    text('p',`${report.datedCount} conclusões datadas no período; ${report.days.length} dias locais com registros. ${report.undatedCount} conclusões sem data exibidas separadamente.`),
    text('p',snapshot.persisted?'Prévia dos registros disponíveis neste navegador.':'Armazenamento indisponível: esta prévia inclui registros que estão apenas na memória da sessão.'),
    text('p','O aplicativo mantém até 200 registros recentes neste perfil de navegador. Não há identificação individual; se o perfil for compartilhado, os registros podem reunir mais de uma pessoa.'),
    rows('Registros datados no período',report.datedRows,false));
   if(report.includeUndated)el('report-preview').append(rows('Registros sem data válida — fora da atribuição de período',report.undatedRows,true));
   const omitted=report.excluded;
   el('report-preview').append(text('h4','Informações não incluídas'),text('p',`${omitted.future} registros com data posterior à geração; ${omitted.outsidePeriod} fora do período; ${omitted.undated} sem data omitidos pela seleção; ${omitted.unrecognized} conclusões sem palavra ou atividade reconhecida no catálogo.`),
    text('h4','Como interpretar'),text('p','Contagens descrevem registros, não domínio, retenção, inteligência ou capacidade. As três atividades são distintas. Registros sem informação sobre apoio, pistas ou áudio não são tratados como ausência de apoio.'),
    text('p','Dias diferentes não comprovam aprendizagem ou generalização. Não registramos se uma conclusão veio do botão Revisitar; este documento não identifica revisitas realizadas nem contém notas ou comparação entre crianças.'),
    text('p','As imagens, atividades e regras são experimentais e aguardam revisão pedagógica. Documento gerado localmente, sem envio ao servidor. Cópias impressas ou PDFs ficam sob seu controle e não são apagados pelo aplicativo.'));
   previewSnapshot=fingerprint(snapshot);el('report-preview').hidden=false;el('print-report').disabled=false;status('Prévia pronta. Confira o conteúdo antes de imprimir ou salvar em PDF.');el('report-preview').focus();
  }catch(error){if(token===epoch)status(error.message||'Não foi possível gerar a prévia.');}
  finally{if(token===epoch)el('generate-report').disabled=false;}
 }
 el('report-form').addEventListener('submit',generate);
 for(const id of ['report-theme','report-period','report-from','report-to','report-undated'])el(id).addEventListener('change',()=>{
  el('report-dates').disabled=el('report-period').value!=='range';invalidate('Filtros alterados. Gere uma nova prévia.');
 });
 el('clear-report').addEventListener('click',()=>{invalidate('Prévia removida desta página. Os registros de atividades permanecem no dispositivo.');el('generate-report').focus();});
 el('print-report').addEventListener('click',async()=>{
  if(!previewSnapshot)return;const token=epoch;el('print-report').disabled=true;
  try{
   const current=await readSnapshot();if(token!==epoch)return;
   if(fingerprint(current)!==previewSnapshot){invalidate('Os registros mudaram em outra atualização. Gere e confira uma nova prévia.');return;}
   stopAudio();cleanPrint();const copy=el('report-preview').cloneNode(true);
   for(const node of [copy,...copy.querySelectorAll('[id]')])node.removeAttribute('id');
   copy.id='report-print-root';copy.removeAttribute('aria-labelledby');copy.removeAttribute('tabindex');copy.hidden=true;document.body.append(copy);document.body.classList.add('printing-report');
   window.addEventListener('afterprint',cleanPrint,{once:true});window.print();status('Impressão solicitada. Escolha Salvar em PDF no navegador, se disponível; cancelar não altera os registros.');
  }catch(error){cleanPrint();status(error.message||'Não foi possível abrir a impressão.');}
  finally{if(token===epoch&&previewSnapshot)el('print-report').disabled=false;}
 });
 return {invalidate};
}
