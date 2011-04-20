/**
 * Session variables live throughout a user's session.
 *
 * HTTP is a stateless protocol for a *good* reason. Try to avoid using 
 * session variables. 
 */
var Session = exports.Session = function(request) {
    if (!request.env.jack) request.env.jack = {};
    if (!request.env.jack.session) {
        try {
            request.env.jack.session = request.env.jack.session.loadSession(request);
        } catch (err) {
            request.env.jack = {};
        }
    }
                
    return request.env.jack.session;
}
