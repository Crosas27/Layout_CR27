import { updateLayout } from "../../app.js"

export function initUI(){

document.querySelectorAll("input,select")
.forEach(el=>{

el.addEventListener("input",updateLayout)

})

}
