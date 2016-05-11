#!/bin/bash
rsync -av --exclude-from .rsync_exclude /Users/lishuangtao/workspace/cag-web/ cag:/root/cag-web
