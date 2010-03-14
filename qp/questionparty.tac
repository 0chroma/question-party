from twisted.web import static, server, resource
from twisted.internet import reactor
from qp import settings
from qp.rpc import ExposedQpRpc, RpcSmd
import os

root = static.File('%s/qp/static/' % os.getcwd())

root.putChild('rpc', ExposedQpRpc()) 
root.putChild('rpcsmd', RpcSmd())

site = server.Site(root)
reactor.listenTCP(settings.SERVER_PORT, site)
reactor.run()
