
// This function reads in the master list of questions
// Creating objects with subquestions where applicable
function populateUI(error, mlist, likert, parks, year_json) {
    // read in data and populate question object
    mlist.forEach(function(d) {
        // read in data
        var index = d.Index
        
        // Ignore Q13
        if (d.Index == 'Q13') {
            return;
        }
        
        // No letter means this is a primary question
        if (! isNaN(parseInt(index.substr(index.length - 1)))) {
            // Create new key/val pair for primary question
            if (d.Type == "") {
                // No listed type means that this is the first of a group of subquestions
                main_questions[index]['sub'][index+'_'] = {'text':d.Question}
                question_IDs.push(index+'_');
            } else {
                main_questions[index] = {'text':d.Question,'type':d.Type,'sub':{}}
                question_IDs.push(index);
            }
        } else {
            // This row is a subquestion
            // Get the parent question by trimming letter from end
            var parentQuestion = index.slice(0,-1);

            // Create a subquestion object
            main_questions[parentQuestion]['sub'][index] = {'text':d.Question}
            question_IDs.push(index);
        }                
    });
    
    // Read in likert ordered responses
    likert.forEach(function(d) {
        // read in data
        var index = d.Index;
        var answers = d.Answers;
        
        // Split answers on commas to get responses
        var splitString = answers.split(',');
        likertResponses[index] = splitString;  
    });
    
    // Read in park centroids
    parks.forEach(function(d) {
        // Save the survey name in a list
        park_names.push(d.Survey_Name);
    });
    
    // Save the year json objects
    yearObjects = year_json;
    // Read year values into list
    var tmp = Object.keys(year_json);
    tmp.forEach(function(element, index, array){
        years.push(parseInt(element));
    });
    
    // sort years in ascending order
    years.sort(function(a, b){return a-b});
    
    // Change the first subquestion label to end with an underscore in the year objects
    updateSubquestionLabels();
        
    // Calculate the aggregate park values
    calculateAggregates();
    
     // Add function to the slider element
    initializeSlider();
    
    // Fill in select options
    addParkOptions();
    addQuestionOptions();
    
    addAutoComplete();
  
    // Add draggable label div
    $(function() {
        $( "#draggable" ).draggable().resizable();
      });
    
    // Add draggable legend
    $(function() {
        $( "#chartLegend" ).draggable().resizable();
      });
    
    // Add function to change baseline category
    $('#chng_base').click(function() {
        changeBase();
    });
    
    //Text Comments Functions
	$('#inputYear').select2({
      placeholder: "Select a year",
       allowClear: true
      });

      $('#inputQuestion').select2({
      placeholder: "Select a question",
       allowClear: true
      });

       $("#inputYear").val('').trigger('change');
      var $eventSelect = $("#inputYear");
      $eventSelect.on("select2:select", function (e) { updateBubble("year",e.params.data.id); });

        $("#inputQuestion").val('').trigger('change');
      var $eventSelect = $("#inputQuestion");
      $eventSelect.on("select2:select", function (e) { updateBubble("question",e.params.data.id); });
    
    // Create a default data series with the park average shown
    createNewDataSeries();
    drawChart();
}

// Function to attach park names  to draggable div
function attachParkNames(array) {
    // Clear contents of div
    $("#draggable > p").remove();
    
    // Attach all park names to draggable div
    array.forEach(function(element, index, array){
        var ptag = '<p id=p'.concat(index,'>',element,'<\p>');
        $("#draggable").append(ptag);
    }); 
};

// Function to attach colors and response categories to legend
function attachCategories(array, colors) {
    // Clear contents of div
    $("#chartLegend > span").remove();  
     $("#chartLegend > br").remove();
    
    // Attach colors and response choices to div
    array.forEach(function(element, index, array){
        var colorbox = '<span id="color-box" style="background:'.concat(colors[index],'"></span>');
        
        colorbox = colorbox.concat('<span id="txt">',responses[index],'</span><br>');
        $("#chartLegend").append(colorbox);
    });
};


// Change baseline comparison category for all bars
function changeBase() {
    var x = $('#myChart').getSeriesData();
    
    var stacks = []
    
    num_cat = responses.length;
    num_parks = selected_park_names.length;
    
    var i;
    for (i = 0; i < num_parks; i++) {
        stacks.push(x.slice(i*num_cat, (i+1)*num_cat));
    }
    
    stacks.forEach(function(element, index, array){
        var offset = Array(years.length).fill(0);
        var i = 0;
        // Depnding on baseline value, incrementally subtract from the offset
        for (i = 0; i < baseline; i++) {
            var toSubtract = element[i].values;
            offset.forEach(function(element, index, array){
                offset[index] = offset[index] - toSubtract[index]
            });
        }
        
        // Assign new offset values
        for (i = 0; i < num_cat; i++) {
            element[i]['offset-values'] = offset;
        }
       
    });
    
    // flatten the stacks array to create new series
    series = [].concat.apply([],stacks);

    // Rotate between baseline values
    baseline = (baseline + 1) % num_cat
    
    drawChart();
}

