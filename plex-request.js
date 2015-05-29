Requests = new Mongo.Collection("requests");

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    requests: function () {
      return Requests.find({}, {sort: {createdAt: -1}});
    }
  });

  Template.body.events({
  	"submit .new-request": function (event) {
  		var text = event.target.text.value;

  		Requests.insert({
  			text: text,
  			createdAt: new Date()
  		});

  		event.target.text.value = "";

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
