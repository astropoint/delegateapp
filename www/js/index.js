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
				checkConfLastUpdated();
				
				if(curconference>0){
					refreshCurConference();
				}
				
				if(onmeetinglist && refreshcount%3==0){
					//refresh lists if on page every 30 seconds
					getMeetingRequests(updateMeetingRequestsPage);
				}
				if(onagendalist && refreshcount%3==0){
					updateAgenda();
				}
				
				refreshcount++;
			}, 10000);
});

var refreshcount = 0;
var agendasort = 'desc';

var spinner = '<svg class="svg-inline--fa fa-spinner fa-w-16 fa-spin" aria-hidden="true" data-prefix="fas" data-icon="spinner" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"></path></svg>';

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var destinationType;
function onDeviceReady(){
	
	pictureSource=navigator.camera.PictureSourceType;
	destinationType=navigator.camera.DestinationType;
	
	try{
		cordova.getAppVersion.getVersionNumber(function (version) {
			$('.versionnumber').html(version);
		});
	}catch(error){
		console.log("App version cannot be loaded, you are probably using a browser");
	}
}

var siteURL = "https://reg.bookmein2.com";
var apiURL = siteURL+"/api/api.php";
var isInternet = true;
var numconferences = 0;
var curconference = -1;
var curapikey = "";
var maxUploadSize = 8;

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

