#!/usr/bin/env bash

sudo dtrace -Z -n 'woodland*:::allows{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); }'  \
               -n 'woodland*:::decorate{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); }'  \
               -n 'woodland*:::error{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); }'  \
               -n 'woodland*:::route{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); }'  \
               -n 'woodland*:::routes{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); trace(copyinstr(arg3)); }'  \
               -n 'tenso*:::etag{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); }'  \
               -n 'tenso*:::headers{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); trace(copyinstr(arg3)); }'  \
               -n 'tenso*:::rate{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); trace(copyinstr(arg3)); trace(copyinstr(arg4)); trace(copyinstr(arg5)); trace(copyinstr(arg6)); }'  \
               -n 'tenso*:::render{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); }'  \
               -n 'tenso*:::send{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); trace(copyinstr(arg3)); }'
