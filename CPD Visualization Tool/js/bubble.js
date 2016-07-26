var dataset;
var datatable;

var selectedYear= "";
var selectedQuestion= "";
sentiment = ["Very Positive","Very Negative"];


var diameter = 960,
    format = d3.format(",d"),
    color = d3.scale.category20c();

var bubble = d3.layout.pack()
    .sort(function(a, b) {
    return -(a.value - b.value);
}
)
    .size([700, 400])
    .padding(1.5);

var svg = d3.select("#bubble").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

 var svg1 = d3.select("#mylegend").append("svg").attr("id","legendCanvas");


function updateBubble(variable,id){

if(variable=="year"){
	selectedYear=id;
}
if(variable=="question"){
	selectedQuestion=id;
}
console.log(selectedYear);
console.log(selectedQuestion);
if(selectedYear!="" && selectedQuestion!=""){
d3.json("flare.json", function(error, root) {
  if (error) throw error;

var indicesToRemove = [];
for(k=0;k<root.children.length;k++){
if(root.children[k].year!=selectedYear||root.children[k].question!=selectedQuestion){
indicesToRemove.push(k);
}
}
for (var i = indicesToRemove.length -1; i >= 0; i--){
   root.children.splice(indicesToRemove[i],1);
   }
svg.selectAll(".node").remove();


var node = svg.selectAll(".node")
      .data(bubble.nodes(classes(root))
      .filter(function(d) { return !d.children; }),
	  function(d) {return d.className} // key data based on className to keep object constancy
        )
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

var linear = d3.scale.linear();
var colorbrewerSize = 5;
var colorbrewerCoef = 1;
var color = d3_scale.scaleLinear()
            .domain([-2,2])
			.range(["lightcoral","steelblue"]);
	  
 
 var linear = d3.scale.linear()
  .domain([-2,2])
  .range(["lightcoral", "steelblue"]);

svg1.append("g")
  .attr("class", "legendLinear")
  .attr("transform", "translate(0,20)");

var legendLinear = d3.legend.color()
  .shapeWidth(80)
  .shapeHeight(10)
  .cells([-2, -1, 0, 1, 2])
  .orient('horizontal')
  .scale(linear)
  .labels(["Very Negative", "Negative", "Neutral", "Positive", "Very Positive"])
  .labelAlign("start")
  .shapePadding(1);

svg1.select(".legendLinear")
  .call(legendLinear);    

  node.append("title")
      .text(function(d) { return d.className + ": " + format(d.value); });

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .style("fill", function(d) { return color(d.sentimentValue*colorbrewerCoef); })
	  .on("click", function(d) { return printName(d); })
      .style("cursor", "pointer")
	  

  node.append("text")
      .attr("dy", ".3em")
      .attr("class","bubbleText")
      .style("text-anchor", "middle")
      .text(function(d) { return d.className.substring(0, d.r / 3); });
	  
	  node.select("circle")
        .transition().duration(1000)
        .attr("r", function (d) {
            return d.r;
        })
        .style("fill", function (d, i) {
            return color((d.sentimentValue));
        });

    node.transition().attr("class", "node")
        .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    });
	  
//	node.exit().remove();
})
}
// Returns a flattened hierarchy containing all leaf nodes under the root.
function classes(root) {
  var classes = [];

  function recurse(name, node) {
    if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
    else classes.push({packageName: name, className: node.name, value: node.size, classComments:node.comments,sentimentValue:node.sentiment,year:node.year});
  }

  recurse(null, root);
  return {children: classes};

  }
}
function printName(d,i){
    var dataset = [];
    
    // Destory old instance of data table if it exists
    if ( $.fn.DataTable.isDataTable( '#myTable' ) ) {
        datatable.destroy();
    }
    
    // Create array rows for table
    for(k=0;k<d.classComments.length;k++){
        var row = [];
        row.push("<span id='commentCol'>".concat(d.classComments[k].comment, "</span>"));
        row.push(d.classComments[k].park_name);
        row.push(String(d.classComments[k].sentiment));
        dataset.push(row);
	}
    
    // Initialize data table
    datatable = $("#myTable").DataTable({
        data: dataset,
        columns: [
            {title: "Comment"},
            {title: "Park"},
            {title: "Sentiment"}
        ]
    });

}