function checkConfLastUpdated(){
	if (curconference>0) {
			var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
			var data = "action=getconferencedetailslastupdate&apikey="+thisapikey;
			
			$.ajax({
				url: apiURL,
				data: data,
				dataType: "json",
				type: 'post',
			}).done(function(response){
				console.log(response.data.last_updated);
				console.log(localStorage.getItem("conf_"+curconference+"_last_update"));
				if(response.data.last_updated!=localStorage.getItem("conf_"+curconference+"_last_updated")){
					checkAndUpdateCurConference();
				}
			});
	}
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
	}else if (localStorage.getItem("curconference") == "0") {
		//do nothing, assume we're somewhere useful
	}else{
		curconference = -1;
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

$(document).on('click', '.refreshagenda', function(){
	updateAgenda();
});

$(document).on('click', '.mypage', function(e){
	/*
	 * horrible fudge, the left panel always comes out too far covering part of the page so we
	 * have to check whether the page has been clicked on *unless* it's the menu icon itself
	 */
	if(!$(e.target).hasClass('hamburger_icon') && $('#leftpanel').hasClass('ui-panel-open')){
		$( "#leftpanel" ).panel( "close" );
	} 
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

$(document).on('click', '#close_btn', function(){
	curconference = 0;
	localStorage.setItem("curconference", 0);
	resetAllFields();
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

$(document).on('click', '.menu_link', function(e){
	var clicked = $(this).attr('href');
	var active= $('.ui-page-active').attr('id');
	
	if(clicked=='#'+active){
		$('#leftpanel').panel('close');
	}
});


$(document).on('click',".removeconferencerow",function(e){
	var thisid = $(this).attr('id').split("_")[1];
	clearConference(thisid);
	fill_conference_data();
});

$(document).on('click',".conf_btn",function() {		
	var thisid = $(this).attr('id').split("_")[1];
	
	curconference = thisid;
	curapikey = localStorage.getItem("conf_"+thisid+"_apikey");
	localStorage.setItem('curconference', curconference);
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

$(document).on('click', '#meeting_showhidelabel', function(e){
	e.preventDefault();
	if($('#meeting_personaldetails').is(":hidden")){
		$('#meeting_personaldetails').show();
		$('#meeting_showhidelabel').html('Hide profile details');
	}else{
		$('#meeting_personaldetails').hide();
		$('#meeting_showhidelabel').html('Show profile details');
	}
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
					localStorage.setItem("conf_"+numconferences+"_start_date", response.data.start_date);
					localStorage.setItem("conf_"+numconferences+"_meetingslist", "");
					localStorage.setItem("conf_"+numconferences+"_seminarist", "");
					localStorage.setItem("conf_"+numconferences+"_speakerslist", "");
					localStorage.setItem("conf_"+numconferences+"_active", 1);
					
					localStorage.setItem("numconferences", numconferences);
					
					fill_conference_data();
					curconference = 0;
					localStorage.setItem("curconference", 0);
					
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
		$(this).hide();
		$('#updateprofilespinner').show();
		var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
		var data = "action=updateprofile&apikey="+thisapikey;
		data += "&job_title="+encodeURIComponent($('#delegateUser_Profile').find('input[name="role"]').val());
		data += "&bio="+encodeURIComponent($('#delegateUser_Profile').find('textarea[name="bio"]').val());
		data += "&first_name="+encodeURIComponent($('#delegateUser_Profile').find('input[name="f_name"]').val());
		data += "&last_name="+encodeURIComponent($('#delegateUser_Profile').find('input[name="s_name"]').val());
		data += "&organisation="+encodeURIComponent($('#delegateUser_Profile').find('input[name="org"]').val());
		data += "&profileimgupdate="+encodeURIComponent($('#delegateUser_Profile').find('input[name="profileimgupdate"]').val());
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			if(response.success){
				$('#profilestatusresponse').show();
				$('#profilestatusresponse').html("Succesfully updated profile");
				$('#profileimgupdate').val('0');
				setTimeout(function(){
					$('#profilestatusresponse').hide();
				}, 5000);
			}
			$('#updt_profile_btn').show();
			$('#updateprofilespinner').hide();
		});
	}else{
		$('#profilestatusresponse').show();
		$('#profilestatusresponse').html("You need an active internet connection to update your profile");
		setTimeout(function(){
			$('#profilestatusresponse').hide();
		}, 5000);
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
	$('#rearrange_meeting_cancel').show();
});

$(document).on('click', '#rearrange_meeting_cancel', function(e){
	e.preventDefault();
	$('#sent_meeting_location').show();
	$('#sent_meeting_date').show();
	$('#sent_meeting_rearrange_date_span').hide();
	$('#sent_meeting_rearrange_location_span').hide();
	$('#accept_meeting_btn').show();
	$('#amend_meeting_btn').show();
	$('#reject_meeting_btn').show();
	$('#rearrange_meeting_send_btn').hide();
	$('#rearrange_meeting_cancel').hide();
});

function respondMeeting(type){
	$('#meeting_spinner').show();
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
					if(response.success){
						$('#meeting_response_success').html("Accepted meeting");
						getMeetingRequests(showMeetingDetails);
					}
					$('#meeting_spinner').show();
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
		$('#meeting_spinner').show();
	}
}

$(document).on('click', '#send_meeting_btn', function(e){
	e.preventDefault();
	$('#otherprofilestatusresponse').hide();
	if(isInternet){
		if($('#createmeeting_date').val()!=''){
			var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
			var data = "action=requestmeeting&apikey="+thisapikey;
			
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
				$('#createmeeting_date').val('');
				$('#schdlr_lctn').val('');
				$('#schdlr_msg').val('');
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
	$('#search_people_bar').val('');
	location.href = "#delegatePerson_Profile";
}); 

$(document).on('click',"#imagepickerprofile",function() {
	$('#updateprofileimagespinner').show();
	$('#profilepicture').hide();
	$('#profileimagestatus').hide();
	navigator.camera.getPicture(saveLocalPhoto, function(message) {
		$('#profileimagestatus').show();
		$('#profileimagestatus').html("Error selecting image");
		$('#updateprofileimagespinner').hide();
		$('#profilepicture').show();
	}, {
		quality: 25,
		destinationType: navigator.camera.DestinationType.FILE_URI,
		sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
	});
});

var imageURI;
function saveLocalPhoto(fromCamera){
	imageURI = fromCamera;
	uploadPhoto();
}

function uploadPhoto() {
	var thisapikey = localStorage.getItem("conf_"+curconference+"_apikey");
	
	var options = new FileUploadOptions();
	options.fileKey = "file";
	options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
	options.mimeType = "image/jpeg";
	var params = new Object();
	params.deferprofilesave = "1";
	params.action = "setpic";
	params.apikey = thisapikey;
	options.params = params;
	options.chunkedMode = false;

	var ft = new FileTransfer();
		
	var uploadURL = apiURL;
	ft.upload(imageURI, uploadURL, function(result){
		
		try{
			var output = JSON.parse(result.response);
			if(output.success){
				$('#profilepicture').attr('src', siteURL+output.data.profileimg_thumb);
				$('#profileimgupdate').val('1');
			}else{
				$('#profileimagestatus').show();
				$('#profilestatusresponse').html("Unable to save image: "+output.message);
			}
			$('#updateprofileimagespinner').hide();
			$('#profilepicture').show();
		}catch(error){
			$('#profileimagestatus').show();
			$('#updateprofileimagespinner').hide();
			if(parseInt(result.bytesSent)>(maxUploadSize*1024*1024)){
				$('#profileimagestatus').html("The file you are trying to upload is too large, please select an image less than "+maxUploadSize+"MB large");
			}else{
				$('#profileimagestatus').html("Unable to upload/save image");
				$('#profilestatusresponse').show();
				$('#profilestatusresponse').html(error);
			}
		}
	}, function(error){
		$('#updateprofileimagespinner').hide();
		$('#profilepicture').show();
		$('#profileimagestatus').show();
		$('#profileimagestatus').html(error.response);
	}, options);
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
			localStorage.setItem("conf_"+curconference+"_profileimg", response.data.profileimg);
			localStorage.setItem("conf_"+curconference+"_profileimg_thumb", response.data.profileimg_thumb);
			
			
			$('#f_name').val(localStorage.getItem("conf_"+curconference+"_first_name"));
			$('#s_name').val(localStorage.getItem("conf_"+curconference+"_last_name"));
			$('#org').val(localStorage.getItem("conf_"+curconference+"_organisation"));
			$('#job_title').val(localStorage.getItem("conf_"+curconference+"_job_title"));
			$('#bio').val(localStorage.getItem("conf_"+curconference+"_bio"));
			if(localStorage.getItem("conf_"+curconference+"_profileimg_thumb")!=''){
				var imgurl = siteURL+"/images/profile/"+localStorage.getItem("conf_"+curconference+"_id")+"/"+localStorage.getItem("conf_"+curconference+"_profileimg_thumb");
				$('#profilepicture').attr('src', imgurl);
				$('#profilepicture').show(); 
			}else{
				$('#profilepicture').hide();
			}
		});
	}else{
		$('#f_name').val(localStorage.getItem("conf_"+curconference+"_first_name"));
		$('#s_name').val(localStorage.getItem("conf_"+curconference+"_last_name"));
		$('#org').val(localStorage.getItem("conf_"+curconference+"_organisation"));
		$('#job_title').val(localStorage.getItem("conf_"+curconference+"_job_title"));
		$('#bio').val(localStorage.getItem("conf_"+curconference+"_bio"));
		if(localStorage.getItem("conf_"+curconference+"_profileimg_thumb")!=''){
			var imgurl = siteURL+"/images/profile/"+localStorage.getItem("conf_"+curconference+"_id")+"/"+localStorage.getItem("conf_"+curconference+"_profileimg_thumb");
			$('#profilepicture').attr('src', imgurl);
			$('#profilepicture').show();
		}else{
			$('#profilepicture').hide();
		}
	}
	
}

function refreshCurConference(){
	
	//$('#conference_name').html(localStorage.getItem("conf_"+curconference+"_name")+'<a class="backbutton right" style="font-size:32px" href="javascript:history.back()">&#8592;</a>');
	//$('.conference_name').html(localStorage.getItem("conf_"+curconference+"_name")+'<a class="backbutton right" style="font-size:32px" href="javascript:history.back()">&#8592;</a>');
	$('#conference_name').html(localStorage.getItem("conf_"+curconference+"_name"));
	$('.conference_name').html(localStorage.getItem("conf_"+curconference+"_name"));
	$('#conference_desc').html(localStorage.getItem("conf_"+curconference+"_desc"));
	$('#conference_address').html(localStorage.getItem("conf_"+curconference+"_address"));
	var conf_image = localStorage.getItem("conf_"+curconference+"_image");
	if(conf_image!==null && conf_image!='undefined' && conf_image!=''){
		$('#conference_image').show();
		$('#conference_image').attr('src', 'data:image/png;base64,'+localStorage.getItem("conf_"+curconference+"_image"));
	}else{
		$('#conference_image').hide();
		$('#conference_image').attr('src', '');
	}
	var start_date = localStorage.getItem("conf_"+curconference+"_start_date");
	
	if(start_date!='' && start_date!=null && start_date !== null && start_date!='undefined'){
		$('.conference_date').html(formattedDate(start_date));
	}
	
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
				$('#speaker_profile_img').hide();
				$('#speaker_profile_img').attr('src', '');
			}else{
				$('#speaker_profile_img').show();
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
				$('#other_profile_first_name_small').html(response.data.first_name);
				$('#other_profile_last_name_small').html(response.data.last_name);
				$('#other_profile_organisation').html(response.data.organisation);
				$('#other_profile_job_title').html(response.data.job_title);
				$('#other_profile_bio').html(response.data.bio);
				
				if(typeof(response.data.profileimg_thumb)===null || typeof(response.data.profileimg_thumb)==null|| response.data.profileimg_thumb==null || response.data.profileimg_thumb==''|| response.data.profileimg_thumb=="null"|| response.data.profileimg_thumb=='null'){
					$('#profile_img_div').hide();
					$('#other_profile_img_profile').attr('src', "");
				}else{
					$('#profile_img_div').show();
					$('#other_profile_img_profile').attr('src', "https://reg.bookmein2.com/images/profile/"+response.data.conferenceid+"/"+response.data.profileimg_thumb);
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
		$('#other_profile_first_name_small').html(response.data.first_name);
		$('#other_profile_last_name_small').html(response.data.last_name);
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
		localStorage.setItem("conf_"+conferenceid+"_mapcoords", response.data.conf_mapcoords);
		localStorage.setItem("conf_"+conferenceid+"_image", response.data.conf_image);
		localStorage.setItem("conf_"+conferenceid+"_desc", response.data.conf_desc);
		localStorage.setItem("conf_"+conferenceid+"_name", response.data.conf_name);
		localStorage.setItem("conf_"+conferenceid+"_address", response.data.conference_address);
		localStorage.setItem("conf_"+conferenceid+"_start_date", response.data.start_date);
		localStorage.setItem("conf_"+conferenceid+"_last_updated", response.data.last_updated);
		
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
			conflisthtml += "<div id='conference_"+i+"' class='conf_btn fakebutton col-12'>";
			conflisthtml += "<h4 id='conf_name_login_"+i+"'>"+localStorage.getItem("conf_"+i+"_name")+"</h4>";
			//conflisthtml += "<p id='email_login_"+i+"'>"+localStorage.getItem("conf_"+i+"_email")+"</p>";
			conflisthtml += "<p id='start_date_"+i+"'>Start Date: "+localStorage.getItem("conf_"+i+"_start_date")+"</p>";
			conflisthtml += "</div></div>";
			conflisthtml += "<div class='row removeconferencerow' id='conferencedelete_"+i+"'><div class='conf_btn_delete fakebutton col-12'>";
			conflisthtml += "<div class='conferencedeleterow'>Remove "+localStorage.getItem("conf_"+i+"_name")+"</div>"
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
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_sender_thumb", response.data.meetings[i].sender_thumb);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_first_name", response.data.meetings[i].receiver_first_name);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_last_name", response.data.meetings[i].receiver_last_name);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_organisation", response.data.meetings[i].receiver_organisation);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_job_title", response.data.meetings[i].receiver_job_title);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_bio", response.data.meetings[i].receiver_bio);
					localStorage.setItem("conf_"+curconference+"_meeting_"+response.data.meetings[i].id+"_receiver_thumb", response.data.meetings[i].receiver_thumb);
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
					localStorage.setItem("conf_"+curconference+"_seminar_"+response.data.seminars[i].id+"_description", response.data.seminars[i].description);
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

$(document).on('click',"#sortagendaasc",function(e) {
	e.preventDefault();
	agendasort = 'asc';
	updateAgenda();
}); 
$(document).on('click',"#sortagendadesc",function(e) {
	e.preventDefault();
	agendasort = 'desc';
	updateAgenda();
}); 

function updateAgendaPage(clearint){
	if(clearint){
		clearInterval(updatingagendainterval);
	}
	
	if(agendasort=='asc'){
		$('#sortagendaasc').hide();
		$('#sortagendadesc').show();
	}else{
		$('#sortagendaasc').show();
		$('#sortagendadesc').hide();
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
			thisseminar['description'] = localStorage.getItem("conf_"+curconference+"_seminar_"+item+"_description");
			agenda.push(thisseminar);
		});
	}
	if(agendasort=='asc'){
		agenda.sort(compareAgenda);
	}else{
		agenda.sort(compareAgendaDesc);
	}
	
	var output = "";
	agenda.forEach(function(item, index){
		if(item['type']=='Meeting'){
			output += "<button id='meeting-"+item['id']+"' class='gotomeetingbutton ui-btn ui-shadow ui-corner-all row'>";
			output += "<div class='col-12 text-right'>"+status_symbol(item['status'])+"</div>";
			output += "<h3 class='col-12 text-left'>";
			if(item['incoming']==0){
				//this user is the sender
				output += "To: " + item['first_name'];
				output += " " + item['last_name'];
				output += "<br>" + item['organisation'];
			}else{
				//this user is the receiver
				output += "From: " + item['first_name'];
				output += " " + item['last_name'];
				output += "<br>" + item['organisation'];
			}
			output += "</h3>";
			output += "<h4 class='col-12 text-left'>"+formattedDate(item['date'])+"</h3>";
			output += "</button>";
			
		}else if(item['type']=='Seminar'){
			output += "<div id='seminaragenda-"+item['id']+"' class='gotoseminar row fakedarkbutton text-center'>";
			output += "<h2 class='col-12'>Seminar";
			if(typeof(item['reference']!='')!==null && item['reference']!== null && item['reference']!='null' && item['reference']!=''){
				output += "<br>"+item['reference'];
			}
			output += "<br>"+item['name']+"<br>";
			if(typeof(item['location']!='')!==null && item['location']!== null && item['location']!='null' && item['location']!=''){
				output += item['location']+"<br>";
			}
			output += "<span class='grey_txt'>"+formattedDate(item['date']);
			if(typeof(item['end_date']!='')!==null && item['end_date']!== null && item['end_date']!='null' && item['end_date']!=''){
				output += "<br> to <br>"+formattedDate(item['end_date']);
			}
			output += "</span>";
			output += "</h2></div>";
			
		}
	});
	$('#agenda_list').html(output);
}

