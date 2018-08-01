$(document).ready(function(){
			//This will need to be removed when it's uploaded to phone...
			document.addEventListener('deviceready', onDeviceReady,false);
			//onDeviceReady();
			checkInternet();
			checkNumConferences();
			fill_conference_data();
			checkAndUpdateCurConference();
			
			//check the status of the internet every 10 seconds
			setInterval(function(){
				checkInternet();
			}, 10000);
});

var destinationType;
function onDeviceReady(){
		attendees = new Object(); //this can be done on declaration
		pictureSource=navigator.camera.PictureSourceType;
		destinationType=navigator.camera.DestinationType;
}

var apiURL = "https://reg.bookmein2.com/api/api.php";
var isInternet = true;
var numconferences = 0;
var curconf = -1;
var curapikey = "";

function checkInternet(){
	isInternet = true;
}

function checkInternet(){
	var data = "action=checkconnection"; 
	var success = false;
	
	$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
			error: function(){
					// will fire when timeout is reached
					isInternet = false;
			},
			success: function(response){
				if(response.success){
					isInternet = true;
				}else{
					isInternet = false;
				}
			},
			timeout: 3000 // sets timeout to 3 seconds
	});
}

function checkNumConferences(){
	if (localStorage.getItem("numconferences") !== null) {
		numconferences = localStorage.getItem("numconferences");
	}else{
		numconferences = 0;
	}
}

function checkAndUpdateCurConference(){
	
	if (localStorage.getItem("curconference") !== null) {
		curconference = localStorage.getItem("curconference");
		curapikey = localStorage.getItem("curapikey");
		refreshConferenceData(curconference, true);
	}else{
		curconf = -1;
		curapikey = "";
		location.href = "#delegateLogin";
	}
}


$(document).on('click',"#login_btn",function() {
	location.href = "#delegateLogin";
});

$(document).on('click', '.returnhome', function(){
	location.href = "#delegateIndex";
	
});

$(document).on('click',".gotomeetingbutton",function() {
	var clicked_button_Id = $(this).attr('id').split("-")[1];
	$('#selectedmeeting').val(clicked_button_Id);
	showMeetingDetails();
	location.href = "#delegateMeetingDetails";
});

$(document).on('click',".gotoseminar",function() {
	var clicked_button_Id = $(this).attr('id').split("-")[1];
	$('#selectedseminar').val(clicked_button_Id);
	showSeminarDetails();
	location.href = "#delegateSeminarDetails";
});

$(document).on('click', ".speakerlist", function(e){
	e.preventDefault();
	var clicked_button_Id = $(this).attr('id').split("-")[1];
	$('#selectedspeaker').val(clicked_button_Id);
	showSpeakerDetails();
	
	location.href = "#delegateSpeaker_Profile";
	
});

$(document).on('keyup', '#search_people_bar', function(e){
	var searchstring = $(this).val().toLowerCase();
	$('.personlist_name').each(function(){
		if(searchstring==''){
			//nothing entiered, so show all
			$(this).parent().show();
		}else{
			var thisname = $(this).html().toLowerCase();
			if(thisname.indexOf(searchstring)>=0){
				$(this).parent().show();
			}else{
				$(this).parent().hide();
			}
		}
		
	});
});


$(document).on('click',".conf_btn_delete",function(e){
	var thisid = $(this).attr('id').split("_")[1];
	clearConference(thisid);
	fill_conference_data();
});

$(document).on('click',".conf_btn",function() {		
	var thisid = $(this).attr('id').split("_")[1];
	
	curconf = thisid;
	curconference = thisid;
	curapikey = localStorage.getItem("conf_"+thisid+"_apikey");
	localStorage.setItem('curconference', curconf);
	localStorage.setItem('curapikey', curapikey);
	refreshConferenceData(thisid, true);
	location.href = "#delegateHome";
});

$(document).on('click', '#gdpr_terms_link', function(e){
	e.preventDefault();
	document.getElementById("gdpr_terms_modal").style.display = "initial";
});

$(document).on('click',"#gdpr_terms_modal",function(e) {
	e.preventDefault();
	$("#gdpr_terms_modal").attr("style",'display:none;');
});

$(document).on('click', '#arrange_meeting_btn', function(e){
	e.preventDefault();
	$('#person_profile_meeting_schdlr_div').slideDown();
});

$(document).on('click', '#cancel_schdlr_btn', function(e){
	e.preventDefault();
	$('#person_profile_meeting_schdlr_div').slideUp();
});

$(document).on('click', '#meeting_back_button', function(e){
	location.href = "#delegateManage_Meeting";
});

