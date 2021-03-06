
/*	ENTER YOUR APP'S JAVASCRIPT CODE HERE!	*/

// this function fires at the ready state, which is when the DOM is
// ready for Javascript to execute
$(document).ready(function() {

	// Initialize Firebase
  	var config = {
		apiKey: "AIzaSyC_7yj1Mai-QXrxFGEuz7JHnJdDJ4QKPdU",
		authDomain: "livecodetodo.firebaseapp.com",
		databaseURL: "https://livecodetodo.firebaseio.com",
		storageBucket: "",
		messagingSenderId: "1091385870708"
	};
	firebase.initializeApp(config);

	// some firebase variables
	var facebookProvider = new firebase.auth.FacebookAuthProvider();
	var auth = new firebase.auth();
	var database = new firebase.database();
	var loggedUser = {};
	var profileRef = database.ref('/profiles');

	auth.onAuthStateChanged(function (user) {
	    // handle it
	    console.log("Whoa, we're already logged in");
	    console.log(user);
	    handleLogin(user);
	});

	// event listener for the login button
	$("#btn-login").click(function() {

		// sign in via popup
		// PRO TIP: remember, .then usually indicates a promise!
		auth.signInWithPopup(facebookProvider).then(function(result) {

			// this is where the old code was, now in handleLogin()
			handleLogin(result.user);


		}, function(error) {
			console.log("Oops! There was an error");
			console.log(error);
		});
	});

	// opens a modal to add a new todo
	$("#btn-add-todo-window").click(function() {
		$(".main-window").hide();
		$(".new-todo-window").show();
	});

	// actually adds the todo
	$("#btn-add-todo").click(function() {

		var todoRef = database.ref('/todos').child(loggedUser.id);

		// make sure the new todo isn't blank
		if ($("#new-todo-text").val() != "") {

			// add the todo and update the values. finally close the modal
			todoRef.push($("#new-todo-text").val());
			$("#new-todo-text").val("");
			$(".main-window").show();
			$(".new-todo-window").hide();
		}
	});

	$("#btn-logout").click(function() {

		auth.signOut().then(function() {
			$(".login-window").show();
			$(".main-window").hide();
		}, function(error) {
		  	alert("Oops!  Couldn't log you out.  Here's why: "+error);
		});
	});

	$("#btn-expand").click(function() {

		// check the state of the sidebar's data-toggle
		if ($("#sidebar").data('toggle') == "expand") {

			// it's expanded, collapse it
			$("#sidebar").data('toggle', 'collapse');
			$("#sidebar").animate({
				width: "-=200px"
			}, 500, function() {
				
			});
		}
		else {

			// it's collapsed, expand it
			$("#sidebar").data('toggle', 'expand');
			$("#sidebar").animate({
				width: "+=200px"
			}, 500, function() {
				
			});
		}
	});

	function handleLogin(user) {

		if (user !== null) {
			$(".login-window").hide();
			$(".main-window").show();

			// check for your profile
			profileRef.once("value").then(function(snapshot) {

				// get the snapshot value
				var snapshotValue = snapshot.val();

				// if no values present, just add the user
				if (snapshotValue == undefined || snapshotValue == null) {
					loggedUser = addNewUser(user, profileRef);
				}
				else {

					// iterate through the object, and determine if the
					// profile is present
					var keys = Object.keys(snapshotValue);
					var found = false;
					for (var i = 0; i < keys.length; i++) {

						// accessing objects:
						// way 1: objectname.objectvalue
						// way 2: objectname['objectvalue']
						if (snapshotValue[keys[i]].email == user.email) {
							
							// found the profile, access it
							loggedUser = snapshotValue[keys[i]];
							loggedUser.id = keys[i];
							found = true;
						}
					}

					// profile is not found, add a new one
					if (!found) {
						loggedUser = addNewUser(user, profileRef);
					}
				}

				// listen for todos and update on the fly
				var todoRef = database.ref('/todos').child(loggedUser.id);
				todoRef.on('value', function(snapshot) {

					var snapshotValue = snapshot.val();
					if (snapshotValue == undefined || snapshotValue == null) {
						$(".todo-list").html(`
							<div class="col-sm-12">
								No todos!
							</div>
						`);
					}
					else {
						var keys = Object.keys(snapshotValue);

						// populate the div with the class 'todo-list'
						$(".todo-list").html("");
						for (var i = 0; i < keys.length; i++) {
							$(".todo-list").append(`
								<div class="col-sm-2">
									<input class="todo-done" type="checkbox" data-id="${keys[i]}">
								</div>
								<div class="col-sm-10">
									${snapshotValue[keys[i]]}
								</div>
							`);
						}

						// complete a to-do, listens on the checkbox
						$(".todo-done").click(function() {
							var deleteID = $(this).data("id");
							var delTodoRef = database.ref('/todos').child(loggedUser.id).child(deleteID);

							delTodoRef.remove();

						});
					}
				});
			});
		}
		else {
			loggedUser = {};
		}
	}
});


// function to add a new user
// (this isn't in document ready because it doesn't need to be initialized)
function addNewUser(passedUser, ref) {
	var user = {
		name: passedUser.displayName,
		email: passedUser.email
	};

	var newUser = ref.push(user);
	user.id = newUser.key;
	return user;
}













