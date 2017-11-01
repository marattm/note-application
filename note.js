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
			var nameIn = $('#fullname').val();
			var emailIn = $('#email').val();
			if (!nameIn.trim()) {
				alert('Full Name is Required!');
			} else if (!emailIn.trim()) {
				alert('Email is Required!');
			} else {
				addContact(new Contact(nameIn, emailIn));
				$('#new-form').toggle();
				$('#fullname').val('');
				$('#email').val('');
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

	// Render List Function
	function renderList(){
		$('#list-wrapper').empty();
		$('#list-wrapper').html('<table><tr><th>Key</th><th>Full Name</th><th>Email Address</th></tr></table>');

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
						var $nameLink = $('<a href="#" data-key="' + cursor.key + '">' + cursor.value.fullname + '</a>');
						$nameLink.click(function(){
							//alert('Clicked ' + $(this).attr('data-key'));
							loadContactByKey(Number($(this).attr('data-key')));
						});
						var $nameCell = $('<td></td>').append($nameLink);
						var $emailCell = $('<td></td>').append(cursor.value.email);
						$row.append($keyCell);
						$row.append($nameCell);
						$row.append($emailCell);
						$('#list-wrapper table').append($row);
						cursor.continue();
					}
					else {
					    //no more entries
					}
				};
			} else {
				$('#list-wrapper').empty();
				$('#list-wrapper').html('<h3>No Contacts to show!</h3>');
			}
		};
	} //end renderList()

	//add new contact function
	function addContact(contact){
		console.log('adding ' + contact.fullname);
		var transaction = db.transaction(['contactstore'],'readwrite');
		var store = transaction.objectStore('contactstore');
		var addRequest = store.add(contact);
		addRequest.onerror = function(e) {
			console.log("Error", e.target.error.name);
	        //some type of error handler
	    }
	    addRequest.onsuccess = function(e) {
	    	console.log("added " + contact.fullname);
	    	$('#fullname').val('');
			$('#email').val('');
	    	renderList();   	
	    }
	} //end addContact()

	// Create contact data model
	function Contact(fullname, email){
		this.fullname = fullname;
		this.email = email;
	}

	// load by key function
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
			$('#detail').html('<h2>Show contact ' + request.result.fullname + '</h2>');
			$('#detail').append($('<label>Full Name: <input type="text" id="fullname-detail" value="' + request.result.fullname + '"></label><br>'));
			$('#detail').append($('<label>Email: <input type="email" id="email-detail" value="' + request.result.email + '"></label><br>'));
			var $delBtn = $('<button>Delete ' + request.result.fullname + '</button>');
			$delBtn.click(function(){
		   		console.log('Delete ' + k);
		   		deleteContact(k);
			});
			var $saveBtn = $('<button>Save Changes</button>');
			$saveBtn.click(function(){
				console.log('update ' + k);
				updateContact(k);
			});
			$('#detail').append($delBtn);
			$('#detail').append($saveBtn);
			$('#detail').show();
		};
	} // end loadContactByKey()

	// delete by key
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

	// update contact
	function updateContact(k) {
		var nameIn = $('#fullname-detail').val();
		var emailIn = $('#email-detail').val();
		if (!nameIn.trim()) {
			alert('Full Name is Required!');
		} else if (!emailIn.trim()) {
			alert('Email is Required!');
		} else {
			var contact = new Contact(nameIn, emailIn);
			var transaction = db.transaction(['contactstore'], 'readwrite');
			var store = transaction.objectStore('contactstore');
			var request = store.put(contact, k);
			renderList();
			$('#detail').empty();
			$('#detail').hide();
		}
	} // end updateContact()

}); //end document ready function







