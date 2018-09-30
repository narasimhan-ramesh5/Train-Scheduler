/**
 * logic.js - main logic for train scheduler project
 */

$(document).ready(function(){

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
		console.log("New train submitted");

		var name = $("#name-input").val();
		var destination = $("#destination-input").val();
		var firstTime = $("#first-train-time-input").val();
		var frequency = $("#train-frequency-input").val();

		// ToDo: input validation
		if(!name || !destination || !firstTime || !frequency){
			console.log("Please fill in all fields");
			// TODO : Display a warning box 
			return;
		}

		// Train frequency must be a numeric value
		// Use JQuery's 'isNumeric' for this
		if(!($.isNumeric(frequency))){
			console.log("Please specify train frequency in minutes - enter a number");
			return;
		}

		// Convert frequency to an integer
		frequency=parseInt(frequency);

		// First train time must be in the format HH:mm
		var firstTimeMoment = moment("2018-01-01T"+firstTime);
		console.log(firstTimeMoment);
		if(!firstTimeMoment.isValid()){
			console.log("First time is not a valid moment in time");
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
		console.log(trainObject);

		/* The train object must have the following attributes
			 - trainName
			 - trainDestination
			 - firstTime
			 - trainFrequency */

		firstTime = trainObject.firstTime;

		console.log("The first ever time of this train was ");
		console.log(firstTime);

		// Get the current time in EPOCH 
		var now = moment();

		console.log("The current time is ");
		console.log(now);

		// Get the difference between current time and first ever time in minutes
		diffInMinutes = now.diff(moment(firstTime),"minutes");

		// Based on that, compute the minutes remaining until next arrival
		remainder  = diffInMinutes % trainObject.trainFrequency;
		minutesRemaining = trainObject.trainFrequency - remainder;


		console.log("Next train arrives in "+minutesRemaining+" minutes");

		nextArrival = now.add(minutesRemaining,"minutes");
		nextArrivalFormatted = nextArrival.format("HH:mm");
		console.log("Next arrival at "+nextArrivalFormatted);

		// Change the HTML to reflect
		$("#train-schedule-table").append('<tr><td>'+ 
																				 trainObject.trainName+'</td><td>'+
																				 trainObject.trainDestination+'</td><td>'+
																				 trainObject.trainFrequency+'</td><td>'+
																				 nextArrivalFormatted+'</td><td>'+
																				 minutesRemaining+'</td>');

		// Handle the errors
	}, function(errorObject) {
		console.log("Errors handled: " + errorObject.code);
	});

});