// Called when a chart is drawn/redrawn attaches  
// listeners so that hover functionality is not lost
function attachHoverFunctions() {
    
    num_parks = selected_park_names.length;
     $("#myChart").nodeHover(function(){  
         // Get id of current segment
         var current_hover = this.event.plotindex
         
         // Create base id which will be modified to
         var baseID = "#myChart-graph-id0-plotset-plot-";
         
         // Get list of plot ids to -not- animate
         var hovered = []
         var i;
         var j;
         // Plots go from 0 to num_cat*num_park-1
         for (i = current_hover; i < (num_cat*num_parks); i += num_cat) {
              hovered.push(i);
         }
         for (i = current_hover; i > -1; i -= num_cat) {
              hovered.push(i);
         }  
         
         for (i = 0; i < years.length; i++) {
             
             for (j = 0; j < num_cat*num_parks; j++){
                     var plot_index = j;
                     
                     if (hovered.indexOf(plot_index) < 0) {
                         
                         // Add the segment to the non-hovered list
                         // if it is not part of the hovered series
                         var selector = baseID.concat(plot_index,'-node-',i,'-path');
                         nonHoverPlots.push(selector);
                    }
                }
         }

         // Color the non-hovered series gray
          nonHoverPlots.forEach(function(element, index, array){
             $(element).css({
                opacity: .25   
             });
         });
               
        }, function() {
         // Animate back to full opacity
         nonHoverPlots.forEach(function(element, index, array){
             $(element).css({
            opacity: 1  
             });
         });

        // empty the non-hover list
        nonHoverPlots = [];
    });
    
    // Add hover functions to each stack in each group
    // Keep a global selector variable for the mouseout event
    var park_selector;
    $("#myChart").plotHover(function(){
        // Get the index of the park name to highlight in the legend
        var park_index = Math.floor(this.event.plotindex / num_cat);
        park_selector = "#p".concat(park_index);
        
        // Underline the corresponding parkname in the draggable legend
        $(park_selector).css("text-decoration","underline");
    }, function() {
        // On mouseout, remove the underline
        $(park_selector).css("text-decoration","none");
    });
}

function initializeSlider() {
    var cur_year = new Date().getFullYear();
     $("#slider-range").slider({
         range: true,
         min: Math.min.apply(null, years),
         max: Math.max.apply(null, years),
         values: [Math.min.apply(null, years), Math.max.apply(null, years)],
         slide: function (event, ui) {
             
             $("#date-range").html(String(ui.values[0]) + ' to ' +  ui.values[1]);
             
             // Change global year object
             var new_years = []
             
             for (var i = ui.values[0]; i <= ui.values[1]; i++) {
                   new_years.push(i);
                }
             
             years = new_years;
             // Read in info for the selected parks and the selected question 
             // from the survey data for the new year range
              createNewDataSeries();
             
             // Redraw chart
             drawChart();   
         }
     });
    
    $("#date-range").html(String(Math.min.apply(null, years)) + ' to ' + Math.max.apply(null, years));
}

function addAutoComplete() {    
    $( "#main_questions" ).select2({
    placeholder: 'Select a Question',
    allowClear: true});
    
    // Change the selected question label
    $('#selected_question').html('Was this your child(ren)\'s first year attending a Chicago Park District day camp?');
        
    addQuestionSelectEvents();
    
    $( "#park_names" ).select2({
    placeholder: 'Select a Park',
    allowClear: true});

    
    addParkSelectEvents();

}

// Add events to update the list of selected parks
function addParkSelectEvents() {
    var $eventParkSelect = $("#park_names");
    
     $eventParkSelect.on("select2:select", function(e) {
         if (selected_park_names.indexOf(e.params.data.id) >-1) {
             // Ignore adding park if it already exists in the list
             return;
         }
         selected_park_names.push(e.params.data.id);
         
         if (e.params.data.id != 'Overall Avg') {
             // Use park name as index to change marker
             markers_coord[e.params.data.id].setIcon(selectedCircle);
         }
        
         // Change park names displayed in draggable div
         attachParkNames(selected_park_names);
         
         // Create new data series
         createNewDataSeries();
         
         // Re draw the chart
         drawChart();
        
    });
    
    $eventParkSelect.on("select2:unselect", function(e) {
        selected_park_names.remove(selected_park_names.indexOf(e.params.data.id));
        
         if (e.params.data.id != 'Overall Avg') {
            // Use park name as index to change marker
            markers_coord[e.params.data.id].setIcon(unselectedCircle);
         }

        attachParkNames(selected_park_names);

        // Create new data series
        createNewDataSeries();
        
        // Re draw the chart
        drawChart();
    });
    
}

// Add events to update the question when selection changes
function addQuestionSelectEvents () {
    var $eventQuestionSelect = $("#main_questions");
    
     $eventQuestionSelect.on("select2:select", function(e) {
         
         // Get the question index value from the selection
         question_ID = e.params.data.id;
         
         // Change the selected question label
         $('#selected_question').html(e.params.data.text);
         
         // Update the series object
         createNewDataSeries();
         
         // Re draw the chart
         drawChart();
             
    });
    
    $eventQuestionSelect.on("select2:unselect", function(e) {
        // Do nothing. Only re draw the chart if a new question is selected
    });
}

function addQuestionOptions() {
    
    for (topLevelKey in main_questions) {        
        // Check if sub-questions present
        if (! jQuery.isEmptyObject(main_questions[topLevelKey]['sub'])) {
            // If yes, make an options group
            var newOptGroup = '<optgroup label="'.concat(main_questions[topLevelKey]['text'],'">');
            for (subQuestion in main_questions[topLevelKey]['sub']) {
                newOptGroup = newOptGroup.concat('<option value="',subQuestion,'">',main_questions[topLevelKey]['sub'][subQuestion]['text'],'</option>'); 
            }
            $("#main_questions").append(newOptGroup);

        } else {
            // Add an option to the drop down
            var newOption = '<option value="'.concat(topLevelKey,'">',main_questions[topLevelKey]['text'],'</option>');
            $("#main_questions").append(newOption);
        }
    }
}

function addParkOptions() {
    park_names.forEach(function(element, index, array) {
        var newOption;
        // Ensure that the overall avg is the default selection
        if (element == 'Overall Avg') {
            newOption = '<option selected="selected">'.concat(element,'</option>');
        } else {
            newOption = '<option>'.concat(element,'</option>');
        }
        $("#park_names").append(newOption);
    });
}
