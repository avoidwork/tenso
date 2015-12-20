#!/usr/bin/env bash

sudo dtrace -Z -n 'tenso*:::allowed{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); trace(arg3); }'  \
               -n 'tenso*:::compress{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(arg2); }'  \
               -n 'tenso*:::compression{ trace(copyinstr(arg0)); trace(arg1); }'  \
               -n 'tenso*:::error{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(arg2); trace(copyinstr(arg3)); trace(arg4); }'  \
               -n 'tenso*:::headers{ trace(arg0); trace(arg1); }'  \
               -n 'tenso*:::log{ trace(copyinstr(arg0)); trace(arg1); trace(arg2); trace(arg3); }'  \
               -n 'tenso*:::proxy{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); trace(copyinstr(arg3)); trace(arg4); }'  \
               -n 'tenso*:::middleware{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(arg2); }'  \
               -n 'tenso*:::request{ trace(copyinstr(arg0)); trace(arg1); }'  \
               -n 'tenso*:::respond{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); trace(arg3); trace(arg4); }'  \
               -n 'tenso*:::status{ trace(arg0); trace(arg1); trace(arg2); trace(arg3); trace(arg4); }'  \
               -n 'tenso*:::write{ trace(copyinstr(arg0)); trace(copyinstr(arg1)); trace(copyinstr(arg2)); trace(copyinstr(arg3)); trace(arg4); }'
