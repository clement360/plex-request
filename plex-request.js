Requests = new Mongo.Collection("requests");

if (Meteor.isClient) {

  Meteor.subscribe("requests");
  Meteor.subscribe("userData");

  debugger;

  Template.body.helpers({
    requests: function () {
      return Requests.find({upcoming: false}, {sort: {createdAt: -1}});
    },
    upcoming: function () {
      return Requests.find({upcoming: true}, {sort: {createdAt: -1}});
    },
    completes: function () {
      return Requests.find({}, {sort: {completedAt: -1}});
    }
  });

  Template.emailForm.events({
    'submit form': function(){
      var email = $('#userEmail').val();

      if (email.length < 1) {
        $('#userEmail').effect( "shake" );
      } else {
        $('#emailFooter').fadeOut();
        toastr.success('you\'ll be notified now', 'Great it worked!');
        $('#userEmail').val('');
        Meteor.call("addEmail", email);
      };
      return false;
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
    }
  });


  Template.upcomingRequestForm.events({
    'submit form': function(){
      var title = $('#UpcomingRequestTitle').val();

      if (title.length < 1) {
        $('#UpcomingRequestTitle').effect( "shake" );
      } else {
        $('#UpcomingRequestTitle').val('');
        Meteor.call("addUpcoming", title);
        Meteor.call('slack', title, Meteor.user().username);
      };
      return false;
    }
  });

  Template.upcomingRequestForm.events({
    "click .toggle-checked": function () {
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
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
  
  /* ------------------------------------------------
  ----------------- Global Helpers ------------------
  -------------------------------------------------*/

  Template.registerHelper('isOwner', function () {
    return this.owner === Meteor.userId();
  });

  Template.registerHelper('isAdminOrOwner', function () {
    return (Roles.userIsInRole(Meteor.userId(), 'admin') || this.owner === Meteor.userId());
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
    Meteor.publish(null, function (){ 
      return Meteor.roles.find({})
    })

    Meteor.publish("requests", function () {
      return Requests.find({});
    });

    Meteor.publish("userData", function() {
    if (this.userId) {
   return Meteor.users.find(
     {_id: this.userId},
     {fields: {email: 1}});
 }
});

    clement = Meteor.users.findOne({username: "clement"});
    if(clement) {
      Roles.addUsersToRoles(clement._id, 'admin');
    }
    
    Meteor.methods({
      slack: function (title, name) {
        if (! Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
        }

        var time = new Date();
        time = moment(time).format('l LT');

        var icon_url = "http%3A%2F%2Ficons.iconarchive.com%2Ficons%2Fthebadsaint%2Fmy-mavericks-part-2%2F128%2FPlex-icon.png";
        var postMessage = "New plex request from " + name + ": " + title + " @ " + time;
        
        if(Meteor.settings.slack) {
          var token = Meteor.settings.slack.token;
          HTTP.post("https://slack.com/api/chat.postMessage?token="+token+"&channel=C051U8PCQ&text="+postMessage+"&username=Plex%20Request%20Bot&icon_url="+icon_url+"&pretty=1");
        } else {
          console.log('Debugging mode: no slack token set');
        }
      },

      addTask: function (title) {
        if (! Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
        }

        var time = new Date();
        Requests.insert({
          title: title,
          upcoming: false,
          owner: Meteor.userId(),
          name: Meteor.user().username,     
          createdAt: time,
          completedAt: null
        });
      },
      addEmail: function (email) {
        if (! Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
        }
        Roles.addUsersToRoles(Meteor.userId(), 'subscriber');
        Meteor.users.update(Meteor.userId(), { $set: { email: email } });
      },
      addUpcoming: function (title) {
        if (! Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
        }

        var time = new Date();
        Requests.insert({
          title: title,
          upcoming: true,
          owner: Meteor.userId(),
          name: Meteor.user().username,     
          createdAt: time,
          completedAt: null
        });
      },
      deleteTask: function (requestId) {
        var request = Requests.findOne(requestId);
        if (request.owner !== Meteor.userId() && !Roles.userIsInRole(Meteor.userId(), 'admin')) {
          throw new Meteor.Error("not-authorized");
        }
        Requests.remove(requestId);
      },
      setChecked: function (requestId, setChecked) {
        var request = Requests.findOne(requestId);
        if (request.owner !== Meteor.userId() && !Roles.userIsInRole(Meteor.userId(), 'admin')) {
          throw new Meteor.Error("not-authorized");
        }

        Requests.update(requestId, { $set: { checked: setChecked, completedAt: new Date() } });
      }
    });

  });
}