$(document).on('click',"#log_in_btn",function(e){
	var action = "login";
	var email = $('#login_form').find('input[name="email"]').val();
	var eventref = $('#login_form').find('input[name="event_id"]').val();
	var attendeeref = $('#login_form').find('input[name="attendee_id"]').val();
	var errors = [];
	
	var goodform = true;
	if(!isInternet){
		goodform = false;
		errors.push("You need to be connected to the internet to log in");
	}
	if(email==''){
		goodform = false;
		errors.push("Your email address cannot be blank");
	}
	if(eventref==''){
		goodform = false;
		errors.push("The event reference cannot be blank");
	}
	if(attendeeref==''){
		goodform = false;
		errors.push("Your attendee reference cannot be blank");
	}
	
	if(goodform){
		data = "action=login&email="+email+"&eventref="+eventref+"&attendeeref="+attendeeref
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post'
		}).done(function(response){
			if(response.success){
				if(response.data.loggedin){
					numconferences++;
					
					localStorage.setItem("conf_"+numconferences+"_apikey", response.data.apikey);
					localStorage.setItem("conf_"+numconferences+"_userid", response.data.userid);
					localStorage.setItem("conf_"+numconferences+"_reference", response.data.reference);
					localStorage.setItem("conf_"+numconferences+"_first_name", response.data.first_name);
					localStorage.setItem("conf_"+numconferences+"_last_name", response.data.last_name);
					localStorage.setItem("conf_"+numconferences+"_organisation", response.data.organisation);
					localStorage.setItem("conf_"+numconferences+"_job_title", response.data.job_title);
					localStorage.setItem("conf_"+numconferences+"_email", response.data.email);
					localStorage.setItem("conf_"+numconferences+"_bio", response.data.bio);
					localStorage.setItem("conf_"+numconferences+"_mapcoords", response.data.conf_mapcoords);
					
					
					localStorage.setItem("conf_"+numconferences+"_id", response.data.conferenceid);
					localStorage.setItem("conf_"+numconferences+"_image", response.data.conf_id);
					localStorage.setItem("conf_"+numconferences+"_desc", response.data.conf_desc);
					localStorage.setItem("conf_"+numconferences+"_name", response.data.conf_name);
					localStorage.setItem("conf_"+numconferences+"_meetingslist", "");
					localStorage.setItem("conf_"+numconferences+"_seminarist", "");
					localStorage.setItem("conf_"+numconferences+"_speakerslist", "");
					localStorage.setItem("conf_"+numconferences+"_active", 1);
					
					localStorage.setItem("numconferences", numconferences);
					
					fill_conference_data();
					location.href = "#delegateIndex";
				}else{
					$('#login_response').html("The details you entered did not match an account in our system");
				}
			}else{
				$('#login_response').html("Unable to call API.  Error: "+response.error);
			}
		});
	}else{
		var errorstring = errors.join("<br>");
		$('#login_response').html(errorstring);
	}
});

$(document).on('click',"#updt_profile_btn",function() {

	if(isInternet){
		var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
		var data = "action=updateprofile&apikey="+thisapikey;
		data += "&job_title="+encodeURIComponent($('#delegateUser_Profile').find('input[name="role"]').val());
		data += "&bio="+encodeURIComponent($('#delegateUser_Profile').find('textarea[name="bio"]').val());
		data += "&first_name="+encodeURIComponent($('#delegateUser_Profile').find('input[name="f_name"]').val());
		data += "&last_name="+encodeURIComponent($('#delegateUser_Profile').find('input[name="s_name"]').val());
		data += "&organisation="+encodeURIComponent($('#delegateUser_Profile').find('input[name="org"]').val());
		if( typeof(receiptPicture)!==null && receiptPicture!=null && receiptPicture!='' && receiptPicture!='null'){
			data += "&profileimage="+encodeURIComponent(receiptPicture);
		}
		$('#piccyoutput').val(receiptPicture);
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			refreshProfilePage();
			//$('#piccyoutput').html(response); 
			if(response.success){
				$('#profilestatusresponse').html("Succesfully updated profile");
			}
		});
	}else{
		$('#profilestatusresponse').html("You need an active internet connection to update your profile");
	}
	
});

$(document).on('click', '#reject_meeting_btn', function(){
	respondMeeting('refuse');
});

$(document).on('click', '#accept_meeting_btn', function(){
	respondMeeting('accept');
});

$(document).on('click', '#rearrange_meeting_send_btn', function(){
	var selectedmeeting = $('#selectedmeeting').val();
	var meetinglist = localStorage.getItem("conf_"+numconferences+"_meetingslist");
	if(isInternet){
		if(meetinglist!=''){
			var meetinglistarray = meetinglist.split(",");
			var pos = meetinglistarray.indexOf(selectedmeeting);
			if(pos>=0){
				//now we actually reject
				var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
				var data = "action=respondmeeting&apikey="+thisapikey;
				var response = $('#sent_meeting_response_textarea').val();
				data += "&meetingid="+selectedmeeting+"&type=rearrange&message="+response;
				var newdate = $('#sent_meeting_rearrange_date').val();
				var newlocation = $('#sent_meeting_rearrange_location').val();
				data += "&newdate="+newdate+"&newloc="+newlocation;
				$.ajax({
				url: apiURL,
					data: data,
					dataType: "json",
					type: 'post',
				}).done(function(response){
					refreshProfilePage();
					//$('#piccyoutput').html(response); 
					if(response.success){
						$('#meeting_response_success').html("Responded with new meeting request");
						getMeetingRequests(showMeetingDetails);
					}
				});
			}else{
				//meeting not found, redirect to meetings page
				location.href = "#delegateManage_Meeting";
			}
		}else{
			//meeting not found, redirect to meetings page
			location.href = "#delegateManage_Meeting";
		}
	}else{
		$('#meeting_response_error').html("You need an active internet connection to respond to meeting requests");
	}
});

$(document).on('click', '#amend_meeting_btn', function(e){
	e.preventDefault();
	$('#sent_meeting_location').hide();
	$('#sent_meeting_date').hide();
	$('#sent_meeting_rearrange_date_span').show();
	$('#sent_meeting_rearrange_location_span').show();
	$('#accept_meeting_btn').hide();
	$('#amend_meeting_btn').hide();
	$('#reject_meeting_btn').hide();
	$('#rearrange_meeting_send_btn').show();
});

function respondMeeting(type){
	
	var selectedmeeting = $('#selectedmeeting').val();
	var meetinglist = localStorage.getItem("conf_"+numconferences+"_meetingslist");
	if(isInternet){
		if(meetinglist!=''){
			var meetinglistarray = meetinglist.split(",");
			var pos = meetinglistarray.indexOf(selectedmeeting);
			if(pos>=0){
				//now we actually reject
				var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
				var data = "action=respondmeeting&apikey="+thisapikey;
				var response = $('#sent_meeting_response_textarea').val();
				data += "&meetingid="+selectedmeeting+"&type="+type+"&message="+response;
				$.ajax({
				url: apiURL,
					data: data,
					dataType: "json",
					type: 'post',
				}).done(function(response){
					refreshProfilePage();
					//$('#piccyoutput').html(response); 
					if(response.success){
						$('#meeting_response_success').html("Accepted meeting");
						getMeetingRequests(showMeetingDetails);
					}
				});
			}else{
				//meeting not found, redirect to meetings page
				location.href = "#delegateManage_Meeting";
			}
		}else{
			//meeting not found, redirect to meetings page
			location.href = "#delegateManage_Meeting";
		}
	}else{
		$('#meeting_response_error').html("You need an active internet connection to respond to meeting requests");
	}
}

