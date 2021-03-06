var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session')
var serveStatic = require('serve-static')
var crypto = require('crypto');
var schedule = require('node-schedule');
var nodemailer = require("nodemailer");
var ejs = require('ejs');
ejs.open = '{{';
ejs.close = '}}';

var app = express();

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.set('view engine', 'html'); // set up ejs for templating
app.engine('html', require('ejs').renderFile);

app.use(session({ secret: 'epkhhubhccue' })); // session secret

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	  done(null, user);
	});
	 
passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use('local', new LocalStrategy(
		  function(username, password, done) {
			var pwdhash = crypto.createHash('md5').update(password).digest('hex');
			var us = User.findOne({email: username, pwdhash: pwdhash});
			if(us)
			{
				us.exec(function (arr,data) {
						if(data)
						{
					      		return done(null, {id:data._id, username:data.email});
						}
						else
						{
							return done(null, false);	
						}
					  	});
			}
			else
			{
	    			return done(null, false);
			}
		    })
		  );


var mongoose = require('mongoose/');
var config = require('./config');
db = mongoose.connect(config.creds.mongoose_auth_local),
Schema = mongoose.Schema;  

// Create a schema for our data
var ProjectSchema = new Schema({
  userid: String,
  position: Number,
  name: String,
  startdate: Date,    
  goodpoint: Number,
  badpoint: Number,
  nextstep: 
	   {
		  name: String,
		  deadline: Date,    
		  sentreminders: Number,
		  projectid: Number
	   },
  completedsteps: 
	   {
		  name: String,
		  deadline: Date,
	          finishdate: Date,    
		  sentreminders: Number,
		  projectid: Number
	   }

});

// Create a schema for our data
var UserSchema = new Schema({
  email: String,
  pwdhash: String,
  lastlogin: Date
});

// Use the schema to register a model with MongoDb
mongoose.model('Project', ProjectSchema); 
var Project = mongoose.model('Project'); 

mongoose.model('User', UserSchema); 
var User = mongoose.model('User'); 

function getProjects(req, res, next) {
  // Resitify currently has a bug which doesn't allow you to set default headers
  // This headers comply with CORS and allow us to server our response to any origin
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // .find() without any arguments, will return all results
  // the `-1` in .sort() means descending order
  
  var ps = Project.find({userid: req.user.id}).sort('id');

  if(ps)
  {  
    ps.exec(function (arr,data) {
      res.send(data);
  	});
  }
  else
  {
   res.send("nothing");
  }
}

function postProject(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // Create a new message model, fill it up and save it to Mongodb
  var project = new Project();
  project.id = req.body.id;
  project.userid = req.user.id;
  project.name = req.body.name;
  project.position = req.body.position;
  project.startdate = req.body.startdate;
  project.badpoint = req.body.badpoint;
  project.goodpoint = req.body.goodpoint;
  project.nextstep = req.body.nextstep;
  project.completedsteps = req.body.completedsteps;
  project.save(function () {
    res.send(project);
  });
}

function delProject(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "X-Requested-With");
	  // Create a new message model, fill it up and save it to Mongodb
	  
	  var project = Project.find({_id: req.params._id});
	  
	  project.remove(function () {
	    res.send(req.body);
	  });
	}

function putProject(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "X-Requested-With");
	  // Create a new message model, fill it up and save it to Mongodb
	  Project.findOne({_id: req.body._id}, function(err, mymodel) {

		  mymodel.id = req.body.id;
		  mymodel.name = req.body.name;
		  mymodel.position = req.body.position;
		  mymodel.startdate = req.body.startdate;
		  mymodel.badpoint = req.body.badpoint;
		  mymodel.goodpoint = req.body.goodpoint;
		  mymodel.nextstep = req.body.nextstep;
		  mymodel.completedsteps = req.body.completedsteps;
		  mymodel.save(function () {
	    res.send(req.body);
	  });
	});
}

