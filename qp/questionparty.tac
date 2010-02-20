from twisted.web import static, server, resource
from twisted.internet import reactor
from qp import settings
import os

root = static.File('%s/qp/static/' % os.getcwd())

class Rpc(resource.Resource):
    isLeaf=True
    def render_GET(self, request):
        return "this will handle JSON-RPC eventually"

root.putChild('rpc', Rpc()) 

site = server.Site(root)
reactor.listenTCP(settings.SERVER_PORT, site)
reactor.run()
