// Define a variable containing the count of selected parks
var num_parks = 2;

// Define a variable equal to the number of response categories
// for the particular question. This is used to calculate which
// park name should be underlined when a user hoveres over a 
// segment of the bar chart.
var num_cat = 3;

// Which category is aligned at the reference line?
// Affects offset values
var baseline = 1;

// Stores the ids of non-hovered segments
// Used for selective css animations
var nonHoverPlots = [];

// List of years to be plotted
var years = []

// ID of selected question
var question_ID = 'Q1';

// Separate list of names is kept each year
var park_names = ['Overall Avg'];

var selected_park_names = ['Overall Avg'];

// Object containing the question response categories
var responses = ['Low','Medium', 'High'];

// Object to hold the ordered likert responses
var likertResponses = {};

// List of colors used for bar chart
var colors = [];

// Color palette for diverging likert questions
var divColorPalettes = {
    2: ['#ca0020','#0571b0'],
    4:['#ca0020', '#f4a582','#92c5de','#0571b0']
}

// Color palette for categorical responses
var catColorPalettes = {
     2:['#8dd3c7','#ffffb3'],
    3:['#8dd3c7','#ffffb3','#bebada'],
    4:['#8dd3c7','#ffffb3','#bebada','#fb8072'],
    5:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3'],
    6:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462'],
    7:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69'],
    8:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5'],
    9:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9'],
    10:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd'],
    11:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5'],
    12:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'],
    13:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f','#dad68b'],
    14:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f','#dad68b','#74d0dc'],
    15:['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f','#dad68b','#74d0dc','#e85ee3'],
}

// Object mapping years to question/park/response JSON objects
var yearObjects;

// Global list of all questions IDs
var question_IDs = [];

//

// This is the global JSON object of all questions and subquestions
var main_questions = {};

// Flag to determine what type of chart should be drawn
var diverge = true;

// List of question types that will be given a divergent color scheme in the bar chart
var divergentTypes = ['YN','HS','HSO','YNO','S']

// This will hold a collection of series objects
// There will be num_cat*num_parks of them
var series;
//var series = [{
//        values:[10,10,10],
//        "offset-values":[0,0,0],
//        stack:1,
//        'background-color':'sandybrown'
//      },
//      {
//        values:[50,50,50],
//        "offset-values":[0,0,0],
//        stack:1,
//        'background-color': 'lemonchiffon'
//      },
//      {
//        values:[40,40,40],
//       "offset-values":[0,0,0],
//       stack:1,
//       'background-color': 'steelblue'
//      },
//      {
//        values:[33.3,55,10],
//          
//        "offset-values":[0,0,0],
//        
//        stack:2,
//        "background-color": 'sandybrown'
//      },
//      {
//        values:[33.3,15,5],
//        "offset-values":[0,0,0],
//        stack:2,
//        'background-color':'lemonchiffon'
//      },
//      {
//        values:[33.3,30,85],
//       "offset-values":[0,0,0],
//       stack:2,
//       'background-color': 'steelblue'
//      }  
//    ];


// Recreates the chart config object using the global variables
function drawChart() {
    var myConfig;
    if (diverge) {
        // Redefine the config object with new global values
        myConfig = {
        graphset: [{
        type: "hbar",

        plot:{
          stacked:true,
          "bars-space-left":"15%",  
          "bar-space":"0%",    
          "bar-width":"90%"
        },
        scaleY:{
          minValue:-100,
          maxValue:100,
          refLine:{
              visible: true, //set to false by default
              lineColor: "black"
            },
            guide:{

              alpha: 1,
              lineStyle : "solid"
          },
          item: {
            alpha: 1
          }
        }, 
        "scale-x":{
         mirrored:'false',
        labels: years,
         label: {
         },
         "zooming": true
        },

        "scroll-x": {
            "bar": {
                "background-color": "#DCEDC8",
                "alpha": 0.5,
                "border-radius":"5px",
                height:"10%"
            },
            "handle": {
                "background-color": "#8BC34A"
            }
        },
        tooltip:{
          text:"Count: %data-counts, %v%",
          "background-color": "#000000",
           },
        series: series
      }
      ]};
    } else {
        // Change chart to be more suitable for comparing multiple categories
         myConfig = {
        graphset: [{
        type: "hbar",

        plot:{
          stacked:true,
          "bars-space-left":"15%",
          "bar-space":"0%",    
          "bar-width":"60%"
        },
        scaleY:{
          minValue:0,
          maxValue:100,
          refLine:{
              visible: false, //set to false by default
              lineColor: "black"
            },
            guide:{

              alpha: 1,
              lineStyle : "solid"
          },
          item: {
            alpha: 1
          }
        }, 
        "scale-x":{
         mirrored:'false',
        labels: years,
         label: {
         },
         "zooming": true
        },

        "scroll-x": {
            "bar": {
                "background-color": "#DCEDC8",
                "alpha": 0.5,
                "border-radius":"5px",
                height:"10%"
            },
            "handle": {
                "background-color": "#8BC34A"
            }
        },
        tooltip:{
          text:"Count: %data-counts, %v%",
          "background-color": "#000000",
           },
        series: series
      }
      ]};
    }
    
    // Render the chart with new config
    $("#myChart").zingchart({
        data: myConfig
    });
    
    attachHoverFunctions();
    
    // Attach park names to div in <p> tags
    attachParkNames(selected_park_names);
    
    // Attach colors and responses to legend
    attachCategories(responses,colors);
};



// All jquery functions have to exist in a document.ready function
$(document).ready(function(){
    // Read in questions from the master question list    
    // Load in the csv files in queue
    queue()
		.defer(d3.csv, "data/MasterList.csv")
        .defer(d3.csv, "data/LikertOrder.csv")
        .defer(d3.csv, "data/matched_parks.csv")
        .defer(d3.json, "data/randomized_data.json")
		.await(populateUI);  
    
});