$(document).on('click', '#send_meeting_btn', function(e){
	e.preventDefault();
	$('#otherprofilestatusresponse').hide();
	if(isInternet){
		if($('#createmeeting_date').val()!=''){
			var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
			var data = "action=requestmeeting&apikey="+thisapikey;
			var meetingtime = $('#createmeeting_date').val();
			var meetingtime = $('#createmeeting_location').val();
			var meetingtime = $('#createmeeting_message').val();
			
			data += "&meeting_date="+encodeURIComponent($('#createmeeting_date').val());
			data += "&location="+encodeURIComponent($('#schdlr_lctn').val());
			data += "&message="+encodeURIComponent($('#schdlr_msg').val());
			data += "&receiverref="+encodeURIComponent($('#selectedattendeeref').val());
			$.ajax({
				url: apiURL,
				data: data,
				dataType: "json",
				type: 'post',
			}).done(function(response){
				location.href = '#delegateAgenda';
			});
		}else{
			$('#otherprofilestatusresponse').show();
			$('#otherprofilestatusresponse').html("You need to pick a date for the meeting");
			
		}
	}else{
		$('#otherprofilestatusresponse').show();
		$('#otherprofilestatusresponse').html("You need an active internet connection to request a meeting");
	}
});

//sets target attendeeref when you click a person, then loads data and redirects to profile
$(document).on('click',".clickbuttongetgetperson",function(e) {
	var thisid = $(this).attr('id').split("-")[1];
	getAttendeeProfile(thisid);
	location.href = "#delegatePerson_Profile";
}); 

$(document).on('click',"#imagepickerprofile",function() {
	navigator.camera.getPicture(onPhotoURISuccess, onFail, { 
		quality: 20,
		destinationType: destinationType.DATA_URL,
		sourceType: pictureSource.PHOTOLIBRARY
	});
});
var receiptPicture;
function onPhotoURISuccess(ReceiptPhoto){
	$('#profilepicture').attr('src', "data:image/jpeg;base64,"+ReceiptPhoto);
	//$('#piccyoutput').val(ReceiptPhoto);
	receiptPicture = ReceiptPhoto;
}
function onFail(){
	alert("Please try selecting the file again");
}
var base_image = null;

function refreshProfilePage(){
	var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
	var data = "action=getattendee&apikey="+thisapikey+"&attendeeref="+localStorage.getItem("conf_"+curconference+"_reference");
	
	if(isInternet){
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			localStorage.setItem("conf_"+curconference+"_first_name", response.data.first_name);
			localStorage.setItem("conf_"+curconference+"_last_name", response.data.last_name);
			localStorage.setItem("conf_"+curconference+"_organisation", response.data.organisation);
			localStorage.setItem("conf_"+curconference+"_job_title", response.data.job_title);
			localStorage.setItem("conf_"+curconference+"_bio", response.data.bio);
			
			
			$('#f_name').val(localStorage.getItem("conf_"+curconference+"_first_name"));
			$('#s_name').val(localStorage.getItem("conf_"+curconference+"_last_name"));
			$('#org').val(localStorage.getItem("conf_"+curconference+"_organisation"));
			$('#job_title').val(localStorage.getItem("conf_"+curconference+"_job_title"));
			$('#bio').val(localStorage.getItem("conf_"+curconference+"_bio"));

		});
	}else{
		$('#f_name').val(localStorage.getItem("conf_"+curconference+"_first_name"));
		$('#s_name').val(localStorage.getItem("conf_"+curconference+"_last_name"));
		$('#org').val(localStorage.getItem("conf_"+curconference+"_organisation"));
		$('#job_title').val(localStorage.getItem("conf_"+curconference+"_job_title"));
		$('#bio').val(localStorage.getItem("conf_"+curconference+"_bio"));
	}
	
}

function refreshCurConference(){
	
	$('#conference_name').html(localStorage.getItem("conf_"+curconference+"_name"));
	$('.conference_name').html(localStorage.getItem("conf_"+curconference+"_name"));
	$('#conference_desc').html(localStorage.getItem("conf_"+curconference+"_desc"));
	$('#conference_image').attr('src', 'data:image/png;base64,'+localStorage.getItem("conf_"+curconference+"_image"));
	
	var mapcoords = localStorage.getItem("conf_"+curconference+"_mapcoords");
	if(mapcoords!=''){
		lat = mapcoords.split(",")[0];
		lon = mapcoords.split(",")[1];
		$('#conf_map_link_a').attr('href', 'http://www.google.com/maps/@'+lat+','+lon+',13z');
	}
}

function getAttendeeList(){
	if(isInternet){
		var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
		var data = "action=getattendees&apikey="+thisapikey+"&attendeeref="+localStorage.getItem("conf_"+curconference+"_reference");
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			if(response.success){
				var output = "";
				for(var i = 0;i<response.data.attendees.length;i++){
					if(response.data.attendees[i].reference != localStorage.getItem("conf_"+curconference+"_reference")){
						output += "<button id='person-"+response.data.attendees[i].reference+"' class='clickbuttongetgetperson personlist ui-btn ui-shadow ui-corner-all'>\n";
						output += "<p class='personlist_name'>"+response.data.attendees[i].first_name+" "+response.data.attendees[i].last_name+"</p>";
						output += "<div><p>"+response.data.attendees[i].organisation+"</p>";
						output += "<h3 class='morebutton' >more...</h3>";
						output += "</div></button>";
					}
				}
				$('#people_list').html(output);
			}else{
				$('#people_list').html("Unable to get list of attendees: "+response.error);
			}
		});
		
	}else{
		$('#people_list').html("You need to be connected to the internet to see the list of attendees.  <a href='#' onclick='javascript:getAttendeeList()'>Refresh</a>");
	}
}