function dateWithoutSeconds(date){
	return date.substring(0, date.length - 3);
}


function formattedDate(date){
	var d = new Date(date.split(" ")[0]);
	var time = date.split(" ")[1].split(":");
	
	var newdate = d.getDate()+" "+months[d.getMonth()] + " " +time[0] + ":" + time[1];
	
	return newdate;
}

function compareAgenda(a, b){
	var adate = new Date(a.date);
	var bdate = new Date(b.date);
	if(adate<bdate){
		return -1;
	}else if(bdate<adate){
		return 1;
	}else{
		return 0;
	}
}
function compareAgendaDesc(a, b){
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
			output += "<button id='meeting-"+item+"' class='gotomeetingbutton ui-btn ui-shadow ui-corner-all row'>";
			output += "<div class='col-12 text-right'>"+status_symbol(localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_status"))+"</div>";
			output += "<h3 class='col-12 text-left'>";
			if(localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_reference") == localStorage.getItem("conf_"+curconference+"_reference")){
				//this user is the sender
				output += "To: " + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_first_name");
				output += " " + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_last_name");
				output += "<br>" + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_receiver_organisation");
			}else{
				//this user is the receiver
				output += "From: " + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_first_name");
				output += " " + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_last_name");
				output += "<br>" + localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_sender_organisation");
			}
			output += "</h3>";
			output += "<h4 class='col-12 text-left'>"+formattedDate(localStorage.getItem("conf_"+curconference+"_meeting_"+item+"_meeting_date"))+"</h3>";
			output += "</button>";
		});;
	}else{
		var output = "No meetings have been sent or received";
	}
	
	$('#meetings_list').html(output);
	
}

