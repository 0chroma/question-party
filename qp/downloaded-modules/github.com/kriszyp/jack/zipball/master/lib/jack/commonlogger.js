var when = require("promise").when;

var CommonLogger = exports.CommonLogger = function(nextApp, logger) {
    logger = logger || {};
    
    return function(request) {
        var time = new Date();
        logger.log = logger.log || function log(string) {
            request.jsgi.errors.print(string);
            request.jsgi.errors.flush();
        };
        return when(nextApp(request), function(response) {
            var data = response.body,
                length = 0;
            
            response.body = {
                forEach: function(write) {
                    return when(
                        data.forEach(function(chunk) {
                            write(chunk);
                            length += chunk.toByteString().length;
                        }),
                        function() {
                            var now = new Date();
                            
                            // Common Log Format: http://httpd.apache.org/docs/1.3/logs.html#common
                            // lilith.local - - [07/Aug/2006 23:58:02] "GET / HTTP/1.1" 500 -
                            //             %{%s - %s [%s] "%s %s%s %s" %d %s\n} %
                            
                            var address     = request.headers['x-forwarded-for'] || request.remoteAddr || "-",
                                user        = request.remoteUser || "-",
                                timestamp   = CommonLogger.formatDate(now),
                                method      = request.method,
                                path        = (request.scriptName || "") + (request.pathInfo || ""),
                                query       = request.queryString ? "?" + request.queryString : "",
                                version     = request.jsgi.version,
                                status      = String(response.status).substring(0,3),
                                size        = length === 0 ? "-" : "" + length,
                                duration    = now.getTime() - time.getTime();
                            
                            var stringToLog = address+' - '+user+' ['+timestamp+'] "'+method+' '+path+query+' '+version+'" '+status+' '+size
                            //stringToLog += ' '+duration;
                            
                            logger.log(stringToLog);
                        }
                    );
                }
            }
            
            return response;
        });
    }
}

CommonLogger.formatDate = function(date) {
    var d = date.getDate(),
        m = CommonLogger.MONTHS[date.getMonth()],
        y = date.getFullYear(),
        h = date.getHours(),
        mi = date.getMinutes(),
        s = date.getSeconds();
        
    // TODO: better formatting
    return (d<10?"0":"")+d+"/"+m+"/"+y+" "+
        (h<10?"0":"")+h+":"+(mi<10?"0":"")+mi+":"+(s<10?"0":"")+s;
}

CommonLogger.MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
