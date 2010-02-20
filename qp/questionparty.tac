from twisted.web import server, resource
from twisted.internet import reactor
from qp import settings

class Root(resource.Resource):
    isLeaf=True
    def render_GET(self, request):
        return "lol, this is the index."

site = server.Site(Root())
reactor.listenTCP(settings.SERVER_PORT, site)
reactor.run()
