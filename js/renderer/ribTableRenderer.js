import { formatToField } from "../utils/formatter.js"

export function renderRibTable(model){

const el=document.getElementById("ribTable")

let html=""

html+=`<strong>Wall Length:</strong> ${formatToField(model.wallLength)}<br><br>`

html+="<strong>Panels</strong><br>"

model.panels.forEach((p,i)=>{

const width=p.end-p.start

if(p.type==="opening"){

html+=`Panel ${i+1} — Opening<br>`

}else if(p.type==="cut"){

html+=`Panel ${i+1} — Cut ${formatToField(width)}<br>`

}else{

html+=`Panel ${i+1} — Full<br>`

}

})

el.innerHTML=html

}
