const NS="http://www.w3.org/2000/svg"

export function setupSvg(svg,width,height){

svg.innerHTML=""

svg.setAttribute("viewBox",`0 0 ${width} ${height}`)
svg.setAttribute("width","100%")
svg.setAttribute("height",height)

}

export function getDrawArea(width,height,margin=60){

return{
margin,
drawWidth:width-margin*2,
drawHeight:height-margin*2
}

}

export function drawRect(svg,x,y,w,h,className){

const rect=document.createElementNS(NS,"rect")

rect.setAttribute("x",x)
rect.setAttribute("y",y)
rect.setAttribute("width",w)
rect.setAttribute("height",h)

if(className) rect.setAttribute("class",className)

svg.appendChild(rect)

}

export function drawLine(svg,x1,y1,x2,y2,className){

const line=document.createElementNS(NS,"line")

line.setAttribute("x1",x1)
line.setAttribute("y1",y1)
line.setAttribute("x2",x2)
line.setAttribute("y2",y2)

if(className) line.setAttribute("class",className)

svg.appendChild(line)

}

export function drawText(svg,x,y,text){

const t=document.createElementNS(NS,"text")

t.setAttribute("x",x)
t.setAttribute("y",y)
t.setAttribute("text-anchor","middle")

t.textContent=text

svg.appendChild(t)

}

export function drawGrid(svg,width,height,spacing=40){

const NS="http://www.w3.org/2000/svg"

const grid=document.createElementNS(NS,"g")
grid.setAttribute("opacity","0.12")

for(let x=0;x<=width;x+=spacing){

const line=document.createElementNS(NS,"line")

line.setAttribute("x1",x)
line.setAttribute("y1",0)
line.setAttribute("x2",x)
line.setAttribute("y2",height)

line.setAttribute("stroke","#8fa3b0")

grid.appendChild(line)

}

for(let y=0;y<=height;y+=spacing){

const line=document.createElementNS(NS,"line")

line.setAttribute("x1",0)
line.setAttribute("y1",y)
line.setAttribute("x2",width)
line.setAttribute("y2",y)

line.setAttribute("stroke","#8fa3b0")

grid.appendChild(line)

}

svg.appendChild(grid)

}
