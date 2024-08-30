import promBundle from "express-prom-bundle";

// Prometheus metrics
export const prometheus = config => promBundle(config);
