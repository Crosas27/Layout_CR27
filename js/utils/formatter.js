export function formatToField(inches){

const precision=8

const feet=Math.floor(inches/12)
const remaining=inches%12

let whole=Math.floor(remaining)
let frac=remaining-whole

let eighths=Math.round(frac*precision)

if(eighths===precision){

eighths=0
whole++

}

let f=feet
let i=whole

if(i===12){

f++
i=0

}

function gcd(a,b){

return b?gcd(b,a%b):a

}

let fraction=""

if(eighths>0){

const d=gcd(eighths,precision)
const num=eighths/d
const den=precision/d

fraction=` ${num}/${den}`

}

return `${f}' ${i}${fraction}"`

}
