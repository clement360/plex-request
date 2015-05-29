Requests = new Mongo.Collection("requests");

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    requests: function () {
      return Requests.find({}, {sort: {createdAt: -1}});
    }
  });

  Template.requestForm.events({
    'submit form': function(){
      var title = $('#newRequestTitle').val();
      var name = $('#newRequestName').val();
      var time = new Date();

      if (title.length < 1) {
        $('#newRequestTitle').effect( "shake" );
      } else if (name.length < 1) {
        $('#newRequestName').effect( "shake" );
      } else {
        Requests.insert({
          title: title,
          name: name,     
          createdAt: time
        });

        $('#newRequestTitle').val('');
        $('#newRequestName').val('');
        $('#newRequestName').slideUp();

        Meteor.call('slack', title, name, time);
      };

      return false;
    },
    "focus #newRequestTitle": function (event) {
      $(event.target).siblings('#newRequestName').slideDown();
      return false;
    }
  });

  Template.request.events({
  	"click .toggle-checked": function () {
  		Requests.update(this._id, {$set: {checked: ! this.checked}});
  	},
  	"click .delete": function () {
  		Requests.remove(this._id);
  	}
  });

  Template.completeRequest.events({
    "click .toggle-checked": function () {
      Requests.update(this._id, {$set: {checked: ! this.checked}});
    },
    "click .delete": function () {
      Requests.remove(this._id);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {

    Meteor.methods({
      slack: function (title, name, time) {
        var icon_url = "http%3A%2F%2Ficons.iconarchive.com%2Ficons%2Fthebadsaint%2Fmy-mavericks-part-2%2F128%2FPlex-icon.png";
        var postMessage = "New plex request from " + name + ": " + title + " @ " + time;
        var token = "";
        HTTP.post("https://slack.com/api/chat.postMessage?token="+token+"&channel=C051U8PCQ&text="+postMessage+"&username=Plex%20Request%20Bot&icon_url="+icon_url+"&pretty=1")
      }
    });

  });
}
