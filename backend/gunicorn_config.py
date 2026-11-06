"""
Gunicorn configuration for production deployment on Render.
This file is used when running: gunicorn -c gunicorn_config.py config.wsgi
"""

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
# Render gives 512MB RAM, so we use CPU count for workers
workers = multiprocessing.cpu_count()
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 120
graceful_timeout = 30

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "pope-api"

# Server hooks
def post_fork(server, worker):
    """Called just after a worker has been forked."""
    import sys
    print(f"Worker spawned (pid: {os.getpid()})", file=sys.stderr)

def post_worker_init(worker):
    """Called just after a worker has initialized the application."""
    pass
