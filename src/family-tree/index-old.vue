<style scoped>
#cols{
	display:flex;
	text-align:center;
	flex-direction: row;
	width:100%;
	flex:1;
	height:600px;
}
#col{
	flex:1;
	display:flex;
	flex-direction: column;
}
.person{
	display:flex;
	position:relative;
	flex-direction: column;
	/*border:1px solid lightgrey;*/
	justify-content: center;
	flex-grow:1;
	color:steelblue;
	justify-content: center;
	text-align:left;
	font-size:12px;
}
.name{
	max-width:100px;
	white-space:nowrap;
}
.female{
	color:#f9a4ad;
}
@media (max-width: 700px) {
	.person{
		font-size:10px;
	}
	.lines{
		opacity:0.5;
	}
}
</style>

<template>
  <div id="cols">
		<div id="col" v-for="arr,g in data" style="flex-grow:1;">
		  <div class="person" v-for="o,i in arr" >
	      <div class="name">
					<span class="">{{ o.names[1] }}</span> +
					<span class="female">{{ o.names[0] }}</span>
					</div>
				<svg class="lines" width="100%" height="100%" v-if="g<4" style="position:absolute; top:0px; left:0px;">
			    <line x1="60%" y1="50%" x2="90%" y2="25%" stroke-width="2" stroke="#e6eeef"/>
			    <line x1="60%" y1="50%" x2="90%" y2="75%" stroke-width="2" stroke="#e6eeef"/>
			  </svg>
	    </div>
	  </div>
	</div>
</template>

<script>
import treeData from './tree.js';

export default {
  name: 'tree',
  data() {
    return {
      data: treeData,
			widths:[15,45,60,75,100]
    };
  }
};
</script>
