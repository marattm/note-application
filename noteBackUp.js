jQuery(document).ready(function($){
	//console.log('note.js loaded');
	var db;

	var openRequest = indexedDB.open('contacts', 1);

	openRequest.onupgradeneeded = function(e){
		console.log('Upgrading DB...');
		var thisDB = e.target.result;
		if(!thisDB.objectStoreNames.contains('contactstore')) {
			thisDB.createObjectStore('contactstore', { autoIncrement : true });
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
			if (!nameIn.trim()) {
				alert('Author Name is Required!');
			} else if (!subjectIn.trim()) {
				alert('Subject is Required!');
			} else {
				addContact(new Contact(nameIn, subjectIn,noteIn));
				$('#new-form').toggle();
				$('#notename').val('');
				$('#subject').val('');
				console.log('New Contact added.');
			}
		});
		renderList();
	};

	openRequest.onerror = function(e) {
		console.log('Open Error!');
		console.dir(e);
	}

	// Setup new contact buttons
	$('#new-btn').click(function(e){
		$('#new-form').toggle();
	});
	// Setup new contact buttons
	$('#mynote').click(function(e){
		$('#tables').toggle();
	});
	  

	// Render List Function
	function renderList(){
		$('#list-wrapper').empty();
		$('#list-wrapper').html('<table><tr><th>Key</th><th>Author Name</th><th>Subject </th><th>Note</th></tr></table>');

		//Count Objects
		var transaction = db.transaction(['contactstore'], 'readonly');
		var store = transaction.objectStore('contactstore');
		var countRequest = store.count();
		countRequest.onsuccess = function(){
			console.log(countRequest.result)
			var count = Number(countRequest.result);
			// Get all Objects and display if contacts exist
			if (count > 0) {
				var objectStore = db.transaction(['contactstore'], 'readonly').objectStore('contactstore');
				objectStore.openCursor().onsuccess = function(e){
					var cursor = e.target.result;
					if (cursor) {
						var $row = $('<tr>');
						var $keyCell = $('<td>' + cursor.key + '</td>');
						var $nameLink = $('<a href="#" data-key="' + cursor.key + '">' + cursor.value.notename + '</a>');
						$nameLink.click(function(){
							//alert('Clicked ' + $(this).attr('data-key'));
							loadContactByKey(Number($(this).attr('data-key')));
						});
						var $nameCell = $('<td></td>').append($nameLink);
						var $subjectCell = $('<td></td>').append(cursor.value.subject);
						var $noteCell = $('<td class="content hidecontent"></td>').append(cursor.value.note);
						$row.append($keyCell);
						$row.append($nameCell);
						$row.append($subjectCell);
						$row.append($noteCell);
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

	// Add new contact function
	function addContact(contact){
		console.log('adding ' + contact.notename);
		var transaction = db.transaction(['contactstore'],'readwrite');
		var store = transaction.objectStore('contactstore');
		var addRequest = store.add(contact);
		addRequest.onerror = function(e) {
			console.log("Error", e.target.error.name);
	        //some type of error handler
	    }
	    addRequest.onsuccess = function(e) {
	    	console.log("added " + contact.notename);
	    	$('#notename').val('');
			$('#subject').val('');
			$('#note').val('');
	    	renderList();   	
	    }
	} //end addContact()

	// Create contact data model
	function Contact(notename, subject,note){
		this.notename = notename;
		this.subject = subject;
		this.note = note;
	}

	// Load by key function
	function loadContactByKey(k){
		var transaction = db.transaction(['contactstore'], 'readonly');
		var store = transaction.objectStore('contactstore');
		var request = store.get(k);

		request.onerror = function(e) {
		  // Handle errors!
		};
		request.onsuccess = function(e) {
			// Do something with the request.result!
			console.log(request);
			$('#detail').html('<h2>' + request.result.notename + '</h2>');
			$('#detail').append($('<p><label>Author Name: <input type="text" id="notename-detail" value="' + request.result.notename + '"></label></p>'));
			$('#detail').append($('<p/><label>Subject: <input type="text" id="subject-detail" value="' + request.result.subject + '"></label></p>'));
			$('#detail').append($('<p><label>Note<textarea id="note" type="text"rows="100" cols="50" class="materialize-textarea">' + request.result.note + '</textarea></p>'));

			

			var $delBtn = $('<button class="btn right">Delete ' + request.result.notename + '</button>');
			$delBtn.click(function(){
		   		console.log('Delete ' + k);
		   		deleteContact(k);
			});
			var $saveBtn = $('<button class="btn left">Save Changes</button>');
			$saveBtn.click(function(){
				console.log('update ' + k);
				updateContact(k);
			});
			$('#detail').append($delBtn);
			$('#detail').append($saveBtn);
			$('#detail').show();
		};
	} // end loadContactByKey()

	// Delete by key
	function deleteContact(k) {
		var transaction = db.transaction(['contactstore'], 'readwrite');
		var store = transaction.objectStore('contactstore');
		var request = store.delete(k);
		request.onsuccess = function(e){
			renderList();
			$('#detail').empty();
			$('#detail').hide();
		};
	} // end deleteContact()

	// Update contact
	function updateContact(k) {
		var nameIn = $('#notename-detail').val();
		var subjectIn = $('#subject-detail').val();
		if (!nameIn.trim()) {
			alert('Author Name is Required!');
		} else if (!subjectIn.trim()) {
			alert('Subject is Required!');
		} else if (!noteIn.trim()) {
			alert('Note is Required!');
		} else {
			var contact = new Contact(nameIn, subjectIn,noteIn);
			var transaction = db.transaction(['contactstore'], 'readwrite');
			var store = transaction.objectStore('contactstore');
			var request = store.put(contact, k);
			renderList();
			$('#detail').empty();
			$('#detail').hide();
		}
	} // end updateContact()

}); //end document ready function
