// Curated relations only: unknown examples/actions/complements produce no suggestion.
export function continuationGroup(groups,exampleId){return groups.find(group=>group.exampleId===exampleId)??null;}
export function continuationChoice(group,actionId,complementId){
 return group?.actions.find(action=>action.id===actionId)?.complements.find(choice=>choice.id===complementId)??null;
}
export function continuationPhrase(base,group,actionId,complementId){
 if(!base||group?.exampleId!==base.id)return null;
 const choice=continuationChoice(group,actionId,complementId);
 return choice?{...base,id:choice.audioId,text:choice.text}:null;
}
