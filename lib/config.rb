# your own setting

LogFile = "../log/server.log"
LogLevel = :debug
LogAge = 7
LogSize = 10

SystemPort = 8100
SystemBindAddress = "0.0.0.0"
HTTPAccessControl = "*"

AWS_REGION = "ap-northeast-1"
AWS_REPORTDB = "Oishi3"
AWS_ROUTEDB = "Oishi2"
AWS_TRACEDB = "Oishi4"

# in second
TraceTimeRange = 60 * 60 * 24 * 1

POLLING_INTERVAL = 2

UseSSL = true
SSLCertFile = '/etc/letsencrypt/live/digital-bosai.net/fullchain.pem'
SSLCertKeyFile = '/etc/letsencrypt/live/digital-bosai.net/privkey.pem'
