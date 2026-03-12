const NS = "http://www.w3.org/2000/svg"

/* ---------------------------- */
/* SVG Setup */
/* ---------------------------- */

export function setupSvg(svg, width, height){

svg.innerHTML=""

svg.setAttribute("viewBox",`0 0 ${width} ${height}`)
svg.setAttribute("width","100%")
svg.setAttribute("height",height)

}

/* ---------------------------- */
/* Draw Area */
/* ---------------------------- */

export function getDrawArea(width,height,margin=60){

return {

margin,
drawWidth:width - margin*2,
drawHeight:height - margin*2

}

}

/* ---------------------------- */
/* Scale */
/* ---------------------------- */

export function calculateScale(drawWidth,drawHeight,modelWidth,modelHeight){

const scaleX = drawWidth / modelWidth
const scaleY = drawHeight / modelHeight

return Math.min(scaleX,scaleY)

}

/* ---------------------------- */
/* Grid */
/* ---------------------------- */

export function drawGrid(svg,width,height,spacing=40){

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

/* ---------------------------- */
/* Line */
/* ---------------------------- */

export function drawLine(svg,x1,y1,x2,y2,className){

const line=document.createElementNS(NS,"line")

line.setAttribute("x1",x1)
line.setAttribute("y1",y1)
line.setAttribute("x2",x2)
line.setAttribute("y2",y2)

if(className) line.setAttribute("class",className)

svg.appendChild(line)

return line

}

/* ---------------------------- */
/* Rectangle */
/* ---------------------------- */

export function drawRect(svg,x,y,width,height,className){

const rect=document.createElementNS(NS,"rect")

rect.setAttribute("x",x)
rect.setAttribute("y",y)

rect.setAttribute("width",width)
rect.setAttribute("height",height)

if(className) rect.setAttribute("class",className)

svg.appendChild(rect)

return rect

}

/* ---------------------------- */
/* Text */
/* ---------------------------- */

export function drawText(svg,x,y,text,className,anchor="middle"){

const label=document.createElementNS(NS,"text")

label.setAttribute("x",x)
label.setAttribute("y",y)

label.setAttribute("text-anchor",anchor)

if(className) label.setAttribute("class",className)

label.textContent=text

svg.appendChild(label)

return label

}

/* ---------------------------- */
/* Dimension Line */
/* ---------------------------- */

export function drawDimension(svg,x1,x2,y,text){

/* main dimension line */

drawLine(svg,x1,y,x2,y,"dimension-line")

/* left tick */

drawLine(svg,x1,y-6,x1,y+6,"dimension-line")

/* right tick */

drawLine(svg,x2,y-6,x2,y+6,"dimension-line")

/* label */

drawText(
svg,
(x1+x2)/2,
y-8,
text,
"dimension-text"
)

}
