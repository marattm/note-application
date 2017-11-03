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
			var nameIn = $('#notename').val();
			var subjectIn = $('#subject').val();
			// creating a new input : note texte
			var noteIn = $('#note').val();
			var dateStamp = getTime();
			if (!nameIn.trim()) {
				alert('Author is Required!');
			} else if (!subjectIn.trim()) {
				alert('Subject is Required!');
			} else {
				addNote(new Note(nameIn, subjectIn,noteIn,dateStamp));
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

	// Setup new note buttons
	$('#new-btn').click(function(e){
		$('#new-form').toggle();
	});
	// Setup new note buttons
	$('#mynote').click(function(e){
		$('#tables').toggle();
	});
	 $(function() {
		$('select').material_select();
	 });
	  

	// Render List Function
	function renderList(){
		$('#list-wrapper').empty();
		$('#list-wrapper').html('<table><tr><th>Key</th><th>Author</th><th>Subject </th><th>Note</th><th>Date</th></tr></table>');

		//Count Objects
		var transaction = db.transaction(['notestore'], 'readonly');
		var store = transaction.objectStore('notestore');
		var countRequest = store.count();
		countRequest.onsuccess = function(){
			console.log(countRequest.result)
			var count = Number(countRequest.result);
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
						$nameLink.click(function(){
							alert('Clicked ' + $(this).attr('data-key'));
							loadNoteByKey(Number($(this).attr('data-key')));
						});
						var $nameCell = $('<td></td>').append($nameLink);
						var $subjectCell = $('<td></td>').append(cursor.value.subject);
						var $noteCell = $('<td class="content hidecontent"></td>').append(cursor.value.note);
						
						$row.append($keyCell);
						$row.append($nameCell);
						$row.append($subjectCell);
						$row.append($noteCell);
						$row.append($dateCell);
						$('#list-wrapper table').append($row);
						
						cursor.continue();
					}
					else {
					    //no more entries
					}
				};
			} else {
				$('#list-wrapper').empty();
				$('#list-wrapper').html('<h3>No Note to show!</h3>');
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
	function Note(notename, subject, note, date, update){
		this.notename = notename;
		this.subject = subject;
		this.note = note;
		this.date = date;
		this.update = update;
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
			$('#detail').html('<h2>' + request.result.notename + '</h2>');
			$('#detail').append($('<p><label>Author <input type="text" id="notename-detail" value="' + request.result.notename + '"></label></p>'));
			$('#detail').append($('<p/><label>Subject<input type="text" id="subject-detail" value="' + request.result.subject + '"></label></p>'));
			$('#detail').append($('<p><label>Note<textarea id="note-detail" type="text"rows="100" cols="50" class="materialize-textarea">' + request.result.note + '</textarea></p>'));
			$('#detail').append($('<p/><label>Date <div id="date-detail">'+ request.result.date+'</div></label></p>'));

			

			var $delBtn = $('<button class="btn right">Delete ' + request.result.notename + '</button>');
			$delBtn.click(function(){
		   		console.log('Delete ' + k);
		   		deleteNote(k);
			});
			var $saveBtn = $('<button class="btn left">Save Changes</button>');
			$saveBtn.click(function(){
				console.log('update ' + k);
				updateNote(k);
			});
			$('#detail').append($delBtn);
			$('#detail').append($saveBtn);
			$('#detail').append('<p></p>');
			$('#detail').show();
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
			//var updateIn = getTime();
			if (!nameIn.trim()) {
				alert('Author is Required!');
			} else if (!subjectIn.trim()) {
				alert('Subject is Required!');
			} else if (!noteIn.trim()) {
				alert('Note is Required!');
			} else {
				var note = new Note(nameIn, subjectIn, noteIn, dateIn);
				var transaction = db.transaction(['notestore'], 'readwrite');
				var store = transaction.objectStore('notestore');
				var request = store.put(note, k);
				renderList();
				$('#detail').empty();
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
		};
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

}); //end document ready function
