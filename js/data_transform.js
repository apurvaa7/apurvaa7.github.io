function updateSubquestionLabels() {
    for (var yearIndex = 0; yearIndex < years.length; yearIndex++) {
        var yearObj = yearObjects[years[yearIndex]];

        for (var q_index = 0; q_index < question_IDs.length; q_index++){
            var q_element = question_IDs[q_index];
            if (q_element in yearObj) {
                // If it has subquestions, then change the key that is the same
                // as its parent
                if (!(yearObj[q_element].constructor === Array)) {
                    yearObjects[years[yearIndex]][q_element][q_element+'_'] = yearObj[q_element][q_element];
                    delete yearObjects[years[yearIndex]][q_element][q_element];
                }
            }
        }
    }
}

// Function to calculate the park aggregate for each question for each year
function calculateAggregates() {
    for (var yearIndex = 0; yearIndex < years.length; yearIndex++) {
        var yearObj = yearObjects[years[yearIndex]];

        for (var q_index = 0; q_index < question_IDs.length; q_index++){

            // Assume the question is not present until it is found for this year
            var questionPresent = false;
            var isSubQuestion =false;
            var parentQuestion_ID = '';
            var q_element = question_IDs[q_index];
            
            // create array to hold parks and responses
            var parkResponseArray;

            // Check if the selected question is a subquestion
            if (isNaN(parseInt(q_element.substr(q_element.length - 1)))) {   
                isSubQuestion = true;
                // If yes, remove the final character and use this to find the parent question
                parentQuestion_ID = q_element.slice(0,-1);

                // Check if parent question and subquestion exist in this year
                if (parentQuestion_ID in yearObj) {
                    if (q_element in yearObj[parentQuestion_ID]) {
                        questionPresent = true;
                        // Get array of park and response objects 
                        parkResponseArray = yearObj[parentQuestion_ID][q_element];
                    } 
                }

            } else {
                if (q_element in yearObj) {
                    questionPresent = true;

                    // Get array of park and response objects 
                    parkResponseArray = yearObj[q_element];
                
                    // check if object is actually array
                    if (!(parkResponseArray.constructor === Array)) {
                        continue;
                    }   
                }
            }
            
            if (questionPresent) {
                var responseSuperset = buildSuperset(q_element);
        
                // Toggle chart type if necessary
                toggleDiverging(q_element);
        
                // Update the resones based on the current question
                updateResponses(responseSuperset, q_element); 
                
                num_cat = responses.length;

                var newObj = {'parkName':'Overall Avg','responses':{}};
                var countLists = {};
                for (var i = 0; i < num_cat; i++) {
                    newObj['responses'][responses[i]] = 0;
                    countLists[responses[i]] = [];
                }
                
                // Keep count of all responses
                var totalResponses = 0;
                
                // Iterate over all park response entries and incrementally get total response counts
                for (var pr_index = 0; pr_index < parkResponseArray.length; pr_index++) {
                    var pr_element = parkResponseArray[pr_index];
                    for (var i = 0; i < num_cat; i++) {
                        if (pr_element['responses'].hasOwnProperty(responses[i])) {
                            responseCount =  parseInt(pr_element['responses'][responses[i]]);
                            totalResponses += responseCount;
                            
                            // Keep a list of all counts for this response
                            countLists[responses[i]].push(responseCount);
                        }
                    }  
                }
                
                // Find averages for the lists of counts for each reponse category
                for (var i = 0; i < num_cat; i++) {
                    var sum = 0;
                    for (var j = 0; j < countLists[responses[i]].length; j++) {
                        sum += countLists[responses[i]][j];
                    }
                    
                    // Get average counts for each response category
                    if (countLists[responses[i]].length == 0) {
                        newObj['responses'][responses[i]] = 0;
                    } else {
                        newObj['responses'][responses[i]] = sum / countLists[responses[i]].length;
                    }
                }

                if (isSubQuestion) {
                    // Add aggregate to global object
                    yearObjects[years[yearIndex]][parentQuestion_ID][q_element].push(newObj);
                } else {
                    yearObjects[years[yearIndex]][q_element].push(newObj);
                }

            } else {
                // Question not found, so aggregate has 0 for all responses
//                var newObj = {'parkName':'Overall Avg','responses':{}};
//                responseSuperset.forEach(function(element, index, array) {
//                    newObj['responses'][element] = 0;
//                });
//                // Add a park aggregate with 0 for all responses
//                if (isSubQuestion) {
//                    // Add aggregate to global object   
//                    if (q_element in yearObjects[years[yearIndex]][parentQuestion_ID]) {
//                         yearObjects[years[yearIndex]][parentQuestion_ID][q_element].push(newObj);
//                    }
//                } else {
//                    console.log(yearObj);
//                    console.log(q_element);
//                    if (q_element in yearObjects[years[yearIndex]]) {
//                         yearObjects[years[yearIndex]][q_element].push(newObj);
//                    }
//
//                }

            }
        }   
    }
}


