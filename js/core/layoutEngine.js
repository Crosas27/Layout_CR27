export function generateLayout(config){

const wallLength=Number(config.wallLength)||0
const panelCoverage=Number(config.panelCoverage)||0
const openings=config.openings||[]

const ribs=calculateRibs(
wallLength,
Number(config.ribSpacing)||0,
Number(config.startOffset)||0
)

const basePanels=calculatePanels(wallLength,panelCoverage)

const panels=splitPanels(basePanels,openings)

return{
...config,
wallLength,
panels,
ribs,
openings
}

}

function calculateRibs(length,spacing,start){

const ribs=[]

let pos=start

while(pos<=length){

ribs.push({position:pos})

pos+=spacing

}

return ribs

}

function calculatePanels(length,coverage){

const panels=[]

let pos=0
let i=1

while(pos<length){

panels.push({
panel:i,
start:pos,
end:Math.min(pos+coverage,length),
type:"full"
})

pos+=coverage
i++

}

return panels

}

function splitPanels(panels,openings){

let result=[]

panels.forEach(panel=>{

let segments=[panel]

openings.forEach(opening=>{

segments=segments.flatMap(seg=>{

const overlap=
seg.start<opening.end &&
seg.end>opening.start

if(!overlap) return [seg]

let parts=[]

if(seg.start<opening.start){

parts.push({
start:seg.start,
end:opening.start,
type:"cut"
})

}

parts.push({
start:opening.start,
end:opening.end,
type:"opening"
})

if(seg.end>opening.end){

parts.push({
start:opening.end,
end:seg.end,
type:"cut"
})

}

return parts

})

})

result.push(...segments)

})

return result

}
