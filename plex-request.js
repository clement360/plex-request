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

      if (title.length < 1) {
        $('#newRequestTitle').effect( "shake" );
      } else if (name.length < 1) {
        $('#newRequestName').effect( "shake" );
      } else {
        Requests.insert({
          title: title,
          name: name,     
          createdAt: new Date()
        });

        $('#newRequestTitle').val('');
        $('#newRequestName').val('');
        $('#newRequestName').slideUp();
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
    // code to run on server at startup
  });
}