// Checks the question type and toggles whether a diverging color scheme should be used
function toggleDiverging(q_ID) {
    var qType;
    
    if (isNaN(parseInt(question_ID.substr(q_ID.length - 1)))) {
        // If yes, remove the final character and use this to find the parent question
        var parentQuestion_ID = q_ID.slice(0,-1);
        // Get the type of this question 
        qType = main_questions[parentQuestion_ID]['type'];
    } else {
        // Get the type of this question    
        qType = main_questions[q_ID]['type'];
    }

    if (divergentTypes.indexOf(qType) > -1) {
        diverge = true
    } else {
        diverge = false;
    }
}

// Changes the global color palette for the chart 
// depending on the number of response categories
function updateColors(num) {
    if(diverge == true) {
        colors = divColorPalettes[num_cat];
    } else {
        colors = catColorPalettes[num_cat];
    }
}

// Based on the current question ID and type, change the displayed
// responses accordingly
function updateResponses(superset, q_ID) {
    if (diverge) {
        if (isNaN(parseInt(q_ID.substr(q_ID.length - 1)))) {
            // if it is a subquestion find responses for parent question
            var parentQuestion_ID = q_ID.slice(0,-1);
            responses = likertResponses[parentQuestion_ID];
        } else {
            responses = likertResponses[q_ID];
        }
    } else {
        responses = superset;
    }
}


// Utility function to build the superset of responses for the currently selected question
function buildSuperset(q_ID) {
    var responseSuperset = [];
    var yearIndex;

    for (yearIndex = 0; yearIndex < years.length; yearIndex++) { 

        var yearObj = yearObjects[years[yearIndex]];
        var questionPresent = false;

        // create array to hold parks and responses
        var parkResponseArray;
        // Check if the selected question is a subquestion
        if (isNaN(parseInt(q_ID.substr(q_ID.length - 1)))) {
            // If yes, remove the final character and use this to find the parent question
            var parentQuestion_ID = q_ID.slice(0,-1);
            
            // Check if parent question and subquestion exist in this year
            if (parentQuestion_ID in yearObj) {
                if (q_ID in yearObj[parentQuestion_ID]) {
                    questionPresent = true;
                    // Get array of park and response objects 
                    parkResponseArray = yearObj[parentQuestion_ID][q_ID];
                } else {continue;}
            } else {continue;}
            
           
        } else {
            if (q_ID in yearObj) {
                questionPresent = true;
                // Get array of park and response objects 
                parkResponseArray = yearObj[q_ID];

            } else {continue;}
        }
        
        if (questionPresent) {
            if (!(parkResponseArray.constructor === Array)) {
            return;
            }

            // Iterate over all park response entries and build superset
            parkResponseArray.forEach(function(element, index, array) {
                responseSuperset = union_arrays(responseSuperset, Object.keys(element['responses']));
            });    
        }
    }
    return responseSuperset;
}