function getSpeakers(callback){
	if(isInternet){
		var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
		var data = "action=getspeakers&apikey="+thisapikey;
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			if(response.success){
				var speakerslist = [];
				for(var i=0;i<response.data.speakers.length;i++){
					localStorage.setItem("conf_"+curconference+"_speakers_"+response.data.speakers[i].id+"_first_name", response.data.speakers[i].first_name);
					localStorage.setItem("conf_"+curconference+"_speakers_"+response.data.speakers[i].id+"_last_name", response.data.speakers[i].last_name);
					localStorage.setItem("conf_"+curconference+"_speakers_"+response.data.speakers[i].id+"_organisation", response.data.speakers[i].organisation);
					localStorage.setItem("conf_"+curconference+"_speakers_"+response.data.speakers[i].id+"_job_title", response.data.speakers[i].job_title);
					localStorage.setItem("conf_"+curconference+"_speakers_"+response.data.speakers[i].id+"_email", response.data.speakers[i].email);
					localStorage.setItem("conf_"+curconference+"_speakers_"+response.data.speakers[i].id+"_bio", response.data.speakers[i].bio);
					localStorage.setItem("conf_"+curconference+"_speakers_"+response.data.speakers[i].id+"_profile_pic", response.data.speakers[i].profile_pic);
					localStorage.setItem("conf_"+curconference+"_speakers_"+response.data.speakers[i].id+"_id", response.data.speakers[i].id);
					speakerslist.push(response.data.speakers[i].id);
				}
				localStorage.setItem("conf_"+curconference+"_speakerslist", speakerslist.join(","));
				if(callback!=''){
					callback();
				}
			}
		});
	}else{
		if(callback!=''){
			callback();
		}
	}
}

function showSpeakers(){
	
	var speakerslist = localStorage.getItem("conf_"+numconferences+"_speakerslist");
	if(speakerslist!=''){
		var speakerslistarray = speakerslist.split(",");
		var output = "";
		speakerslistarray.forEach(function(item, index){
				output += "<button class='speakerlist ui-btn ui-shadow ui-corner-all' id='speaker-"+localStorage.getItem("conf_"+curconference+"_speakers_"+item+"_id")+"'>";
				output += "<p>"+localStorage.getItem("conf_"+curconference+"_speakers_"+item+"_first_name")+ " " + localStorage.getItem("conf_"+curconference+"_speakers_"+item+"_last_name") +"</p>";
				output += "<div><p>"+localStorage.getItem("conf_"+curconference+"_speakers_"+item+"_organisation")+"</p>";
				output += "</div></button>";
		});
		$('#speakers_list').html(output);
	}
	
}

function showSpeakerDetails(){
	
	var selectedspeaker = $('#selectedspeaker').val();
	var speakerslist = localStorage.getItem("conf_"+numconferences+"_speakerslist");
	if(speakerslist!=''){
		var speakerslistarray = speakerslist.split(",");
		var pos = speakerslistarray.indexOf(selectedspeaker);
		if(pos>=0){
			
			$('#speaker_first_name').html(localStorage.getItem("conf_"+curconference+"_speakers_"+selectedspeaker+"_first_name"));
			$('#speaker_last_name').html(localStorage.getItem("conf_"+curconference+"_speakers_"+selectedspeaker+"_last_name"));
			$('#speaker_organisation').html(localStorage.getItem("conf_"+curconference+"_speakers_"+selectedspeaker+"_organisation"));
			$('#speaker_job_title').val(localStorage.getItem("conf_"+curconference+"_speakers_"+selectedspeaker+"_job_title"));
			
			var job_title = localStorage.getItem("conf_"+curconference+"_speakers_"+selectedspeaker+"_job_title");
			if(typeof(job_title)===null || typeof(job_title)==null|| job_title==null || job_title==''|| job_title=="null"|| job_title=='null'){
				$('#speaker_job_title').html("");
			}else{
				$('#speaker_job_title').html(" - "+job_title);
			}
			
			var bio = localStorage.getItem("conf_"+curconference+"_speakers_"+selectedspeaker+"_bio");
			if(typeof(bio)===null || typeof(bio)==null|| bio==null || bio==''|| bio=="null"|| bio=='null'){
				$('#speakerbio').html("");
			}else{
				$('#speakerbio').html(bio);
			}
			
			var profileimage = localStorage.getItem("conf_"+curconference+"_speakers_"+selectedspeaker+"_profile_pic");
			if(!isInternet || typeof(profileimage)===null || typeof(profileimage)==null|| profileimage==null || profileimage==''|| profileimage=="null"|| profileimage=='null'){
				$('#speaker_profile_img').attr('src', 'profile_placeholder.jpeg');
			}else{
				$('#speaker_profile_img').attr('src', profileimage);
			}
			
		}else{
			//speaker not found, redirect to speakers list
			location.href = "#delegateSpeakers_List";
		}
	}else{
		//speaker not found, redirect to speakers list
		location.href = "#delegateSpeakers_List";
	}
}

function checkSpeakerSelected(){
	var thisspeakerid = $('#selectedspeaker').val();
	if(thisspeakerid==''){
		location.href = "#delegateSpeakers_List";
	}
	
}

function checkUserSelected(){
	var thisattendeeref = $('#selectedattendeeref').val();
	if(thisattendeeref==''){
		location.href = "#delegateFind_People";
	}
}

