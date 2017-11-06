jQuery(document).ready(function($){
	//console.log('note.js loaded');
	var db;

	var openRequest = indexedDB.open('notes', 1);

	openRequest.onupgradeneeded = function(e){
		console.log('Upgrading DB...');
		var thisDB = e.target.result;
		if(!thisDB.objectStoreNames.contains('notestore')) {
			thisDB.createObjectStore('notestore', { autoIncrement : true });
		}
	};

	openRequest.onsuccess = function(e){
		console.log('Open Success!');
		db = e.target.result;
		$('#save-btn').click(function(e){
			var nameIn = encode($('#notename').val());
			var subjectIn = encode($('#subject').val());
			// creating a new input : note texte
			var noteIn = encode($('#note').val());
			var dateStamp = getTime();
			var characters = String(noteIn).length;
			if (!nameIn.trim()) {
				alert('Author is Required!');
			} else if (!subjectIn.trim()) {
				alert('Subject is Required!');
			} else {
				addNote(new Note(nameIn, subjectIn,noteIn,dateStamp,characters));
				$('#new-form').toggle();
				$('#notename').val('');
				$('#subject').val('');
				console.log('New Note added.');
			}
		});
		renderList();
	};



	openRequest.onerror = function(e) {
		console.log('Open Error!');
		console.dir(e);
	}
	  
	// Render List Function
	function renderList(){
		
		//Count Objects
		var transaction = db.transaction(['notestore'], 'readonly');
		var store = transaction.objectStore('notestore');
		var countRequest = store.count();
		
		$('#list-wrapper').empty();
		
		countRequest.onsuccess = function(){
			console.log(countRequest.result)
			var count = Number(countRequest.result);

			// Set up the table top line 
			$('#list-wrapper').append('<table class=""><tr class="centered"><th>Key</th><th>Author</th><th>Subject</th><th>Date</th><th>Characters</th><th><div class="badge green lighten-3 center"> <em>' + count + ' notes</em></div></th></tr></table>');

			// Get all Objects and display if notes exist
			if (count > 0) {
				var objectStore = db.transaction(['notestore'], 'readonly').objectStore('notestore');
				objectStore.openCursor().onsuccess = function(e){
					var cursor = e.target.result;
					if (cursor) {
						var $row = $('<tr></tr>');
						var $keyCell = $('<td>' + cursor.key + '</td>');
						var $nameLink = $('<a href="#" data-key="' + cursor.key + '">' + cursor.value.notename + '</a>');
						var $dateCell = $('<td>' + cursor.value.date + '</td>');
						var $characters = $('<td>'+ cursor.value.characters +'</td>')
						$nameLink.click(function(){
							//alert('Clicked ' + $(this).attr('data-key'));
							loadNoteByKey(Number($(this).attr('data-key')));
						});
						var $nameCell = $('<td></td>').append($nameLink);
						var $subjectCell = $('<td></td>').append(cursor.value.subject);
						var $noteCell = $('<td class="truncate"></td>').append(cursor.value.note);
						var $deleteBtn2 = $('<td><div class="btn red lighten-2 waves-effect waves-light right"><em>Del</em></div></td>');

						$deleteBtn2.click(function () {
							console.log('Delete ' + cursor.key);
							deleteNote(cursor.key);
						});

						$row.append($keyCell);
						$row.append($nameCell);
						$row.append($subjectCell);
						//$row.append($noteCell);
						$row.append($dateCell);
						$row.append($characters);
						$row.append($deleteBtn2);
						$('#list-wrapper table').append($row);
						
						cursor.continue();
					}
					else {
					    //no more entries
					}
				};
			} else {
				$('#list-wrapper').empty();
				$('#list-wrapper').html('<h3 class="center  ">No Note to show!</h3>');
			}
		};
	} //end renderList()

	// Add new note function
	function addNote(note){
		console.log('adding ' + note.notename);
		var transaction = db.transaction(['notestore'],'readwrite');
		var store = transaction.objectStore('notestore');
		var addRequest = store.add(note);
		addRequest.onerror = function(e) {
			console.log("Error", e.target.error.name);
	        //some type of error handler
	    }
	    addRequest.onsuccess = function(e) {
	    	console.log("added " + note.notename);
	    	$('#notename').val('');
			$('#subject').val('');
			$('#note').val('');
	    	renderList();   	
	    }
	} //end addNote()

	// Create note data model
	function Note(notename, subject, note, date, characters){
		this.notename = notename;
		this.subject = subject;
		this.note = note;
		this.date = date;
		this.characters = characters;
		//this.update = update;
	}

	// Load by key function
	function loadNoteByKey(k){
		var transaction = db.transaction(['notestore'], 'readonly');
		var store = transaction.objectStore('notestore');
		var request = store.get(k);

		request.onerror = function(e) {
		  // Handle errors!
		};
		request.onsuccess = function(e) {
			// Do something with the request.result!
			console.log(request);
			$('#detail').html('<h4><b>' + request.result.subject + "</b>, <em>"+request.result.notename+'</em></h4>');
			$('#detail').append($('<p><label>Author <input type="text" id="notename-detail" value="' + request.result.notename + '"></label></p>'));
			$('#detail').append($('<p/><label>Subject<input type="text" id="subject-detail" value="' + request.result.subject + '"></label></p>'));
			$('#detail').append($('<p><label>Note<textarea id="note-detail" type="text"rows="100" cols="50" class="materialize-textarea">' + request.result.note + '</textarea></p>'));
			$('#detail').append($('<p/><label>Date <div id="date-detail">'+ request.result.date+'</div></label></p>'));

			
			var $div = $('#detail').append('<div class="container"></div>');
			var $delBtn = $('<button class="btn red waves-effect waves-light right">Delete ' + request.result.notename + '</button>');
			$delBtn.click(function(){
		   		console.log('Delete ' + k);
		   		deleteNote(k);
			});
			var $saveBtn = $('<button class="btn amber darken-1 waves-effect waves-light left">Save Changes</button>');
			$saveBtn.click(function(){
				console.log('update ' + k);
				updateNote(k);
			});
			$('#detail-button').html($saveBtn);
			$('#detail-button').append($delBtn);			
			//$('#detail').append($div);
			$('#detail').append('<p></p>');
			$('#detail').show();
			$('#detail-button').show();
		};
	} // end loadNoteByKey()

	// Delete by key
	function deleteNote(k) {
		var transaction = db.transaction(['notestore'], 'readwrite');
		var store = transaction.objectStore('notestore');
		var request = store.delete(k);
		request.onsuccess = function(e){
			renderList();
			$('#detail').empty();
			$('#detail-button').empty();
			$('#detail-button').hide();
			$('#detail').hide();
			
		};
	} // end deleteNote()

	// Update note
	function updateNote(k) {
		var transaction = db.transaction(['notestore'], 'readonly');
		var store = transaction.objectStore('notestore');
		var request = store.get(k);

		request.onerror = function(e) {
		  // Handle errors!
		};
		request.onsuccess = function(e) {
			console.log("hello"+request);
			var nameIn = $('#notename-detail').val();
			var subjectIn = $('#subject-detail').val();
			var noteIn = $('#note-detail').val();
			var dateIn = getTime();
			var characters = String(noteIn).length;
			//var updateIn = getTime();
			if (!nameIn.trim()) {
				alert('Author is Required!');
			} else if (!subjectIn.trim()) {
				alert('Subject is Required!');
			} else if (!noteIn.trim()) {
				alert('Note is Required!');
			} else {
				var note = new Note(nameIn, subjectIn, noteIn, dateIn, characters);
				var transaction = db.transaction(['notestore'], 'readwrite');
				var store = transaction.objectStore('notestore');
				var request = store.put(note, k);
				renderList();
				$('#detail').empty();
				$('#detail-button').hide();
				$('#detail').hide();
			}
		}
	} // end updateNote()

	// delete database
	$('#deleteDB').click(function(e){
		var DBDeleteRequest = indexedDB.deleteDatabase("notes");
	
		DBDeleteRequest.onerror = function(event) {
		console.log("Error deleting database.");
		};
		
		DBDeleteRequest.onsuccess = function(event) {
		console.log("Database deleted successfully");
			
		console.log(event.result); // should be undefined
		refresh();
		};
	});
	

	// SMALL FUNCTIONS

	// Setup new note buttons
	$('#new-btn').click(function(e){
		$('#new-form').toggle();
	});

	// Setup new note buttons
	$('#mynote').click(function(e){
		$('#tables').toggle();
	});
	
	// material init
	$(function() {
	$('select').material_select();
	});
	
	// get time UTC
	$('#getTime').click(function(e){
		alert(getTime());
	})

	// get time UTC
	function getTime(){
		var d = new Date();
		d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
		var utcDate = d.toUTCString();
		return utcDate;
	}
	// setup material parallax
	$('.parallax').parallax();
	
	// suppose to reload the page, but ..
	function refresh() {
		location.reload(true);
	}
	// prevent from html injection
	function encode(message){
		var encodedMsg = $('<div />').text(message).html();
		return encodedMsg;
	  };

}); //end document ready function
