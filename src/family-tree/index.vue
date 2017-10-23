<style scoped>
#cols{
	display:flex;
	text-align:center;
	flex-direction: row;
	width:80%;
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
	align-items: center;
	justify-content: center;
	flex-grow:1;
	color:steelblue;
	border:1px solid lightgrey;
}
.female{
	color:#f9a4ad;
}
</style>

<template>
  <div id="cols">
		<div id="col" v-for="arr in data" style="flex-grow:1;">
		  <div class="person" v-for="name,i in arr" v-bind:class="{ female: i%2===0 }">
	      {{ name }}
				<svg width="100%" height="100%" style="position:absolute;">
			    <line x1="50%" y1="50%" x2="100%" y2="75%" stroke-width="2" stroke="lightgrey"/>
			    <line x1="50%" y1="50%" x2="100%" y2="25%" stroke-width="2" stroke="lightgrey"/>
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
