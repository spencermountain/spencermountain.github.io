<style scoped>
#tree {
	flex:1;
	min-height:200px;
	border:1px solid grey;
	position:relative;
}
.person{
	position:absolute;
	font-size:11px;
	color:grey;
	left:0px;
	top:0px;
	border-bottom:2px solid lightsteelblue;
	min-width:50px;
	text-align:left;
	padding-left:10px;
}
.female{
	border-bottom:2px solid #f9a4ad;
}
</style>

<template>
  <div id="tree">
		<div v-for="p in people">
			<div class="person" v-bind:class="{ female: p.sex==='f' }" v-bind:style="{ left: p.x+'px', top: p.y+'px', 'min-width':p.width+'px'}">
				{{ p.name }}
			</div>
		</div>
  </div>
</template>

<script>
import { scaleLinear } from 'd3-scale';
import treeData  from './tree-data';
let height=70
let xScale=scaleLinear().range([0,900]).domain([1985, 1790])
let yScale=scaleLinear().range([0,height]).domain([-5, 5])

let people=[]
let obj=treeData
const doPerson=function(obj, gen, y, sex){
	obj.birth=obj.birth||1800
	let birth=xScale(obj.birth)
	let death=xScale(obj.birth+75)
	people.push({name:obj.name, x:birth, y:yScale(y), sex:sex, width:birth-death})
	if(gen>=3){
		return
	}
	if(obj.mom && obj.mom.name){
		gen+=1
		let space=height/(gen+1)
		console.log(space)
		let half=space/2
		doPerson(obj.mom,gen, y-half, 'f')
		doPerson(obj.dad,gen, y+half,'m')
	}
}
doPerson(treeData,0,50,'m')
console.log(people)


export default {
  name: 'Flower',
  props: ['word'],
  data() {
  return {
		people:people
	}
  }
};
</script>
