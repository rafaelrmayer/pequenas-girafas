import {DRAWING_WIDTH as W,DRAWING_HEIGHT as H} from './model.mjs';
export function setupDrawing({changed}){
 const el=id=>document.getElementById(id),canvas=el('story-drawing'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 let undo=[],pointer=null,last=null,down=false,enabled=true,epoch=0,x=W/2,y=H/2;
 const announce=text=>{el('story-drawing-status').textContent=text;};
 function controls(){el('story-draw-undo').disabled=!enabled||!undo.length;el('story-draw-clear').disabled=!enabled;canvas.setAttribute('aria-disabled',String(!enabled));}
 function remember(){undo.push(ctx.getImageData(0,0,W,H));undo=undo.slice(-10);controls();}
 function cursor(){el('story-draw-cursor').setAttribute('cx',String(x));el('story-draw-cursor').setAttribute('cy',String(y));}
 function draw(a,b){const eraser=el('story-draw-tool').value==='eraser';ctx.globalCompositeOperation=eraser?'destination-out':'source-over';ctx.strokeStyle=el('story-draw-color').value;ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=Number(el('story-draw-width').value)*(eraser?2:1);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(a.x===b.x&&a.y===b.y){ctx.beginPath();ctx.arc(b.x,b.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}changed();}
 function point(event){const box=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(W,(event.clientX-box.left)*W/box.width)),y:Math.max(0,Math.min(H,(event.clientY-box.top)*H/box.height))};}
 function cancel(){down=false;last=null;if(pointer!==null){const id=pointer;pointer=null;if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}}
 canvas.addEventListener('pointerdown',event=>{if(!enabled||pointer!==null||!event.isPrimary||event.button!==0)return;event.preventDefault();canvas.focus();remember();pointer=event.pointerId;canvas.setPointerCapture(pointer);last=point(event);x=last.x;y=last.y;cursor();draw(last,last);});
 canvas.addEventListener('pointermove',event=>{if(!enabled||event.pointerId!==pointer||!last)return;event.preventDefault();const next=point(event);draw(last,next);last=next;x=next.x;y=next.y;cursor();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{if(event.pointerId===pointer)cancel();});
 canvas.addEventListener('keydown',event=>{
  if(!enabled)return;const deltas={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};
  if(deltas[event.key]){event.preventDefault();const before={x,y};x=Math.max(0,Math.min(W,x+deltas[event.key][0]));y=Math.max(0,Math.min(H,y+deltas[event.key][1]));if(down)draw(before,{x,y});cursor();}
  else if(event.key==='Enter'||event.key===' '){event.preventDefault();if(event.repeat)return;down=!down;if(down){remember();draw({x,y},{x,y});}announce(down?'Pincel abaixado. Use as setas para desenhar. Enter ou Espaço levanta o pincel.':'Pincel levantado. As setas movem o ponto sem desenhar.');}
  else if(event.key==='Escape'){event.preventDefault();cancel();announce('Pincel levantado. Você pode sair da área com Tab.');}
 });
 canvas.addEventListener('blur',cancel);
 for(const id of ['story-draw-tool','story-draw-color','story-draw-width'])el(id).addEventListener('change',()=>{cancel();announce('Ferramenta alterada. O desenho foi preservado.');});
 el('story-draw-undo').addEventListener('click',()=>{if(!enabled||!undo.length)return;cancel();ctx.putImageData(undo.pop(),0,0);controls();changed();announce('Último traço ou limpeza desfeito.');});
 el('story-draw-clear').addEventListener('click',()=>{if(!enabled)return;cancel();remember();ctx.clearRect(0,0,W,H);changed();announce('Desenho limpo. Você pode desfazer.');});
 cursor();controls();
 return {snapshot:()=>canvas.toDataURL('image/png'),cancel,setEnabled(value){enabled=value;cancel();controls();},async load(source){
  const token=++epoch;cancel();undo=[];ctx.clearRect(0,0,W,H);controls();x=W/2;y=H/2;cursor();
  if(source){const image=new Image();image.src=source;await image.decode();if(token!==epoch)return;ctx.globalCompositeOperation='source-over';ctx.drawImage(image,0,0,W,H);}
  announce('Desenho pronto para editar.');
 },reset(){epoch++;cancel();undo=[];ctx.clearRect(0,0,W,H);x=W/2;y=H/2;cursor();controls();announce('');}};
}
