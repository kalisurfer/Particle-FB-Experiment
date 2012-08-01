//setup global vars
var clientID = "465227016839001";

//setup colletions
var fbPhoto = new Meteor.Collection(null);
fbPhoto.remove({});
var jsonPhotoObj = new Object();

if (Meteor.is_client) {
  Template.hello.greeting = function () {
    return "Welcome to myapp3.";
  };

  //set up the events
  function removeClick(e) {
    console.log("removeClick " + e);
    fbPhoto.find()
  }

  function addClick(e) {
    console.log("addClick " + e);
    fbPhoto.update({uid: e}, { $set : {selected: 1}});
    console.log(fbPhoto);
  }


  function handleClick(e) {
    console.log("this button was clicked " + e);

    switch(e) {
      case "friends":
        getFriends();
      break;

      case "photos":
        getFBPhotos();
      break;

      case "Oldphotos":
        getFBPhotos();
      break;
    }
  }


  function grabTheIDs(classname) {
    var IDs = document.getElementsByTagName("input");
    var IDArray = Array.prototype.slice.call(IDs, 0);

    console.log("grabbing the IDs" + IDs.length + " and the array length is " + IDArray.length);

    console.log(IDs);

    for (var i=0; i < IDs.length; i++) {
      console.log("HERE IS WHAT IS IN THE ARRAY " + IDs[i])


    }

    IDArray.forEach(function(el) {
        // Do stuff with the element
        console.log(el.tagName);
    });
  }



  Template.gridOfImages.names = function () {
    console.log("you hit me with TWO "  + fbPhoto.find() );
    return fbPhoto.find();
  }

  Template.hello.events = {
    'click input' : function (e) {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined') {
        //console.log("You pressed the button" + e.id);
        //getPhotos();
        //getFriends();
      }
    }
  };

   Template.fbconnect.connect = function () {
      window.fbAsyncInit = function() {
        FB.init({
          appId      : clientID, // App ID
          status     : true, // check login status
          cookie     : true, // enable cookies to allow the server to access the session
          xfbml      : true  // parse XFBML
        });
      };

      // Load the SDK Asynchronously
      (function(d){
        var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
        js = d.createElement('script'); js.id = id; js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";
        d.getElementsByTagName('head')[0].appendChild(js);
      }(document));
     return true;

     FB.login(function(response) {
       if (response.authResponse) {
         console.log('Welcome!  Fetching your information.... ');
         FB.api('/me', function(response) {
           console.log('Good to see you, ' + response.name + '.');
         });
       } else {
         console.log('User cancelled login or did not fully authorize.');
       }
     });
  };

  //fetch additional photos based on page scroll

  // get Friends
  function getFriends() {
    var query = "SELECT uid, name FROM user WHERE uid IN (Select uid2 from friend where uid1 =me())";

    FB.api(
        {
          method: 'fql.query',
          query: query
        },
        function(response) {
          
        console.log(response);

          var html = "";
          var friend = new Array();
          for (var i=0; i < response.length; i++) {
            console.log("There were this many responses " + response.length + " and they are " + response[i]);
            var name = response[i].name;
            var fuid = response[i].uid;
            fbPhoto.insert({username: name, uid: fuid, selected: 0});
            friend[i] = fuid;
            console.log(name + " is your friend and their id is " + fuid);
            

           

            //html += "<a href='"+big+"' target='_blank'><img src='"+src+"' /></a>";
          }

          console.log("you hit me with ONE "  + fbPhoto.find().count() );

          //getLatestPhotos(friend);
          


          //var container = document.getElementById("container");
          //container.innerHTML = html;

          console.log('done');

        }
      );

  }

  // get IDs
  function getFBPhotos() {
    console.log("go through this ");
    var selectedFriend = fbPhoto.find({selected : 1})
    var bigQuery = "";
    var count=0;

    console.log("this is the number of items that were selected " + selectedFriend.count() );
    console.log(fbPhoto);
    console.log(selectedFriend);

    //  - start with looping through the object returned
    bigQuery ="{";

    selectedFriend.forEach(function (some) {
      console.log("name is " + some.username + " uid is " + some.uid + " and selected is " + some.selected);
      bigQuery = bigQuery + '"query' + count + '":' + '"SELECT pid, caption, aid, owner, link, src_big, src_small, like_info, comment_info, created, modified FROM photo WHERE aid IN (SELECT aid FROM album WHERE owner = ' + some.uid + ') ORDER BY created DESC LIMIT 100"';
      count +=1;
      if (count < selectedFriend.count()) {bigQuery = bigQuery +',' ;}

    });

    bigQuery = bigQuery + "}";

    console.log("built this query " + bigQuery);

    //  - now send to FB as a multiquery
    FB.api(
        {
          method: 'fql.multiquery',
          queries: bigQuery
        },
        function(response) {
        console.log("this is big - back with data " + response.length);  
        console.log(response);

          var html = "";

          // loop over all users coming back
          for (var i=0; i < response.length; i++) {
            // assign user object returned to temp var
            var fbUser = response[i].fql_result_set;
            

            // loop over items in object return to get photos
            for (var j=0; j < fbUser.length; j++) {
              var src = fbUser[j].src_small;
              var big = fbUser[j].src_big;
              var owner = fbUser[j].owner;

              html += "<a href='"+big+"' target='_blank'><img src='"+src+"' /></a>";
            }

            html += "<br /><br />";

          }


          var container = document.getElementById("container");
          container.innerHTML = html;

          console.log('done');

        }
      );



  }


  // get latest photos
    function getLatestPhotos(friends) {

    var queries = new Array();
    var bigQuery = "";

    console.log("you called getLatestPhotos")

    // build your array of queries to send
    //  - start with looping through the object returned
    bigQuery ="{";

    for (var i =0; i < 25; i++) {
      bigQuery = bigQuery + '"query' + i + '":' + '"SELECT pid, caption, aid, owner, link, src_big, src_small, like_info, comment_info, created, modified FROM photo WHERE aid IN (SELECT aid FROM album WHERE owner = ' + friends[i] + ') ORDER BY created DESC LIMIT 10"';

      if (i < 24) {
        bigQuery = bigQuery + ',';
      }
    }
    bigQuery = bigQuery + "}";

    console.log("HERE IS THE BIG QUERY " + bigQuery);

    //  - now send to FB as a multiquery
    FB.api(
        {
          method: 'fql.multiquery',
          queries: bigQuery
        },
        function(response) {
        console.log("this is big - back with data ");  
        console.log(response);

          var html = "";

          // loop over all users coming back
          for (var i=0; i < response.length; i++) {
            // assign user object returned to temp var
            var fbUser = response[i].fql_result_set;
            

            // loop over items in object return to get photos
            for (var j=0; j < fbUser.length; j++) {
              var src = fbUser[j].src_small;
              var big = fbUser[j].src_big;
              var owner = fbUser[j].owner;

              html += "<a href='"+big+"' target='_blank'><img src='"+src+"' /></a>";
            }

            html += "<br /><br />";

          }


          var container = document.getElementById("container");
          container.innerHTML = html;

          console.log('done');

        }
      );


  }

  // get photos
  function getPhotos()
    {

      var oneWeekAgo = Math.round((new Date().setDate(new Date().getDate()-7)) / 1000);
      //var oneWeekAgo = Math.round((new Date()).getTime() / 1000);

      //var query = "SELECT uid, name, pic_square FROM user WHERE uid = me() OR uid IN (SELECT uid2 FROM friend WHERE uid1 = me())";
      var query = "SELECT pid, caption, aid, owner, link, src_big, src_small, like_info, comment_info, created, modified FROM photo WHERE aid IN (SELECT aid FROM album WHERE owner = me()) ORDER BY created DESC LIMIT 10"

      FB.api(
        {
          method: 'fql.query',
          query: query
        },
        function(response) {
          
        console.log(response);

          var html = "";
          for (var i=0; i < response.length; i++) {
            var src = response[i].src_small;
            var big = response[i].src_big;
            console.log("this is big " + big);
            
            html += "<a href='"+big+"' target='_blank'><img src='"+src+"' /></a>";
          }


          var container = document.getElementById("container");
          container.innerHTML = html;

          console.log('done');

        }
      );
    }

}

if (Meteor.is_server) {
  Meteor.startup(function () {


    // code to run on server at startup
  });
}