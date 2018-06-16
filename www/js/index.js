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



//ondeviceready - NOTE FUNCTIONS AND VARS IN HERE ARE IN LOCAL SCOPE

function onDeviceReady(){
		attendees = new Object(); //this can be done on declaration
}  //END OF ONDEVICEREADY

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

$(document).on('click',".conf_btn_delete",function(e){
	var thisid = $(this).attr('id').split("_")[1];
	clearConference(thisid);
	fill_conference_data();
});

$(document).on('click',".conf_btn",function() {		
	var thisid = $(this).attr('id').split("_")[1];
	
	curconf = thisid;
	curapikey = localStorage.getItem("conf_"+thisid+"_apikey");
	localStorage.setItem('curconference', curconf);
	localStorage.setItem('curapikey', curapikey);
	refreshConferenceData(thisid, true);
	location.href = "#delegateHome";
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

		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post',
		}).done(function(response){
			refreshProfilePage();
			if(response.success){
				$('#profilestatusresponse').html("Succesfully updated profile");
			}
		});
	}else{
		$('#profilestatusresponse').html("You need an active internet connection to update your profile");
	}
	
});

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
			conflisthtml += "<div id='conference_"+i+"' class='conf_btn fakebutton eight columns'>";
			conflisthtml += "<h1 id='conf_name_login_"+i+"'>"+localStorage.getItem("conf_"+i+"_name")+"</h1>";
			conflisthtml += "<p id='email_login_"+i+"'>"+localStorage.getItem("conf_"+i+"_email")+"</p>";
			conflisthtml += "</div>";
			conflisthtml += "<div id='conferencedelete_"+i+"' class='conf_btn_delete fakebutton four columns'>";
			conflisthtml += "<div class='conferencedeletetext'>Remove</div>"
			conflisthtml += "</div></div>";
		}
	}
	
	$('#user_conferences').html(conflisthtml);
	
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
			break;
		case "delegateConfirmed_Meeting":
			break;
		case "delegateFind_People":
			break;
		case "delegateManage_Meeting":
			break;
		case "delegatePerson_Profile":
			break;
		case "delegateReply_Meeting":
			break;
		case "delegateUser_Profile":
			refreshProfilePage();
			$('#profilestatusresponse').hide();
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
