/* FUTURE FEATURE TRACKER
   Global Measurement Config
   measurementMode = "field" | "decimal" | "engineering"
*/

function roundToEighth(value){
return Math.round(value*8)/8
}

function getFraction(decimal){

const map={
0.125:"1/8",
0.25:"1/4",
0.375:"3/8",
0.5:"1/2",
0.625:"5/8",
0.75:"3/4",
0.875:"7/8"
}

return map[Number(decimal.toFixed(3))] || ""

}

function formatFeetInches(inches){

const rounded=roundToEighth(inches)

const feet=Math.floor(rounded/12)
const remainder=rounded%12

const whole=Math.floor(remainder)
const fracVal=remainder-whole
const frac=getFraction(fracVal)

if(whole===0 && !frac) return `${feet}’`

if(frac && whole>0) return `${feet}’ ${whole} ${frac}”`
if(frac) return `${feet}’ ${frac}”`

return `${feet}’ ${whole}”`

}

function formatTotal(inches){

const rounded=roundToEighth(inches)

const whole=Math.floor(rounded)
const fracVal=rounded-whole
const frac=getFraction(fracVal)

if(frac && whole>0) return `${whole} ${frac}”`
if(frac) return `${frac}”`

return `${whole}”`

}

export function formatToField(inches){

if(inches===null || inches===undefined) return ""

return `${formatFeetInches(inches)} (${formatTotal(inches)})`

}
