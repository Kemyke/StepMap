var restify = require('restify');  
var server = restify.createServer();
server.use(restify.bodyParser());

var mongoose = require('mongoose/');
var config = require('./config');
db = mongoose.connect(config.creds.mongoose_auth_local),
Schema = mongoose.Schema;  

// Create a schema for our data
var ProjectSchema = new Schema({
  id: Number,
  name: String,
  startdate: Date,    
  goodpoint: Number,
  badpoint: Number,
  nextstep: 
	   {
		  id: Number,
		  name: String,
		  deadline: Date,    
		  sentreminders: Number,
		  projectid: Number
	   },
  completedsteps: 
	   {
		  id: Number,
		  name: String,
		  deadline: Date,
	          finishdate: Date,    
		  sentreminders: Number,
		  projectid: Number
	   }

});
// Use the schema to register a model with MongoDb
mongoose.model('Project', ProjectSchema); 
var Project = mongoose.model('Project'); 

function getProjects(req, res, next) {
  // Resitify currently has a bug which doesn't allow you to set default headers
  // This headers comply with CORS and allow us to server our response to any origin
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // .find() without any arguments, will return all results
  // the `-1` in .sort() means descending order
  
  var ps = Project.find().sort('id');

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
  project.id = req.params.id;
  project.name = req.params.name;
  project.startdate = req.params.startdate;
  project.badpoint = req.params.badpoint;
  project.goodpoint = req.params.goodpoint;
  project.nextstep = req.params.nextstep;
  project.save(function () {
    res.send(req.body);
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

// Set up our routes and start the server
server.get('/projects', getProjects);
server.post('/projects', postProject);
server.del('/projects/:_id', delProject);
server.listen(8080);

