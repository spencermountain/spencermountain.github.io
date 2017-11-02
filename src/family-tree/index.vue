<style scoped>
#tree {
	flex:1;
	min-height:400px;
	/*border:1px solid grey;*/
	position:relative;
}
.couple{
	position:absolute;
	font-size:9px;
	color:grey;
	left:0px;
	top:0px;
	text-align:left;
	padding-left:10px;
}
.line{
	/*min-width:50px;*/
	position:absolute;
}
.female{
	border-bottom:3px solid #f4bcc2;
}
.male{
	border-bottom:3px solid lightsteelblue;
}
</style>

<template>
  <div id="tree">
		<div v-for="obj in couples">
			<div class="line female" v-bind:style="{ opacity:obj.opacity, left: obj.girl.start+'px', width:obj.girl.width+'px',top: (obj.y+10)+'px'}"/>
			<div class="line male" v-bind:style="{ opacity:obj.opacity, left: obj.guy.start+'px', width:obj.guy.width+'px',top: (obj.y+13)+'px'}"/>
			<!-- <div class="person" v-bind:class="{ female: p.sex==='f' }" v-bind:style="{ left: p.x+'px', top: p.y+'px', 'min-width':p.width+'px'}"> -->
			<div class="couple" v-bind:style="{ left: obj.x+'px', top: obj.y+'px'}">
				{{ `${obj.names[1]}+${obj.names[0]}` }}
				<!-- <svg >
					<line v-bind:x1="{obj.x}" v-bind:x2="{obj.x+20}" v-bind:y1="{obj.y}" v-bind:y2="{obj.y}" fill="grey"/>
				</svg> -->
			</div>
		</div>
  </div>
</template>

<script>
import { scaleLinear } from 'd3-scale';
import treeData  from './tree-data';
let height=200
let xScale=scaleLinear().range([0,900]).domain([1985, 1790])
let yScale=scaleLinear().range([0,height]).domain([-5, 5])

let couples=[]
// const widths=[0,81,45,18]//4gens
const widths=[0,120,60,30,15]//5gens
const doCouple=function(girl, guy, gen,y){
	let start=girl.birth||guy.birth
	if(guy.birth<girl.birth){
		start=guy.birth
	}
	let arrow={}
	if(gen<5 && girl.mom.name){
 		arrow={
			mom:xScale(girl.mom.birth),
			dad:xScale(girl.dad.birth),
		}

	}
	if(!guy.death){
		console.log(guy.name)
	}
	if(!girl.death){
		console.log(girl.name)
	}
	let opacity=1
	if(gen>4){
		opacity=0.5
	}
	couples.push({
		names:[girl.name.split(' ')[0], guy.name.split(' ')[0]],
		x:xScale(start),
		y:y,
		guy:{
			start:xScale(guy.birth),
			width:xScale(guy.birth)-xScale(guy.death)
		},
		girl:{
			start:xScale(girl.birth),
			width:xScale(girl.birth)-xScale(girl.death)
		},
		opacity:opacity,
		arrow:arrow
	})
	if(gen<5 && girl.mom.name){
		let half=widths[gen]//parseInt((height/gen)/2)
		doCouple(girl.mom, girl.dad, gen+1, y+half)
		doCouple(guy.mom, guy.dad, gen+1, y-half)
	}
}
doCouple(treeData.mom, treeData.dad,1,250)

export default {
  name: 'FamilyTree',
  data() {
	  return {
			couples:couples
		}
  }
};
</script>