function getAttendeeProfile(attendeeref){
	$('#other_profile_error').hide();
	if(isInternet){
		var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
		var data = "action=getattendee&apikey="+thisapikey;
		data += "&attendeeref="+attendeeref;
		$('#selectedattendeeref').val(attendeeref);
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			if(response.success){
				$('#other_profile_first_name').html(response.data.first_name);
				$('#other_profile_last_name').html(response.data.last_name);
				$('#other_profile_organisation').html(response.data.organisation);
				$('#other_profile_job_title').html(response.data.job_title);
				$('#other_profile_bio').html(response.data.bio);
				
				if(typeof(response.data.profileimg_thumb)===null || typeof(response.data.profileimg_thumb)==null|| response.data.profileimg_thumb==null || response.data.profileimg_thumb==''|| response.data.profileimg_thumb=="null"|| response.data.profileimg_thumb=='null'){
					$('#other_profile_img').attr('src', "profile_placeholder.jpeg");
				}else{
					$('#other_profile_img').attr('src', "https://reg.bookmein2.com/images/profile/"+response.data.conferenceid+"/"+response.data.profileimg_thumb);
				}
			}else{
				$('#other_profile_error').html("Unable to get list of attendees: "+response.error);
				$('#other_profile_first_name').html(response.data.first_name);
				$('#other_profile_last_name').html(response.data.last_name);
				$('#other_profile_organisation').html(response.data.organisation);
				$('#other_profile_job_title').html(response.data.job_title);
				$('#other_profile_bio').html(response.data.bio);
				$('#other_profile_img').attr('src', "profile_placeholder.jpeg");
				$('#other_profile_error').show();
			}
		});
	}else{
		$('#other_profile_error').html("You need to be connected to the internet to view user profiles");
		$('#other_profile_first_name').html(response.data.first_name);
		$('#other_profile_last_name').html(response.data.last_name);
		$('#other_profile_organisation').html(response.data.organisation);
		$('#other_profile_job_title').html(response.data.job_title);
		$('#other_profile_bio').html(response.data.bio);
		$('#other_profile_img').attr('src', "profile_placeholder.jpeg");
		$('#other_profile_error').show();
	}
}

function refreshConferenceData(conferenceid, updatecurconf){
	//update conference details, get details of meetings
	
	var thisapikey = localStorage.getItem("conf_"+conferenceid+"_apikey");
	var data = "action=getconferencedetails&apikey="+thisapikey;
	
	$.ajax({
		url: apiURL,
		data: data,
		dataType: "json",
		type: 'post',
	}).done(function(response){
		localStorage.setItem("conf_"+numconferences+"_mapcoords", response.data.conf_mapcoords);
		localStorage.setItem("conf_"+numconferences+"_image", response.data.conf_image);
		localStorage.setItem("conf_"+numconferences+"_desc", response.data.conf_desc);
		localStorage.setItem("conf_"+numconferences+"_name", response.data.conf_name);
		
		if(updatecurconf){
			refreshCurConference();
		}
		
		lastupdate = Date.now();
		setlastupdatedtime();
	});
	
}

function fill_conference_data(){
	var conflisthtml = "";
	
	for(var i = 1; i<=numconferences;i++){
		if(localStorage.getItem("conf_"+i+"_active")=='1'){
			conflisthtml += "<div class='row conferencelistrow'>";
			conflisthtml += "<div id='conference_"+i+"' class='conf_btn fakebutton col-8'>";
			conflisthtml += "<h1 id='conf_name_login_"+i+"'>"+localStorage.getItem("conf_"+i+"_name")+"</h1>";
			conflisthtml += "<p id='email_login_"+i+"'>"+localStorage.getItem("conf_"+i+"_email")+"</p>";
			conflisthtml += "</div>";
			conflisthtml += "<div id='conferencedelete_"+i+"' class='conf_btn_delete fakebutton col-4'>";
			conflisthtml += "<div class='conferencedeletetext'>Remove</div>"
			conflisthtml += "</div></div>";
		}
	}
	
	$('#user_conferences').html(conflisthtml);
	
}

var updatingmeetings = false
function getMeetingRequests(callback){
	$('#other_profile_error').hide();
	if(isInternet){
		var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
		var data = "action=getmeetings&apikey="+thisapikey+"&attendeeref="+localStorage.getItem("conf_"+curconference+"_reference");
		updatingmeetings = true;
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			if(response.success){
				var meetingslist = [];
				for(var i=0;i<response.data.meetings.length;i++){
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_meeting_date", response.data.meetings[i].meeting_date);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_date_sent", response.data.meetings[i].date_sent);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_sender_message", response.data.meetings[i].sender_message);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_location", response.data.meetings[i].location);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_sender_reference", response.data.meetings[i].sender_reference);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_response", response.data.meetings[i].receiver_response);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_reference", response.data.meetings[i].receiver_reference);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_sender_first_name", response.data.meetings[i].sender_first_name);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_sender_last_name", response.data.meetings[i].sender_last_name);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_sender_organisation", response.data.meetings[i].sender_organisation);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_sender_job_title", response.data.meetings[i].sender_job_title);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_sender_bio", response.data.meetings[i].sender_bio);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_first_name", response.data.meetings[i].receiver_first_name);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_last_name", response.data.meetings[i].receiver_last_name);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_organisation", response.data.meetings[i].receiver_organisation);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_job_title", response.data.meetings[i].receiver_job_title);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_bio", response.data.meetings[i].receiver_bio);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_last_update", response.data.meetings[i].last_update);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_status", response.data.meetings[i].status);
					meetingslist.push(response.data.meetings[i].id);
				}
				localStorage.setItem("conf_"+numconferences+"_meetingslist", meetingslist.join(","));
				if(callback!=''){
					callback();
				}
			}
			updatingmeetings = false;
		});
	}else{
		if(callback!=''){
			callback();
		}
	}
	
}

