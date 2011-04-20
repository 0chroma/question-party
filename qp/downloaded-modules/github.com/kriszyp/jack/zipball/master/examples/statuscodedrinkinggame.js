var HTTP_STATUS_CODES = require("jack/utils").HTTP_STATUS_CODES;
// patch code map for the Hyper Text Coffee Pot Control Protocol
HTTP_STATUS_CODES[418] = "I'm a teapot";

var map = exports.map = {
    200: "Calm the fuck down. No one drinks.",
    201: "Create a drinking rule. Then drink.",
    202: "You will drink, after the next persons turn.",
    300: "Choose multiple people to drink.",
    301: "Choose someone to drink with. It's then their turn.",
    305: "Person to your right feeds you a drink.",
    307: "Choose someone to drink.",
    401: "Everyone but you drinks.",
    403: "Miss a turn. Must drink double on next turn.",
    404: "Last person to make a greeting must drink.",
    406: "Must drink twice, loser.",
    409: "Drink, then go again.",
    410: "Remove a drinking rule (if one has been created).",
    411: "Take a looooong drink.",
    412: "You may add a precondition to drinking.",
    413: "Thats what she said! Everyone drinks.",
    416: "Person on your left and right drink with you.",
    417: "Drink before your turn? If not, drink and go again.",
    418: "Sing \"I'm a little teapot\". Drink.",
    500: "Oh fuck, Everone drinks!"
}

exports.app = function(request) {
    var codes = Object.keys(map),
        code = codes[Math.floor(codes.length * Math.random())];
    return {
        status: code,
        headers: {"content-type" : "text/html"},
        body: [code + " ", HTTP_STATUS_CODES[code], "<br />", map[code]]
    }
}
