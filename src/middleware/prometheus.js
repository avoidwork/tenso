import promBundle from "express-prom-bundle"; // todo replace with custom middleware to track stats

// Prometheus metrics
export const prometheus = config => promBundle(config);