var updatingseminars = false;
function getSeminars(callback){
	$('#other_profile_error').hide();
	if(isInternet){
		var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
		var data = "action=getseminars&apikey="+thisapikey;
		updatingseminars = true;
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			if(response.success){
				var seminarlist = [];
				for(var i=0;i<response.data.seminars.length;i++){
					localStorage.setItem("conf_"+curconference+"_seminar_"+response.data.seminars[i].id+"_seminar_reference", response.data.seminars[i].seminar_reference);
					localStorage.setItem("conf_"+curconference+"_seminar_"+response.data.seminars[i].id+"_seminar_name", response.data.seminars[i].seminar_name);
					localStorage.setItem("conf_"+curconference+"_seminar_"+response.data.seminars[i].id+"_start_time", response.data.seminars[i].start_time);
					localStorage.setItem("conf_"+curconference+"_seminar_"+response.data.seminars[i].id+"_end_time", response.data.seminars[i].end_time);
					localStorage.setItem("conf_"+curconference+"_seminar_"+response.data.seminars[i].id+"_location", response.data.seminars[i].location);
					seminarlist.push(response.data.seminars[i].id);
				}
				localStorage.setItem("conf_"+numconferences+"_seminarlist", seminarlist.join(","));
				if(callback!=''){
					callback();
				}
				updatingseminars = false
			}
		});
	}else{
		if(callback!=''){
			callback();
		}
	}
	
}

var updatingagendainterval;
function updateAgenda(){
	if(isInternet){
		getSeminars('');
		getMeetingRequests('');
		updatingagendainterval = setInterval(function(){
			if(!updatingseminars && !updatingmeetings){
				updateAgendaPage(true);
			}
		}, 100);
	}else{
		updateAgendaPage(false);
	}
}