// Set up our routes and start the server
app.get('/', function(req, res) {
		res.render('index.html');
		
	});
app.get('/projects', isLoggedIn, getProjects);
app.post('/projects', postProject);
app.delete('/projects/:_id', delProject);
app.put('/projects/:_id', putProject);

app.use(serveStatic('./views', {'index': ['default.html', 'default.htm']}))

app.listen(8080);

function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.send({redirect: '/login'});
}

//POST /login
var loginRoute = function(req, res, next) {
    // The local login strategy
    passport.authenticate('local', function(err, user) {
        if (err) {
            return next(err);
        }
 
        // Technically, the user should exist at this point, but if not, check
        if(user) {
		// Log the user in!
		req.logIn(user, function(err) {
		    if (err) { 
		        return next(err);
		    }
		    console.log(req.isAuthenticated());
		    req.session.user_id = req.user.id;
		     
		    res.redirect('/');
		});
	}
	else
	{
		res.redirect('/');
	}
 
    })(req, res, next);
};

app.post('/login', loginRoute);
app.get('/login', function(req, res) {
		res.render('login.html');
		
	});
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});

function postSignup(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // Create a new message model, fill it up and save it to Mongodb
  if(req.body.password == req.body.passwordcheck)
  {
	  var user = new User();
	  user.email = req.body.email;
	  var pwdhash = crypto.createHash('md5').update(req.body.password).digest('hex');
	  user.pwdhash = pwdhash;
	  user.save(function () {
	    res.redirect('/login');
	  });
  }
  else
  {
	res.redirect('/signup');
  }
}

app.post('/signup', postSignup);
app.get('/signup', function(req, res) {
		res.render('signup.html');
});

var rule = new schedule.RecurrenceRule();
rule.hour = 8;
rule.minute = 0;

var j = schedule.scheduleJob(rule, function(){

	getProjectToSendEmail(function(data, messagetype) {
		for(var project in data) {
			sendEmailNotificationToUser(project, messagetype);
		}
	});
});


function sendEmailNotificationToUser(project, messagetype) {
	
	var us = User.findOne({_id: project.userid});
	if(us)
	{
		us.exec(function (arr,data) {
			var message = getMessageFromMessageType(messagetype);
			sendEmail(data.email, message);
		});
	}
}

function getMessageFromMessageType(messagetype) {
 return "You are lazy!";
}

function sendEmail(address, message) {

	// setup e-mail data with unicode symbols
	var mailOptions = {
	    from: "Stepmap ✔ <stepmap.notification@gmail.com>", // sender address
	    to: address, // list of receivers
	    subject: "Project notification ✔", // Subject line
	    text: message, // plaintext body
	    html: message // html body
	}

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	if(error){
		console.log(error);
	}else{
		console.log("Message sent: " + response.message);
	}
	});
}

function getProjectToSendEmail(completed) {

	var firstCheck = new Date();
	var numberOfDaysToAdd = 3;
	firstCheck.setDate(firstCheck.getDate() + numberOfDaysToAdd); 
	firstCheck.setHours(0,0,0,0);
	var ps = Project.find({'nextstep.deadline': firstCheck})

	if(ps)
	{  
		ps.exec(function (arr,data) {
			completed(data, 'first mail');
		});
	}
	else
	{
		console.log("Zero first notification sent!");
	}
}

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        XOAuth2: {
            user: "stepmap.notification@gmail.com",
            clientId: "722698500997-qsoun6isuvph7tq38mvnjuvq12of9t30.apps.googleusercontent.com",
            clientSecret: "qPWRAObodOH36Nm8u_ufpPV9",
            refreshToken: "1/ZfXzHnitbpu4DBNuYRYUfFjF_taLUrYEK_a5wh5e1lQ"
        }
    }
});


getProjectToSendEmail(function(data, messagetype) {
	for(var project in data) {
		sendEmailNotificationToUser(data[project], messagetype);
	}
	});

