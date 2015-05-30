Requests = new Mongo.Collection("requests");

if (Meteor.isClient) {

  Meteor.subscribe("requests");

  Template.body.helpers({
    requests: function () {
      return Requests.find({}, {sort: {createdAt: -1}});
    },
    incompleteCount: function () {
      return Requests.find({checked: {$ne: true}}).count();
    }
  });

  Template.requestForm.events({
    'submit form': function(){
      var title = $('#newRequestTitle').val();

      if (title.length < 1) {
        $('#newRequestTitle').effect( "shake" );
      } else {
        $('#newRequestTitle').val('');
        Meteor.call("addTask", title);
        Meteor.call('slack', title, Meteor.user().username);
      };

      return false;
    }
  });

  Template.request.events({
  	"click .toggle-checked": function () {
      Meteor.call("setChecked", this._id, ! this.checked);
  	},
  	"click .delete": function () {
  		Meteor.call("deleteTask", this._id);
  	},
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Template.request.helpers({
    isOwner: function() {
      return this.owner === Meteor.userId();
    }
  });

  Template.completeRequest.events({
    "click .toggle-checked": function () {
      Meteor.call("setChecked", this._id, ! this.checked)
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    }
  });

  Template.completeRequest.helpers({
    isOwner: function() {
      return this.owner === Meteor.userId();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}


/* ------------------------------------------------
----------------- S E R V E R ---------------------
-------------------------------------------------*/


if (Meteor.isServer) {
  Meteor.startup(function () {

     Meteor.publish("requests", function () {
      return Requests.find({
        $or: [
          { private: {$ne: true} },
          { owner: this.userId }
        ]
      });
    });

    Meteor.methods({
      slack: function (title, name) {
        var time = new Date();
        time = moment(time).format('l LT');

        var icon_url = "http%3A%2F%2Ficons.iconarchive.com%2Ficons%2Fthebadsaint%2Fmy-mavericks-part-2%2F128%2FPlex-icon.png";
        var postMessage = "New plex request from " + name + ": " + title + " @ " + time;
        var token = Meteor.settings.slack.token;
        HTTP.post("https://slack.com/api/chat.postMessage?token="+token+"&channel=C051U8PCQ&text="+postMessage+"&username=Plex%20Request%20Bot&icon_url="+icon_url+"&pretty=1");
      },

      addTask: function (title, time) {
        if (! Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
        }
        var time = new Date();
        Requests.insert({
          title: title,
          owner: Meteor.userId(),
          name: Meteor.user().username,     
          createdAt: time
        });
      },
      deleteTask: function (requestId) {
        var request = Requests.findOne(requestId);
        if (request.owner !== Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
        }

        Requests.remove(requestId);
      },
      setChecked: function (requestId, setChecked) {
        var request = Requests.findOne(requestId);
        if (request.owner !== Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
        }

        Requests.update(requestId, { $set: { checked: setChecked} });
      },
      setPrivate: function (requestId, setToPrivate) {
        var request = Requests.findOne(requestId);

        // Make sure only the task owner can make a task private
        if (request.owner !== Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
        }

        Requests.update(requestId, { $set: { private: setToPrivate } });
      }

    });

  });
}
