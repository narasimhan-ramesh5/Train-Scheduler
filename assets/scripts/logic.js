/**
 * logic.js - main logic for train scheduler project
 */

$(document).ready(function(){

	var timerHandle = 0;
	var timerRunning = false;

	// Initialize Firebase
	var config = {
    apiKey: "AIzaSyDV_xgJtoBrvJhf2sWGyO_SzsH66YTg4cs",
    authDomain: "train-schedule-a1ee6.firebaseapp.com",
    databaseURL: "https://train-schedule-a1ee6.firebaseio.com",
    projectId: "train-schedule-a1ee6",
    storageBucket: "train-schedule-a1ee6.appspot.com",
    messagingSenderId: "968473019780"
  };
	firebase.initializeApp(config);

	// Obtain handle to the database reference
	var trainDatabase = firebase.database();

	// Submit button handler - when user enters a new train
	// into the system
	$("#train-submit").on("click", function(){
		event.preventDefault();
		//console.log("New train submitted");

		var name = $("#name-input").val();
		var destination = $("#destination-input").val();
		var firstTime = $("#first-train-time-input").val();
		var frequency = $("#train-frequency-input").val();

		// ToDo: input validation
		if(!name || !destination || !firstTime || !frequency){
			//console.log("Please fill in all fields");
			// TODO : Display a warning box 
			return;
		}

		// Train frequency must be a numeric value
		// Use JQuery's 'isNumeric' for this
		if(!($.isNumeric(frequency))){
			//console.log("Please specify train frequency in minutes - enter a number");
			return;
		}

		// Convert frequency to an integer
		frequency=parseInt(frequency);

		// First train time must be in the format HH:mm
		var firstTimeMoment = moment("2018-01-01T"+firstTime);
		//console.log(firstTimeMoment);
		if(!firstTimeMoment.isValid()){
			//console.log("First time is not a valid moment in time");
			return;
		}

		// Upload To Firebase
		trainDatabase.ref().push({
			trainName: name,
			trainDestination: destination,
			firstTime: firstTimeMoment.valueOf(),
			trainFrequency: frequency
		});

		return false;
	});

	/**
	 * Periodic callback function to update time remaining
	 */
	function refreshTimeRemaining(){

		var today = (new Date()).toLocaleDateString();
		var now = moment();
		var minutesRemaining = 0;
		var frequency = 0;
		var nextArrival, nextArrivalMilliseconds, nextArrivalFormatted;
		var roundUp = 0;
		
		// Iterate through all the trains update minutes remaining 
		$("#train-schedule-table > tbody > tr > td").each(function(){
			if($(this).hasClass("frequency-cell")){
				frequency = parseInt($(this).text());
			}

			// Get the next train arrival time in milliseconds, which
			// is stored as a user-defined attribute in the table.
			// (The text is just the HH:mm formatted time)
			if($(this).hasClass("next-arrival-cell")){
				//console.log($(this).text());

				nextArrivalMilliseconds = parseInt($(this).attr("next-arrival-val"));
				if(nextArrivalMilliseconds){
					//console.log("Next arrival in milliseconds "+nextArrivalMilliseconds);
				}

				nextArrival = moment(nextArrivalMilliseconds);
				//console.log(nextArrival.format());

				// Compute new minutes remaining based on current time
				// If minutes remaining is zero, update to next occurrence
				minutesRemaining = nextArrival.diff(now, "minutes") + roundUp;
				if(minutesRemaining <= 0){
					minutesRemaining += frequency;
					nextArrival.add(minutesRemaining, "minutes");
					//console.log("Next Arrival at "+nextArrival.format());

					nextArrivalFormatted = nextArrival.format("HH:mm");
					$(this).text(nextArrivalFormatted);
				}
			}

			if($(this).hasClass("minutes-remaining-cell")){
				$(this).text(minutesRemaining);
				//console.log($(this).text());
			}
		});

		//console.log(timerHandle);

		//console.log("END INTERVAL");
	}

	/**
	 * Callback Function invoked whenever a new train is added 
	 * to Firebase.
	 * 
	 * Calculates the next train arrival time based on 
	 *  - first train time
	 *  - train frequency 
	 *  - and current time.
	 * 
	 * Displays the data in the train schedule table.
	 * 
	 */
	trainDatabase.ref().on("child_added", function(snapshot) {
		var remainder = 0;
		var minutesRemaining = 0;
		var diffInMinutes = 0;
		var firstTime = 0;
		var nextArrival = {};

		// Log everything that's coming out of snapshot
		trainObject = snapshot.val();
		//console.log(trainObject);

		/* The train object must have the following attributes
			 - trainName
			 - trainDestination
			 - firstTime
			 - trainFrequency */

		firstTime = trainObject.firstTime;

		//console.log("The first ever time of this train was ");
		//console.log(firstTime);

		// Get the current time in EPOCH 
		var now = moment();

		//console.log("The current time is ");
		//console.log(now);

		// Get the difference between current time and first ever time in minutes
		diffInMinutes = now.diff(moment(firstTime),"minutes");

		// Based on that, compute the minutes remaining until next arrival, as well
		// as the next arrival time in HH:mm
		remainder  = diffInMinutes % trainObject.trainFrequency;
		minutesRemaining = trainObject.trainFrequency - remainder;
		//console.log("Next train arrives in "+minutesRemaining+" minutes");

		nextArrival = now.add(minutesRemaining,"minutes");
		nextArrivalFormatted = nextArrival.format("HH:mm");
		//console.log("Next arrival at "+nextArrivalFormatted);

		// Update the train schedule table
		var newRow = $("<tr>");

		trainNameCell = $("<td>");
		trainNameCell.text(trainObject.trainName);

		trainDestCell = $("<td>");
		trainDestCell.text(trainObject.trainDestination);

		trainFreqCell = $("<td>");
		trainFreqCell.text(trainObject.trainFrequency);
		trainFreqCell.addClass("frequency-cell");

		nextArrivalCell = $("<td>");
		nextArrivalCell.text(nextArrivalFormatted);
		nextArrivalCell.attr("next-arrival-val",nextArrival.valueOf());
		nextArrivalCell.addClass("next-arrival-cell");

		minsRemCell = $("<td>");
		minsRemCell.text(minutesRemaining);
		minsRemCell.addClass("minutes-remaining-cell");

		newRow.append(trainNameCell); 
		newRow.append(trainDestCell); 
		newRow.append(trainFreqCell);
		newRow.append(nextArrivalCell);
		newRow.append(minsRemCell);

		$("#train-schedule-table").append(newRow);

		// Setup a periodic refresh function that updates the 
		// 'minutes remaining' in the train schedules.

		// Only needs to be done ONCE i.e. the FIRST time the 
		// Firebase callback gets invoked 
		if(!timerRunning){
			timerHandle = setInterval(refreshTimeRemaining, 1000);
			//console.log(timerHandle);
			timerRunning = true;
		}

	}, function(errorObject) {// Error Handler
		//console.log("Error reaching database -  " + errorObject.code);
	});

});
