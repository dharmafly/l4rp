
/*
 * GET home page.
 */



exports.index = function(req, res){
  res.render('index', { title: 'L4RP' })
};

exports.people = require('./people');