function showMeetingDetails(){
	var selectedmeeting = $('#selectedmeeting').val();
	$('#meeting_spinner').hide();
	$('#meeting_response_success').hide();
	$('#meeting_response_error').hide();
	var meetinglist = localStorage.getItem("conf_"+numconferences+"_meetingslist");
	if(meetinglist!=''){
		var meetinglistarray = meetinglist.split(",");
		var pos = meetinglistarray.indexOf(selectedmeeting);
		if(pos>=0){
			var incoming = true;
			var thumb;
			if(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_reference") == localStorage.getItem("conf_"+curconference+"_reference")){
				incoming = false;
				$('#meetingtofromlabel').html('to');
				$('#meeting_profile_first_name').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_first_name"));
				$('#meeting_profile_last_name').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_last_name"));
				$('#meeting_profile_organisation').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_organisation"));
				$('#meeting_profile_job_title').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_job_title"));
				$('#meeting_profile_bio').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_bio"));
				thumb = localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_thumb");
				$('#sent_meeting_direction_span').html("Sent");
			}else{
				$('#meetingtofromlabel').html('from');
				$('#meeting_profile_first_name').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_first_name"));
				$('#meeting_profile_last_name').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_last_name"));
				$('#meeting_profile_organisation').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_organisation"));
				$('#meeting_profile_job_title').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_job_title"));
				$('#meeting_profile_bio').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_bio"));
				thumb = localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_thumb");
				$('#sent_meeting_direction_span').html("Recieved");
			}
			
			if(typeof(thumb!='')!==null && thumb!== null && thumb!='null' && thumb!=''){
				var fulladdress = "https://reg.bookmein2.com/images/profile/"+localStorage.getItem("conf_"+curconference+"_id")+"/"+thumb;
				$('#other_profile_img_meeting').attr('src', fulladdress);
				$('#meeting_details_photodiv').show();
			}else{
				$('#meeting_details_photodiv').hide();
				$('#other_profile_img_meeting').attr('src', '');
			}
			
			$('#sent_meeting_schedule').show();
			$('#sent_meeting_status_span').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_status"));
			$('#sent_meeting_date').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_meeting_date"));
			$('#sent_meeting_rearrange_date').val(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_meeting_date").replace(" ", "T"));
			$('#sent_meeting_location').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_location"));
			$('#sent_meeting_rearrange_location').val(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_location"));
			$('#sent_meeting_message').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_sender_message"));
			var response = localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_response");

			if(typeof(response!='')!==null && response!== null && response!='null' && response!=''){
				$('#sent_meeting_response_text').html(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_response"));
				$('#sent_meeting_response_textarea').val(localStorage.getItem("conf_"+curconference+"_meeting_"+selectedmeeting+"_receiver_response"));
			}else{
				$('#sent_meeting_response_text').html('');
				$('#sent_meeting_response_textarea').val('');
			}
			
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
	if(seminarlist!='' && selectedseminar!=''){
		
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
			timedetails += formattedDate(localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_start_time"));
			var end_time = localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_end_time");
			if(typeof(end_time)!==null && end_time!=null && end_time!='' && end_time!='null'){
				timedetails += " to "+formattedDate(end_time);
			}
			$('#seminar_page_time').html(timedetails);
			
			var location = localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_location");
			if(typeof(location)!==null && location!=null && location!='' && location!='null'){
				$('#seminar_page_location').html(location);
			}
			
			var description = localStorage.getItem("conf_"+curconference+"_seminar_"+selectedseminar+"_description");
			if(typeof(description)!==null && description!=null && description!='' && description!='null'){
				$('#seminar_page_description').html(description);
			}
			
		}else{
			//meeting not found, redirect to meetings page
			window.location.href = "#delegateAgenda";
		}
	}else{
		//meeting not found, redirect to meetings page
		window.location.href = "#delegateAgenda";
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
	localStorage.removeItem("conf_"+conferenceid+"_last_updated");
	localStorage.removeItem("conf_"+conferenceid+"_address");
	localStorage.removeItem("conf_"+conferenceid+"_start_date");
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

var onmeetinglist = false;
var onagendalist = false;

//Page change listener - calls functions to make this readable. NB due to the way the "pages" are loaded we cannot put this inside the document ready function.
//Sham - this and the below are there for expandability, can be used for selective synch so only page relevant data is refreshed.
$(document).on( "pagecontainerchange", function( event, ui ) {

	onmeetinglist = false;
	onagendalist = false;

	switch (ui.toPage.prop("id")) {
		case "delegateIndex":
			curconference = 0;
			localStorage.setItem('curconference', 0);
			fill_conference_data();
			break;
		case "delegateLogin":
			curconference = 0;
			localStorage.setItem('curconference', 0);
			break;
		case "delegateHome":
			break;
		case "delegateAgenda":
			onagendalist = true;
			updateAgenda();
			break;
		case "delegateFind_People":
			getAttendeeList();
			break;
		case "delegateManage_Meeting":
			onmeetinglist = true;
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
			clearMeetingFields();
			break;
		case "termsAndPrivacy":
			localStorage.setItem('curconference', 0);
			curconference = 0;
			break;
		default:
			alert("NO PAGE INIT FUNCTION")
			break;
	}
});

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
					//statussymbol = "&#10003;";
					statussymbol = "Accepted";
					break;
			case "Refused":
			case "Declined": //To display correct text on Confirmed Meeting - The case:case: is deliberate
					statussymbol = "Declined";
					break;
			case "Pending":
					statussymbol = "Pending";
					break;
			case "Rearrange":
			case "Amended"://see above comment
					statussymbol = "Rearranged";
					break;
			default:
					statussymbol = "";
					break;
	}
	return statussymbol;
}

function resetAllFields(){
	$('#user_conferences').html('');
	$('#login_response').html('');
	$('.conference_name').html('');
	$('#agenda_list').html('');
	$('#meeting_profile_first_name').html('');
	$('#meeting_profile_last_name').html('');
	$('#meeting_profile_organisation').html('');
	$('#meeting_profile_job_title').html('');
	$('#meeting_profile_bio').html('');
	$('#sent_meeting_direction_span').html('');
	$('#sent_meeting_status_span').html('');
	$('#sent_meeting_rearrange_date_span').html('');
	$('#sent_meeting_rearrange_date').html('');
	$('#sent_meeting_date').html('');
	$('#sent_meeting_location').html('');
	$('#sent_meeting_rearrange_location_span').html('');
	$('#sent_meeting_rearrange_location').html('');
	$('#sent_meeting_message').html('');
	$('#sent_meeting_response_text').html('');
	$('#sent_meeting_response_input').html('');
	$('#sent_meeting_response_textarea').html('');
	$('#seminar_page_name').html('');
	$('#seminar_page_time').html('');
	$('#seminar_page_location').html('');
	$('#selectedseminar').html('');
	$('#people_list').html('');
	$('#meetings_list').html('');
	$('#speakers_list').html('');
	$('#speaker_profile_img').attr('src', '');
	$('#speaker_profile_img').hide();
	$('#speaker_first_name').html('');
	$('#speaker_last_name').html('');
	$('#speaker_organisation').html('');
	$('#speaker_job_title').html('');
	$('#speakerbio').html('');
	$('#other_profile_first_name').html('');
	$('#other_profile_last_name').html('');
	$('#other_profile_first_name_small').html('');
	$('#other_profile_last_name_small').html('');
	$('#other_profile_organisation').html('');
	$('#other_profile_job_title').html('');
	$('#other_profile_bio').html('');
	$('#createmeeting_date').val('');
	$('#schdlr_lctn').val('');
	$('#schdlr_msg').val('');
	$('#f_name').val('');
	$('#s_name').val('');
	$('#org').val('');
	$('#job_title').val('');
	$('#bio').val('');
}

function clearMeetingFields(){
	$('#createmeeting_date').val('');
	$('#schdlr_lctn').val('');
	$('#schdlr_msg').val('');
	
}