function updateAgendaPage(clearint){
	if(clearint){
		clearInterval(updatingagendainterval);
	} 
	//first we need to get an ordered list of the elements
	var agenda = [];
	var meetinglist = localStorage.getItem("conf_"+numconferences+"_meetingslist");
	if(meetinglist!=''){
		var meetinglistarray = meetinglist.split(",");
		var output = "";
		meetinglistarray.forEach(function(item, index){
			var status = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_status");
			if(status=='Accepted' || status=='Pending'){
				var thismeeting = [];
				thismeeting['type'] = "Meeting";
				thismeeting['date'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_meeting_date");
				thismeeting['id'] = item;
				thismeeting['status'] = status;
				thismeeting['location'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_location");
				if(localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_reference") == localStorage.getItem("conf_"+curconference+"_reference")){
					//this user is the sender
					thismeeting['incoming'] = 0;
					thismeeting['first_name'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_first_name");
					thismeeting['last_name'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_last_name");
					thismeeting['organisation'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_organisation");
					thismeeting['job_title'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_job_title");
				}else{
					//this user is the receiver
					thismeeting['incoming'] = 1;
					thismeeting['first_name'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_first_name");
					thismeeting['last_name'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_last_name");
					thismeeting['organisation'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_organisation");
					thismeeting['job_title'] = localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_job_title");
				}
				agenda.push(thismeeting);
			}
		});
	}
	var seminarlist = localStorage.getItem("conf_"+numconferences+"_seminarlist");
	if(seminarlist!=''){
		var seminarlistarray = seminarlist.split(",");
		var output = "";
		seminarlistarray.forEach(function(item, index){
			var thisseminar = [];
			thisseminar['type'] = "Seminar";
			thisseminar['id'] = item;
			thisseminar['date'] = localStorage.getItem("conf_"+curconference+"_seminar_"+item+"_start_time");
			thisseminar['end_date'] = localStorage.getItem("conf_"+curconference+"_seminar_"+item+"_end_date");
			thisseminar['name'] = localStorage.getItem("conf_"+curconference+"_seminar_"+item+"_seminar_name");
			thisseminar['reference'] = localStorage.getItem("conf_"+curconference+"_seminar_"+item+"_seminar_reference");
			thisseminar['location'] = localStorage.getItem("conf_"+curconference+"_seminar_"+item+"_location");
			agenda.push(thisseminar);
		});
	}
	agenda.sort(compareAgenda);
	var output = "";
	agenda.forEach(function(item, index){
		if(item['type']=='Meeting'){
			output += "<button id='meetingagenda-"+item['id']+"' class='gotomeetingbutton ui-btn ui-shadow ui-corner-all'>";
			output += "<h2>Meeting "+item['first_name']+" "+item['last_name']+",<br>"+item['job_title'] +" - "+item['organisation']+"<br>";
			output += item['location']+"<br>";
			output += "<span class='grey_txt'>"+item['date']+"</span>";
			output += "</h2></button>";
		}else if(item['type']=='Seminar'){
			output += "<button id='seminaragenda-"+item['id']+"' class='gotoseminar ui-btn ui-shadow ui-corner-all'>";
			output += "<h2>Seminar "+item['reference']+": "+item['name']+"<br>";
			if(typeof(item['location']!='')!==null && item['location']!== null && item['location']!='null' && item['location']!=''){
				output += item['location']+"<br>";
			}
			output += "<span class='grey_txt'>"+item['date'];
			if(typeof(item['end_date']!='')!==null && item['end_date']!== null && item['end_date']!='null' && item['end_date']!=''){
				output += " to "+item['end_date'];
			}
			output += "</span>";
			output += "</h2></button>";
			
		}
	});
	$('#agenda_list').html(output);
}

function compareAgenda(a, b){
	var adate = new Date(a.date);
	var bdate = new Date(b.date);
	if(adate<bdate){
		return 1;
	}else if(bdate<adate){
		return -1;
	}else{
		return 0;
	}
	
}

function updateMeetingRequestsPage(){
	var meetinglist = localStorage.getItem("conf_"+numconferences+"_meetingslist");
	if(meetinglist!=''){
		var meetinglistarray = meetinglist.split(",");
		var output = "";
		meetinglistarray.forEach(function(item, index){
			output += "<button id='meeting-"+item+"' class='gotomeetingbutton ui-btn ui-shadow ui-corner-all'>";
			output += "<h3 class='left'>";
			if(localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_reference") == localStorage.getItem("conf_"+curconference+"_reference")){
				//this user is the sender
				output += "&rArr; " + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_first_name");
				output += " " + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_last_name");
				output += "<br>" + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_organisation");
			}else{
				//this user is the receiver
				output += "&lArr; " + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_first_name");
				output += " " + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_last_name");
				output += "<br>" + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_organisation");
			}
			output += "</h3>";
			output += "<h1 class='right'>"+status_symbol(localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_status"))+"</h1>";
			output += "<br style='clear:both;'>";
			output += "<h4 class='left'>"+localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_meeting_date")+"</h3>";
			output += "<h4 class='right red'>"+localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_last_update")+"</h4>";
			output += "</button>";
		});;
	}else{
		var output = "No meetings have been sent or received";
	}
	
	$('#meetings_list').html(output);
	
}

function showMeetingDetails(){
	var selectedmeeting = $('#selectedmeeting').val();
	var meetinglist = localStorage.getItem("conf_"+numconferences+"_meetingslist");
	if(meetinglist!=''){
		var meetinglistarray = meetinglist.split(",");
		var pos = meetinglistarray.indexOf(selectedmeeting);
		if(pos>=0){
			var incoming = true;
			if(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_reference") == localStorage.getItem("conf_"+curconference+"_reference")){
				incoming = false;
				$('#meeting_profile_first_name').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_first_name"));
				$('#meeting_profile_last_name').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_last_name"));
				$('#meeting_profile_organisation').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_organisation"));
				$('#meeting_profile_job_title').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_job_title"));
				$('#meeting_profile_bio').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_bio"));
				$('#sent_meeting_direction_span').html("Sent");
			}else{
				$('#meeting_profile_first_name').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_first_name"));
				$('#meeting_profile_last_name').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_last_name"));
				$('#meeting_profile_organisation').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_organisation"));
				$('#meeting_profile_job_title').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_job_title"));
				$('#meeting_profile_bio').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_bio"));
				$('#sent_meeting_direction_span').html("Recieved");
			}
			
			$('#sent_meeting_schedule').show();
			$('#sent_meeting_status_span').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_status"));
			$('#sent_meeting_date').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_meeting_date"));
			$('#sent_meeting_rearrange_date').val(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_meeting_date").replace(" ", "T"));
			$('#sent_meeting_location').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_location"));
			$('#sent_meeting_rearrange_location').val(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_location"));
			$('#sent_meeting_message').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_message"));
			$('#sent_meeting_response_text').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_response"));
			$('#sent_meeting_response_textarea').val(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_response"));
			
			if(incoming && localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_status") == 'Pending'){
				//can only allow buttons if we are the receiving party and it's still pending
				$('#accept_meeting_btn').show();
				$('#amend_meeting_btn').show();
				$('#reject_meeting_btn').show();
				$('#sent_meeting_response_input').show();
				$('#sent_meeting_response_text').hide();
			}else{
				$('#accept_meeting_btn').hide();
				$('#amend_meeting_btn').hide();
				$('#reject_meeting_btn').hide();
				$('#sent_meeting_response_input').hide();
				$('#sent_meeting_response_text').show();
			}
			$('#rearrange_meeting_send_btn').hide();
			$('#sent_meeting_rearrange_date_span').hide();
			$('#sent_meeting_rearrange_location_span').hide();
			$('#sent_meeting_date').show();
			$('#sent_meeting_location').show();
			
		}else{
			//meeting not found, redirect to meetings page
			location.href = "#delegateManage_Meeting";
		}
	}else{
		//meeting not found, redirect to meetings page
		location.href = "#delegateManage_Meeting";
	}
}

function showSeminarDetails(){
	var selectedseminar = $('#selectedseminar').val();
	var seminarlist = localStorage.getItem("conf_"+numconferences+"_seminarlist");
	if(seminarlist!=''){
		var seminarlistarray = seminarlist.split(",");
		var pos = seminarlistarray.indexOf(selectedseminar);
		if(pos>=0){
			var namedetails = "";
			var seminar_reference = localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_seminar_reference");
			if(typeof(seminar_reference)!==null && seminar_reference!=null && seminar_reference!='' && seminar_reference!='null'){
				namedetails += seminar_reference + ": ";
			}
			namedetails += localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_seminar_name");
			$('#seminar_page_name').html(namedetails);
			
			var timedetails = "";
			timedetails += localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_start_time");
			var end_time = localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_end_time");
			if(typeof(end_time)!==null && end_time!=null && end_time!='' && end_time!='null'){
				timedetails += " to "+end_time;
			}
			$('#seminar_page_time').html(timedetails);
			
			var location = localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_location");
			if(typeof(location)!==null && location!=null && location!='' && location!='null'){
				$('#seminar_page_location').html(location);
			}
			
		}else{
			//meeting not found, redirect to meetings page
			location.href = "#delegateAgenda";
		}
	}else{
		//meeting not found, redirect to meetings page
		location.href = "#delegateAgenda";
	}
}

function clearConference(conferenceid){
	localStorage.setItem("conf_"+conferenceid+"_active", 0);
	
	localStorage.removeItem("conf_"+conferenceid+"_apikey");
	localStorage.removeItem("conf_"+conferenceid+"_userid");
	localStorage.removeItem("conf_"+conferenceid+"_reference");
	localStorage.removeItem("conf_"+conferenceid+"_first_name");
	localStorage.removeItem("conf_"+conferenceid+"_last_name");
	localStorage.removeItem("conf_"+conferenceid+"_organisation");
	localStorage.removeItem("conf_"+conferenceid+"_job_title");
	localStorage.removeItem("conf_"+conferenceid+"_email");
	localStorage.removeItem("conf_"+conferenceid+"_bio");
	localStorage.removeItem("conf_"+conferenceid+"_mapcoords");
	localStorage.removeItem("conf_"+conferenceid+"_id");
	localStorage.removeItem("conf_"+conferenceid+"_image");
	localStorage.removeItem("conf_"+conferenceid+"_desc");
	localStorage.removeItem("conf_"+conferenceid+"_name");
	var meetinglist = localStorage.getItem("conf_"+numconferences+"_meetingslist");
	if(meetinglist!=''){
		var meetinglistarray = meetinglist.split(",");
		var output = "";
		meetinglistarray.forEach(function(item, index){
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_meeting_date");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_date_sent");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_location");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_sender_reference");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_receiver_response");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_receiver_reference");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_sender_first_name");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_sender_last_name");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_sender_organisation");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_sender_job_title");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_sender_bio");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_receiver_first_name");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_receiver_last_name");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_receiver_organisation");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_receiver_job_title");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_receiver_bio");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_last_update");
			localStorage.removeItem("conf_"+conferenceid+"_meeting_"+item+"_status");
		});;
	}
	localStorage.removeItem("conf_"+conferenceid+"_meetingslist");
	var seminarlist = localStorage.getItem("conf_"+numconferences+"_seminarlist");
	if(meetinglist!=''){
		var seminarlistarray = seminarlist.split(",");
		var output = "";
		meetinglistarray.forEach(function(item, index){
			localStorage.removeItem("conf_"+conferenceid+"_seminar_"+item+"_seminar_reference");
			localStorage.removeItem("conf_"+conferenceid+"_seminar_"+item+"_seminar_name");
			localStorage.removeItem("conf_"+conferenceid+"_seminar_"+item+"_start_time");
			localStorage.removeItem("conf_"+conferenceid+"_seminar_"+item+"_end_time");
			localStorage.removeItem("conf_"+conferenceid+"_seminar_"+item+"_location");
		});;
	}
	localStorage.removeItem("conf_"+conferenceid+"_seminarlist");
	
}

//Page change listener - calls functions to make this readable. NB due to the way the "pages" are loaded we cannot put this inside the document ready function.
//Sham - this and the below are there for expandability, can be used for selective synch so only page relevant data is refreshed.
$(document).on( "pagecontainerchange", function( event, ui ) {
			
	switch (ui.toPage.prop("id")) {
		case "delegateIndex":
			break;
		case "delegateLogin":
			break;
		case "delegateHome":
			break;
		case "delegateAgenda":
			updateAgenda();
			break;
		case "delegateFind_People":
			getAttendeeList();
			break;
		case "delegateManage_Meeting":
			getMeetingRequests(updateMeetingRequestsPage);
			break;
		case "delegatePerson_Profile":
			checkUserSelected();
			break;
		case "delegateMeetingDetails":
			showMeetingDetails();
			break;
		case "delegateUser_Profile":
			refreshProfilePage();
			$('#profilestatusresponse').hide();
			break;
		case "delegateSeminarDetails":
			showSeminarDetails();
			break;
		case "delegateSpeakers_List":
			getSpeakers(showSpeakers);
			break;
		case "delegateSpeaker_Profile":
			checkSpeakerSelected();
			break;
		default:
			alert("NO PAGE INIT FUNCTION")
			break;
	}
});


//Sham -returns symbol text for a meeting status
function status_symbol(status){
    var statussymbol;
        switch(status){
        case "Accepted":
            statussymbol = "&#10003;";
            break;
        case "Refused":
        case "Declined": //To display correct text on Confirmed Meeting - The case:case: is deliberate
            statussymbol = "&#10007;";
            break;
        case "Pending":
            statussymbol = "...";
            break;
        case "Rearrange":
        case "Amended"://see above comment
            statussymbol = "?";
            break;
        default:
            statussymbol = "";
            break;
    }
    return statussymbol;
}

//Sham -returns time since "time", formatted
//to <60s then <60m then <24h:0m then >1d depending on magnitude
//TIME MUST BE UNIX
function since_time(time){
    var thismoment = Date.now();
    var diff = thismoment - time;
    diff /= 1000;
    diff = Math.floor(diff);
    if(diff < 60) {
        return(diff+"s");
    } else {
        diff /= 60;
        diff = Math.floor(diff);
        if(diff < 60){
            return(diff+"m");
        } else {
            var hrs = diff / 60;
            hrs = Math.floor(hrs);
            if(hrs >=24){
                var days = Math.floor(hrs/24);
                return(days+"d");
            } else {
            diff %= 60;
            return(hrs+"h,"+diff+"m");
            }
        }
    }
}

//Sham - sets last updated fields to the time since lastupdate (run on page load)
function setlastupdatedtime(){
    var txttime = since_time(lastupdate);
    $(".sync_time").html(txttime);
}


function hide_div(div_id) {   
	document.getElementById(div_id).classList.toggle("hide");
}

function toggle_content(current, alternative) { 
	hide_div(current);
	hide_div(alternative);
}

//Sham -returns symbol text for a meeting status
function status_symbol(status){
	var statussymbol;
			switch(status){
			case "Accepted":
					statussymbol = "&#10003;";
					break;
			case "Refused":
			case "Declined": //To display correct text on Confirmed Meeting - The case:case: is deliberate
					statussymbol = "&#10007;";
					break;
			case "Pending":
					statussymbol = "...";
					break;
			case "Rearrange":
			case "Amended"://see above comment
					statussymbol = "?";
					break;
			default:
					statussymbol = "";
					break;
	}
	return statussymbol;
}
