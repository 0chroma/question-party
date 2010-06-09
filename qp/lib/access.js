/**
 * Defines the capabilities of different users
 */
var questionFacets = require("facet/question"),
	answerFacets = require("facet/answer"),
	admins = require("commonjs-utils/settings").admins,
	Register = require("pintura/security").Register,
	FullAccess = require("pintura/security").FullAccess,
	security = require("pintura/pintura").config.security;

security.getAllowedFacets = function(user, request){
    //no users in qp
	/*if(user){
		if(admins.indexOf(user.username)>-1){
			return [FullAccess];
		}
		return [pageFacets.UserFacet, pageChangeFacets.PublicFacet];
	}*/
	return [questionFacets.PublicFacet, answerFacets.PublicFacet/*, Register*/];
};