// This function updates the series object using the values in
// the global configuration objects
function createNewDataSeries() {
    
    // Initialize empty replacement series
    var newSeries = [];
    
    // Iterate over all and find the largest superset of responses
    var responseSuperset = buildSuperset(question_ID); 

    // Toggle chart type if necessary
    toggleDiverging(question_ID);

    // Update the resones based on the current question
    updateResponses(responseSuperset, question_ID); 

    num_cat = responses.length;

    // Based on size of superset and type of question, decide on what colors to use
    updateColors(num_cat);


    // Add empty objects with correct colors to the currently empty series list
    var stack_num  = 0;
    selected_park_names.forEach(function(element,index, array) {
        stack_num++;
        var colorIndex = 0;

        var i;
        for (i = 0; i < num_cat; i++) {
            // Create object to hold values and offets
            var seriesObj = {'values': new Array(years.length+1).join('0').split('').map(parseFloat),
                         'offset-values':new Array(years.length+1).join('0').split('').map(parseFloat),
                         'stack':stack_num,
                         'background-color':colors[i],
                          'data-counts':new Array(years.length+1).join('0').split('').map(parseFloat)};
            newSeries.push(seriesObj);
        }    
    });
            
    
    // Now, build the series object by iterating through the park responses
    var yearIndex;
    for (yearIndex = 0; yearIndex < years.length; yearIndex++) {
        // Assume the question is not present until it is found for this year
        var questionPresent = false;
        
        var yearObj = yearObjects[years[yearIndex]];
        // create array to hold parks and responses
        var parkResponseArray;
        // Check if the selected question is a subquestion
        if (isNaN(parseInt(question_ID.substr(question_ID.length - 1)))) {
            // If yes, remove the final character and use this to find the parent question
            var parentQuestion_ID = question_ID.slice(0,-1);
            
            // Check if parent question and subquestion exist in this year
            if (parentQuestion_ID in yearObj) {
                if (question_ID in yearObj[parentQuestion_ID]) {
                    questionPresent = true;
                    // Get array of park and response objects 
                    parkResponseArray = yearObj[parentQuestion_ID][question_ID];
                } 
            }

        } else {
            if (question_ID in yearObj) {
                questionPresent = true;
                
                // Get array of park and response objects 
                parkResponseArray = yearObj[question_ID];
            }
        }
        
        if (questionPresent) {
            
            // Make object to identify parks that have been found
            var foundPark = []
            selected_park_names.forEach( function(element, index, array) {
                foundPark.push(false);
            });
            
            // Iterate over all park response entries and incrementally build series
            parkResponseArray.forEach(function(element, index, array) {
                
                // Check if park is in the selected list
                var parkIndex = selected_park_names.indexOf(element['parkName'])
                var totalResponses = 0;
                
                if (parkIndex> -1 ) {
                    var responseCounts = {};
                    var responseObject = jQuery.extend({}, element['responses']);
                    // Mark park as found for this year
                    foundPark[parkIndex] = true;
                    
                    // Calculate proportions and save them to the series objects
                    for (var i = 0; i < num_cat; i++) {
                        if (element['responses'].hasOwnProperty(responses[i])) {
                            var countVal = Math.round(parseFloat(responseObject[responses[i]])*10)/10;
                            responseCounts[responses[i]] = countVal;
                            totalResponses += countVal;
                        } else {
                            responseCounts[responses[i]] = 0;
                        }
                    }

                    for (var i = 0; i < num_cat; i++) {
                        if (element['responses'].hasOwnProperty(responses[i])) {
                            responseObject[responses[i]] = Math.round((100*( element['responses'][responses[i]] / totalResponses)) * 10) / 10;
                        } else {
                            responseObject[responses[i]] = 0;
                        }
                    }
                    
                    // Add values to the series objects
                    var start = parkIndex*num_cat;
                    var end = start + num_cat;
                    while (start < end) {
                        newSeries[start]['values'][yearIndex] = responseObject[responses[start%num_cat]];
                        newSeries[start]['data-counts'][yearIndex] = Math.round(element['responses'][responses[start%num_cat]]*10)/10;
                        newSeries[start]['offset-values'][yearIndex] = 0;
                        start++;
                    }

                }
            }); 
            
            // For parks that are not found this year, fill their series objects with zeroes
            for (var i = 0; i < foundPark.length; i++) {
                if (! foundPark[i]) {
                    // Add values to the series objects
                    var start = i*num_cat;
                    var end = start + num_cat;
                    while (start < end) {
                        newSeries[start]['values'][yearIndex] = 0;
                        newSeries[start]['offset-values'][yearIndex] = 0;
                        start++;
                    }
                }
            }
        } else {
            // Question was not found this year, so fill corresponding yearIndex
            // in series objects with 0
            for (var i = 0; i < newSeries.length; i++) {
                newSeries[i]['values'][yearIndex] = 0;
                newSeries[i]['offset-values'][yearIndex] = 0;
            }
        }
                  
    }
    // update the series object
    series = newSeries;  
}