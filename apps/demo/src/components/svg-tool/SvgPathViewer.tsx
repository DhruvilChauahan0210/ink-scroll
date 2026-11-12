'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { sanitizeSvg } from '@/lib/svg-sanitize';
import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * The SVG path viewer. Paste an SVG (or one path's d value): it is rebuilt from
 * drawing elements only (lib/svg-sanitize.ts), shown, measured with the
 * browser's own getTotalLength(), checked for what stops a line drawing from
 * working, and drawn with scrollDraw, the library this site is about. The
 * preview plays when it comes on screen and on Replay, and the progress slider
 * scrubs it, all through the instance's seek().
 *
 * Under the code, the JavaScript tab runs as a page of its own: the drawing the
 * preview shows (Line view or as pasted) in a page tall enough to scroll it
 * through the window, as an HTML file or a React project on StackBlitz.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;
type Shape = { i: number; tag: string; length: number | null; commands: string; stroke: boolean; fill: boolean; nonScaling: boolean; pieces: number };
/** The drawing as written out: the Clean SVG tab, and what the preview draws as markup and as JSX. */
type Written = { clean: string; drawn: string; drawnJsx: string };

const SLUG = 'svg-path-viewer';
const SVG_NS = 'http://www.w3.org/2000/svg';
/** What scrollDraw draws by default (its `selector` option). */
const DRAWN = new Set(['path', 'polyline', 'line', 'polygon', 'rect', 'circle']);
const GEOMETRY = 'path, polyline, polygon, line, rect, circle, ellipse';
const PLAY_MS = 1800;
const STAGGER = 0.12;
const EMPTY: Record<string, number> = {};
const NONE: Written = { clean: '', drawn: '', drawnJsx: '' };

/**
 * The sample: a cat illustration from Tibbixel (https://tibbixel.com), the
 * file exactly as downloaded, used under Tibbixel's licence
 * (https://tibbixel.com/licence.php). It is not covered by this repository's
 * MIT licence: do not reuse or redistribute the file on its own.
 */
const SAMPLE = `<?xml version="1.0" ?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xlink="http://www.w3.org/1999/xlink" baseProfile="full" height="294.0701mm" id="svg5" version="1.1" viewBox="0 0 246.54726 294.0701" width="246.54726mm" xml:space="preserve">
	<defs/>
	<path d="M 87.489,293.356 C 85.664,292.633 84.803,292.576 73.025,292.387 L 60.501,292.186 L 58.723,291.248 C 55.338,289.461 52.222,285.031 52.214,281.994 C 52.214,280.709 51.935,280.347 47.889,276.324 C 41.544,270.015 37.526,264.034 34.571,256.501 C 32.755,251.869 31.891,248.192 31.19,242.102 C 30.72,238.014 30.692,236.509 31.026,233.283 C 32.629,217.798 38.299,206.685 50.378,195.35 L 54.223,191.742 L 54.443,187.46 C 54.891,178.76 57.481,167.885 61.064,159.659 C 62.201,157.05 62.296,156.544 61.648,156.543 C 60.956,156.543 52.291,152.239 49.559,150.539 C 41.582,145.576 32.375,137.233 27.869,130.884 C 26.608,129.107 25.318,127.645 25.002,127.634 C 24.086,127.604 15.401,130.671 10.492,132.758 C 4.733,135.206 3.49,135.223 2.274,132.871 C 1.515,131.404 1.893,130.002 3.404,128.675 C 5.075,127.208 12.346,123.73 17.109,122.119 C 19.244,121.397 21.109,120.703 21.255,120.577 C 21.401,120.45 20.946,118.927 20.245,117.19 C 19.544,115.453 18.84,113.695 18.682,113.283 L 18.395,112.533 L 12.46,113.556 C 9.197,114.119 5.97,114.733 5.291,114.922 C 3.203,115.501 2.054,115.341 0.989,114.319 C 0.178,113.542 -0.0,113.072 -0.0,111.699 C -0.0,110.314 0.159,109.902 0.928,109.297 C 2.337,108.188 8.951,106.428 14.842,105.594 L 16.456,105.365 L 15.995,103.173 C 14.571,96.388 14.528,87.075 15.88,77.8 L 16.636,72.611 L 15.723,65.276 C 13.053,43.824 12.469,26.306 13.971,12.731 C 14.889,4.444 15.838,2.298 19.285,0.72 C 20.787,0.032 21.494,-0.1 22.674,0.087 C 36.493,2.281 57.882,9.782 72.481,17.556 L 76.479,19.685 L 80.661,18.637 C 86.175,17.255 89.125,16.681 95.073,15.828 C 102.123,14.818 102.876,14.743 109.513,14.374 C 121.881,13.689 140.045,15.638 152.295,18.963 L 154.836,19.654 L 161.193,16.522 C 174.792,9.824 186.713,5.38 200.554,1.851 C 208.234,-0.108 209.518,-0.289 211.58,0.288 C 213.885,0.933 216.05,3.159 216.76,5.615 C 217.955,9.746 218.477,16.617 218.485,28.308 C 218.485,40.942 217.947,49.426 216.206,63.684 L 215.117,72.601 L 215.706,76.676 C 216.966,85.381 217.0,95.859 215.786,102.156 C 215.429,104.012 215.4,104.775 215.681,104.855 C 215.897,104.915 217.502,105.164 219.248,105.405 C 222.831,105.898 228.093,107.229 229.654,108.035 C 231.641,109.064 232.02,111.325 230.506,113.124 C 229.365,114.479 228.7,114.498 221.869,113.365 C 215.066,112.237 213.505,112.096 213.138,112.577 C 212.691,113.164 209.788,120.217 209.943,120.34 C 210.013,120.399 211.822,121.039 213.956,121.764 C 218.967,123.468 226.901,127.277 228.251,128.626 C 229.878,130.253 229.426,132.96 227.372,133.897 C 225.916,134.56 225.341,134.436 220.567,132.428 C 218.095,131.389 213.869,129.781 211.174,128.854 C 206.902,127.386 206.235,127.24 205.965,127.724 C 205.795,128.028 204.304,130.015 202.652,132.14 C 195.567,141.254 184.848,149.568 173.622,154.656 C 171.643,155.553 170.257,156.384 170.32,156.637 C 170.38,156.876 171.039,158.58 171.786,160.423 C 175.661,169.989 178.134,182.439 178.146,192.435 L 178.146,195.697 L 180.286,197.871 C 187.587,205.286 192.501,214.122 195.265,224.806 C 195.617,226.164 195.948,227.333 196.002,227.404 C 196.164,227.615 200.835,223.878 204.806,220.356 C 209.2,216.46 213.286,211.966 217.761,206.109 C 222.198,200.299 224.872,197.686 227.801,196.299 C 229.957,195.278 230.494,195.173 233.532,195.173 C 236.398,195.173 237.164,195.303 238.824,196.083 C 242.976,198.031 246.17,202.703 246.5,207.309 C 247.095,215.619 242.017,229.597 234.314,240.857 C 221.808,259.138 201.656,273.018 179.733,278.451 C 174.625,279.717 174.756,279.63 174.524,281.883 C 174.087,286.114 171.01,290.139 167.09,291.606 C 165.224,292.304 164.398,292.363 156.481,292.363 C 148.323,292.363 147.811,292.403 146.176,293.157 C 144.521,293.92 144.076,293.95 134.57,293.95 L 124.685,293.95 L 122.312,292.782 C 121.007,292.14 119.132,290.87 118.146,289.96 L 116.352,288.306 L 114.581,290.016 C 113.608,290.957 111.756,292.226 110.465,292.838 L 108.119,293.95 L 98.771,294.04 C 89.883,294.12 89.326,294.09 87.482,293.358 L 87.489,293.356 M 94.897,282.822 C 94.897,280.396 97.116,278.938 99.15,280.026 C 100.007,280.485 100.894,282.175 100.894,283.349 C 100.894,284.173 101.021,284.249 102.393,284.247 C 107.505,284.247 110.77,281.049 110.304,276.515 C 110.124,274.761 108.645,265.942 106.574,254.263 C 105.513,248.276 102.684,231.52 102.319,229.057 C 102.145,227.882 101.264,222.319 100.362,216.692 C 98.435,204.68 98.431,203.535 100.312,201.809 C 101.366,200.843 101.867,200.641 103.198,200.641 C 105.332,200.641 106.731,201.417 107.574,203.069 C 108.22,204.335 110.223,215.791 114.861,244.738 C 115.56,249.103 116.221,252.913 116.33,253.204 C 116.438,253.496 116.669,252.781 116.844,251.617 C 117.33,248.362 121.189,226.597 123.097,216.339 C 124.036,211.294 124.905,206.447 125.029,205.568 C 125.44,202.648 127.624,200.292 129.922,200.289 C 131.649,200.289 133.558,201.534 134.358,203.186 L 135.089,204.698 L 134.245,209.46 C 133.78,212.079 132.905,217.001 132.299,220.396 C 131.693,223.792 130.169,232.364 128.911,239.445 C 126.938,250.548 123.72,268.171 122.357,275.327 C 121.843,278.026 122.277,279.789 123.921,281.662 C 125.314,283.246 126.594,283.799 129.597,284.106 L 131.937,284.345 L 131.937,282.905 C 131.937,278.669 137.144,278.389 137.815,282.59 L 138.036,283.971 L 140.237,283.831 C 144.279,283.573 146.959,280.883 148.855,275.179 C 150.531,270.138 158.403,242.513 161.35,231.331 C 168.422,204.497 169.612,195.531 167.761,183.001 C 167.09,178.457 166.742,176.836 165.381,171.911 C 164.351,168.187 162.371,162.674 161.356,160.705 C 160.871,159.765 160.849,159.76 159.576,160.292 C 157.8,161.034 148.594,163.351 143.049,164.451 C 131.758,166.692 116.784,167.632 105.655,166.799 C 95.736,166.057 84.762,164.205 75.937,161.785 C 73.756,161.187 71.76,160.779 71.5,160.878 C 70.872,161.119 68.312,167.688 66.804,172.927 C 63.363,184.882 63.068,195.995 65.836,209.459 C 68.175,220.839 77.471,255.468 82.787,272.606 C 85.243,280.522 87.304,283.112 91.734,283.846 C 94.985,284.386 94.895,284.414 94.895,282.822 L 94.897,282.822 M 66.12,281.931 C 67.046,281.005 66.828,278.787 65.685,277.507 C 64.704,276.41 64.684,276.405 63.578,276.976 C 62.264,277.656 61.736,278.514 61.736,279.967 C 61.736,281.942 64.756,283.294 66.12,281.931 L 66.12,281.931 M 164.234,281.619 C 164.71,281.143 165.1,280.413 165.1,279.998 C 165.1,278.292 163.021,276.551 160.299,275.979 L 159.203,275.748 L 158.094,278.923 C 157.485,280.669 156.986,282.184 156.986,282.291 C 156.986,282.398 158.422,282.485 160.177,282.485 C 163.095,282.485 163.442,282.415 164.234,281.619 L 164.234,281.619 M 75.847,282.024 C 75.847,281.964 75.307,280.575 74.647,278.937 L 73.447,275.959 L 71.472,275.853 C 69.666,275.753 68.946,276.106 69.828,276.651 C 70.01,276.763 70.358,278.043 70.602,279.494 L 71.046,282.132 L 73.446,282.132 C 74.767,282.132 75.847,282.082 75.847,282.024 L 75.847,282.024 M 173.539,268.171 C 181.461,259.702 185.49,250.999 186.593,239.972 C 187.333,232.58 185.66,224.421 181.857,216.868 C 180.509,214.192 177.138,208.946 176.911,209.173 C 176.841,209.243 176.218,211.913 175.52,215.111 C 173.591,223.963 169.111,240.835 164.059,258.28 C 162.885,262.332 161.925,265.774 161.925,265.928 C 161.925,266.081 162.838,266.471 163.953,266.793 C 166.271,267.461 169.04,268.877 169.909,269.837 C 170.235,270.196 170.696,270.491 170.935,270.491 C 171.174,270.491 172.345,269.447 173.539,268.171 M 57.757,269.026 C 59.985,267.493 62.814,266.69 67.001,266.401 C 68.956,266.267 70.555,266.099 70.555,266.03 C 70.555,265.96 69.358,261.657 67.894,256.467 C 62.453,237.173 61.626,234.115 59.282,224.629 C 57.963,219.294 56.527,212.864 56.091,210.342 C 55.655,207.82 55.23,205.522 55.146,205.236 C 55.042,204.88 54.442,205.326 53.234,206.647 C 44.623,216.09 39.996,227.993 40.699,238.892 C 41.223,247.016 44.023,255.329 48.412,261.792 C 49.685,263.666 55.561,270.138 55.99,270.138 C 56.07,270.138 56.868,269.637 57.757,269.026 L 57.757,269.026 M 194.185,262.418 C 204.824,257.206 214.154,249.834 221.754,240.634 C 228.922,231.958 233.398,223.351 235.837,213.553 C 236.893,209.31 236.878,207.09 235.787,205.877 C 233.679,203.537 231.526,204.549 227.791,209.636 C 218.827,221.847 207.502,232.597 197.693,238.208 C 196.666,238.795 196.58,239.001 196.381,241.346 C 195.844,247.675 193.625,255.378 190.691,261.1 C 189.635,263.161 188.874,264.846 189.0,264.846 C 189.126,264.846 191.46,263.753 194.187,262.418 L 194.185,262.418 M 132.291,156.228 C 142.552,154.817 150.459,152.969 159.606,149.842 C 171.122,145.906 180.765,140.218 188.752,132.649 C 192.279,129.306 196.292,124.574 195.837,124.292 C 195.663,124.185 193.796,123.841 191.689,123.528 C 186.249,122.719 185.208,122.044 185.208,119.321 C 185.208,118.36 185.478,117.766 186.28,116.964 L 187.352,115.892 L 190.778,116.141 C 192.662,116.278 195.54,116.619 197.173,116.899 C 198.806,117.18 200.255,117.285 200.392,117.132 C 200.935,116.534 202.583,112.418 202.367,112.202 C 202.241,112.076 198.993,112.182 195.15,112.433 C 187.471,112.94 187.041,112.874 186.094,111.042 C 185.096,109.112 185.663,107.157 187.462,106.332 C 188.706,105.762 195.864,104.823 201.52,104.489 L 205.307,104.265 L 205.638,102.976 C 206.761,98.591 206.904,97.108 206.895,89.868 C 206.895,83.651 206.744,81.445 206.094,77.632 L 205.302,72.98 L 206.172,65.814 C 208.037,50.44 208.842,38.525 208.843,26.253 C 208.843,19.809 208.32,10.582 207.931,10.174 C 207.732,9.966 200.974,11.748 195.143,13.546 C 184.947,16.689 174.872,20.781 163.403,26.437 C 158.161,29.022 155.983,29.927 155.289,29.811 C 154.767,29.721 151.959,29.077 149.048,28.373 C 139.62,26.094 127.264,24.265 121.236,24.255 L 118.823,24.255 L 119.76,25.369 C 121.119,26.984 123.404,31.694 124.059,34.234 C 124.733,36.846 124.52,43.548 123.532,50.776 C 122.83,55.908 122.394,56.71 120.304,56.71 C 118.052,56.71 117.599,55.826 117.322,50.889 C 116.662,39.102 114.706,33.196 109.749,28.03 C 106.356,24.493 105.643,24.131 102.66,24.431 L 100.213,24.676 L 101.964,26.842 C 104.016,29.377 105.888,32.822 106.681,35.519 C 107.427,38.057 107.391,41.843 106.552,49.126 C 105.902,54.772 105.807,55.169 104.924,55.935 C 103.707,56.989 102.08,56.864 101.223,55.651 C 100.757,54.992 100.503,53.517 100.216,49.79 C 100.004,47.051 99.516,43.559 99.13,42.029 C 98.229,38.453 96.062,34.085 94.072,31.827 C 92.345,29.869 88.517,27.076 87.566,27.079 C 87.232,27.079 84.609,27.716 81.737,28.49 C 78.864,29.265 76.118,29.899 75.633,29.899 C 75.149,29.899 72.736,28.829 70.273,27.522 C 57.663,20.831 45.429,16.039 30.499,11.944 C 27.015,10.989 24.059,10.312 23.93,10.44 C 23.504,10.862 22.93,21.762 22.935,29.337 C 22.935,40.013 24.298,57.795 25.939,68.759 C 26.428,72.028 26.412,72.409 25.527,78.284 C 24.184,87.195 24.278,95.817 25.796,102.96 L 26.141,104.583 L 30.798,104.817 C 35.342,105.046 40.632,105.548 42.965,105.972 C 43.604,106.088 44.596,106.653 45.17,107.227 C 46.617,108.673 46.602,110.351 45.13,111.823 L 44.047,112.906 L 40.28,112.669 C 29.36,111.985 28.928,111.977 28.928,112.44 C 28.928,112.98 31.042,117.345 31.415,117.576 C 31.559,117.666 33.717,117.422 36.211,117.037 C 43.809,115.863 45.595,116.102 46.552,118.412 C 47.107,119.753 46.512,121.761 45.335,122.533 C 44.881,122.831 42.51,123.322 39.986,123.64 C 37.494,123.957 35.392,124.261 35.316,124.319 C 35.02,124.546 38.367,128.512 41.558,131.719 C 55.586,145.815 76.586,154.173 104.785,156.882 C 110.373,157.419 126.405,157.039 132.291,156.23 L 132.291,156.228 M 104.42,133.283 C 102.81,132.793 101.439,131.924 100.121,130.555 C 97.893,128.241 97.427,125.759 98.938,124.248 C 100.184,123.003 101.681,123.092 102.719,124.474 C 105.259,127.853 106.154,128.206 108.857,126.898 C 110.729,125.992 112.07,124.075 112.53,121.647 C 113.215,118.039 113.163,117.905 110.609,116.686 C 106.351,114.654 104.56,112.339 104.856,109.254 C 105.062,107.107 106.042,105.778 108.365,104.491 C 110.225,103.46 110.297,103.45 115.887,103.45 C 121.105,103.45 121.675,103.52 123.426,104.306 C 125.449,105.219 127.131,107.108 127.527,108.909 C 128.148,111.737 125.949,114.662 121.772,116.565 L 119.146,117.762 L 119.319,120.193 C 119.617,124.346 122.259,127.616 125.318,127.616 C 126.588,127.616 128.058,126.684 128.058,125.879 C 128.058,125.7 128.469,125.065 128.971,124.468 C 130.236,122.965 131.877,122.965 133.142,124.468 C 133.644,125.065 134.052,125.898 134.048,126.32 C 134.038,127.665 132.8,129.868 131.303,131.217 C 127.448,134.693 121.035,134.175 117.345,130.09 L 116.024,128.629 L 115.312,129.535 C 113.066,132.389 107.631,134.26 104.42,133.283 L 104.42,133.283 M 120.025,112.564 C 123.334,111.273 124.2,110.039 122.729,108.708 C 122.066,108.108 121.4,108.036 116.468,108.036 C 110.861,108.036 109.118,108.378 108.735,109.55 C 108.527,110.19 110.806,112.245 112.23,112.7 C 114.12,113.304 118.316,113.231 120.025,112.564 L 120.025,112.564 M 69.316,111.812 C 63.32,109.738 58.296,103.694 57.664,97.793 C 57.151,92.999 58.938,88.033 62.438,84.528 C 64.874,82.087 67.798,80.566 71.495,79.817 C 74.016,79.306 74.56,79.301 76.81,79.767 C 80.488,80.534 83.091,81.93 85.756,84.566 C 89.147,87.921 90.384,90.677 90.586,95.332 C 90.715,98.283 90.616,99.225 89.983,101.093 C 88.21,106.323 84.312,110.13 79.073,111.749 C 76.21,112.634 71.782,112.66 69.316,111.809 L 69.316,111.812 M 76.424,97.195 C 80.269,94.56 79.65,88.858 75.339,87.212 C 71.701,85.822 67.738,88.457 67.734,92.267 C 67.734,94.136 68.373,95.425 70.02,96.872 C 71.12,97.837 71.546,97.982 73.28,97.982 C 74.765,97.982 75.568,97.781 76.424,97.195 L 76.424,97.195 M 153.282,111.951 C 147.099,109.987 142.528,104.815 141.443,98.554 C 139.952,89.95 146.227,81.356 155.132,79.81 C 160.673,78.848 165.7,80.596 169.825,84.921 C 172.757,87.995 174.031,90.928 174.211,95.021 C 174.442,100.28 172.857,104.34 169.252,107.727 C 166.925,109.914 165.509,110.779 162.73,111.711 C 160.195,112.56 155.571,112.678 153.282,111.951 L 153.282,111.951 M 162.417,97.33 C 164.728,96.013 165.869,92.959 164.909,90.662 C 164.153,88.852 163.147,87.873 161.331,87.179 C 159.429,86.453 157.604,86.878 155.792,88.468 C 152.606,91.266 153.758,96.327 157.923,97.825 C 159.43,98.366 160.879,98.207 162.417,97.33 M 35.956,54.265 C 34.663,52.972 34.664,52.264 35.956,49.687 C 38.473,44.701 43.676,39.052 48.833,35.707 C 54.303,32.159 56.305,31.586 57.744,33.159 C 59.511,35.09 59.028,36.664 56.139,38.38 C 49.634,42.244 45.323,46.157 41.973,51.237 C 39.17,55.488 37.839,56.157 35.947,54.265 L 35.956,54.265 M 192.901,54.855 C 192.595,54.613 191.319,52.827 190.065,50.886 C 186.873,45.947 182.868,42.273 176.878,38.789 C 174.089,37.167 173.281,35.985 173.881,34.406 C 174.305,33.29 175.562,32.366 176.655,32.366 C 178.852,32.366 186.147,37.233 190.027,41.289 C 192.821,44.209 194.565,46.593 196.272,49.825 C 197.511,52.17 197.474,53.241 196.117,54.383 C 194.937,55.376 193.773,55.547 192.901,54.855 L 192.901,54.855" id="path572" style="fill:#000000"/>
</svg>`;

export function SvgPathViewer({ version }: { version: string }) {
  const [input, setInput] = useState(SAMPLE);
  const [source, setSource] = useState(SAMPLE);
  const [lineView, setLineView] = useState(true);
  const [result, setResult] = useState<{ shapes: Shape[]; notes: string[]; written: Written }>({ shapes: [], notes: [], written: NONE });
  const [progress, setProgress] = useState(1);
  const [tab, setTab] = useState<'css' | 'js' | 'react' | 'svg'>('css');
  const host = useRef<HTMLDivElement>(null);
  const inst = useRef<Instance | null>(null);
  const raf = useRef(0);

  // Debounce typing so a half-pasted SVG is not parsed on every key.
  useEffect(() => {
    const id = setTimeout(() => setSource(input), 300);
    return () => clearTimeout(id);
  }, [input]);

  // Parsing is pure: the error and what was left out come straight from it.
  const parsed = useMemo(() => (typeof window === 'undefined' ? null : sanitizeSvg(source)), [source]);
  const error = parsed && !parsed.ok ? parsed.error : '';
  const removed = parsed?.ok ? parsed.removed : EMPTY;
  const { shapes, notes, written } = parsed?.ok ? result : { shapes: [] as Shape[], notes: [] as string[], written: NONE };

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    box.replaceChildren();
    if (!parsed?.ok) return;
    const res = parsed;
    // A copy: Line view restyles the shapes, and the parse is kept for the next toggle.
    const svg = res.svg.cloneNode(true) as SVGSVGElement;
    svg.classList.add('sv-svg');
    box.appendChild(svg);

    const extra: string[] = [];
    // No viewBox: frame the drawing from its own bounds, with a margin.
    if (!svg.getAttribute('viewBox')) {
      try {
        const b = svg.getBBox();
        const pad = Math.max(b.width, b.height) * 0.06 + 2;
        svg.setAttribute('viewBox', `${round(b.x - pad)} ${round(b.y - pad)} ${round(b.width + pad * 2)} ${round(b.height + pad * 2)}`);
      } catch { /* empty drawing */ }
      if (!res.wasBarePath) extra.push('The SVG has no viewBox, so the drawing will not scale with its box. One was worked out from the shapes for this preview.');
    }
    const clean = markup(svg, false);

    const els = Array.from(svg.querySelectorAll<SVGGeometryElement>(GEOMETRY));
    const measured: Shape[] = els.map((el, i) => {
      const cs = getComputedStyle(el);
      let length: number | null = null;
      try { length = lengthOf(el); } catch { length = null; }
      const d = el.getAttribute('d') ?? '';
      return {
        i: i + 1,
        tag: el.localName,
        length,
        commands: el.localName === 'path' ? summarize(d) : '—',
        stroke: cs.stroke !== 'none' && cs.strokeWidth !== '0px' && cs.strokeOpacity !== '0',
        fill: cs.fill !== 'none' && cs.fillOpacity !== '0',
        nonScaling: (el.getAttribute('vector-effect') ?? cs.getPropertyValue('vector-effect')).includes('non-scaling-stroke'),
        pieces: el.localName === 'path' ? (d.match(/[Mm]/g) ?? []).length : 1,
      };
    });

    // The preview look: every shape as a thin line, or as pasted.
    // Not vector-effect: non-scaling-stroke, which measures dashes in screen
    // pixels while the dash length is in SVG units, and leaves a scaled-up
    // drawing with gaps. The width is set from the viewBox size instead.
    // Line view shows every shape as a line: fills off, and a stroke added
    // where a shape has none. A shape that has a stroke keeps its own width.
    if (lineView) {
      const vb = svg.viewBox.baseVal;
      const width = String(round(Math.max(vb?.width || 0, vb?.height || 0, 1) / 180));
      els.forEach((el, k) => {
        el.setAttribute('fill', 'none');
        el.removeAttribute('vector-effect');
        if (!measured[k].stroke) {
          el.setAttribute('stroke', 'currentColor');
          el.setAttribute('stroke-width', width);
        }
        // One path of many pieces is one dash: the pieces would draw one
        // after another. Split it so each piece draws on its own (fills are
        // off here, so the fill rule's holes cannot change).
        const parts = splitPieces(el);
        if (parts) el.replaceWith(...parts);
      });
    }
    // Written out before scrollDraw styles the shapes: the page under the code
    // runs the same drawing the preview shows.
    const written: Written = { clean, drawn: markup(svg, false), drawnJsx: markup(svg, true) };

    let live = true;
    let seen: IntersectionObserver | null = null;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      // Played here with seek() rather than autoplay's own clock, so Replay
      // and the slider drive one timeline. With several shapes it staggers as
      // the generated code does (seek() spans the whole staggered run).
      inst.current = scrollDraw(box, { autoplay: true, duration: PLAY_MS, stagger: staggers(measured) ? STAGGER : 0 });
      inst.current.seek(0);
      setProgress(0);
      setResult({ shapes: measured, notes: extra, written });
      // Play once the drawing is on screen, as autoplay would.
      seen = new IntersectionObserver(([e]) => {
        if (e?.isIntersecting) { play(); seen?.disconnect(); }
      });
      seen.observe(box);
    });
    return () => {
      live = false;
      seen?.disconnect();
      cancelAnimationFrame(raf.current);
      inst.current?.destroy();
      inst.current = null;
    };
  }, [parsed, lineView]);

  /** Draw from 0 to 1 over PLAY_MS, eased like the default ease-out. */
  function play() {
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / PLAY_MS);
      const p = 1 - (1 - t) * (1 - t);
      inst.current?.seek(p);
      setProgress(p);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function scrub(p: number) {
    cancelAnimationFrame(raf.current);
    inst.current?.seek(p);
    setProgress(p);
  }

  const problems = useMemo(() => findProblems(shapes, removed), [shapes, removed]);
  const many = staggers(shapes);
  const code = useMemo(() => {
    if (!written.clean) return '';
    if (tab === 'css') return withSource(cssCode(), SLUG, 'css');
    if (tab === 'js') return withSource(jsCode(many), SLUG, 'js');
    if (tab === 'react') return withSource(reactCode(many), SLUG, 'tsx');
    return withSource(written.clean, SLUG, 'svg');
  }, [tab, written, many]);
  const run = useMemo(
    () => (written.drawn ? { html: htmlPage(written.drawn, many, version), react: reactProject(written.drawnJsx, many, version) } : null),
    [written, many, version],
  );

  return (
    <div className="sv">
      <div className="sv-panel">
        <label className="sv-input">
          <span>Paste an SVG, or one path’s d value</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            rows={7}
            aria-label="SVG markup or path data"
          />
        </label>
        {error && <p className="sv-error" role="alert">{error}</p>}
        {/* Kept mounted while an error shows: the next valid paste renders into it. */}
        <div hidden={!!error}>
            <div className="sv-stage">
              <div ref={host} className="sv-host" />
            </div>
            <div className="sv-transport">
              <button type="button" className="sv-btn" onClick={play}>↻ Replay</button>
              <label className="sv-scrub">
                <span>progress · {progress.toFixed(2)}</span>
                <input type="range" min={0} max={1} step={0.01} value={progress} aria-label="Drawing progress" onChange={(e) => scrub(Number(e.target.value))} />
              </label>
              <label className="sv-check">
                <input type="checkbox" checked={lineView} onChange={(e) => setLineView(e.target.checked)} />
                <span>Line view</span>
              </label>
            </div>
        </div>
      </div>

      {!error && shapes.length > 0 && (
        <>
          <div className="sv-results">
            <div className="sv-scroll">
              <table className="sv-table">
                <thead><tr><th>#</th><th>Element</th><th>Length</th><th>Commands</th><th>Stroke</th><th>Fill</th></tr></thead>
                <tbody>
                  {shapes.map((s) => (
                    <tr key={s.i}>
                      <td>{s.i}</td>
                      <td>&lt;{s.tag}&gt;</td>
                      <td>{s.length === null ? '—' : round(s.length)}</td>
                      <td>{s.commands}</td>
                      <td>{s.stroke ? 'yes' : 'none'}</td>
                      <td>{s.fill ? 'yes' : 'none'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="sv-total">
              {shapes.length} shape{shapes.length === 1 ? '' : 's'} · total length{' '}
              {round(shapes.reduce((n, s) => n + (s.length ?? 0), 0))} (in viewBox units)
            </p>
            <ul className="sv-problems" aria-label="Checks">
              {[...problems, ...notes].map((p) => <li key={p}>{p}</li>)}
              {!problems.length && !notes.length && <li className="is-ok">Nothing in the way: every shape has a stroke and will draw.</li>}
            </ul>
          </div>

          <div className="sv-code">
            <div className="sv-tabs" role="tablist" aria-label="Code">
              {([['css', 'CSS'], ['js', 'JavaScript'], ['react', 'React'], ['svg', 'Clean SVG']] as const).map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className="sv-tab" onClick={() => setTab(k)}>{label}</button>
              ))}
            </div>
            <CodeBox file={{ css: 'draw.css', js: 'main.js', react: 'Drawing.tsx', svg: 'drawing.svg' }[tab]}>{code}</CodeBox>
            {/* The sample is Tibbixel's file, licensed for showing here, not for
                handing on: no download of it and no upload to StackBlitz. */}
            {run && source === SAMPLE ? (
              <p className="sv-total sv-runnote">
                Paste your own SVG to download it as a page or open it in StackBlitz. The sample cat is
                Tibbixel’s, shown here under their licence, which does not allow passing the file on.
              </p>
            ) : run ? (
              <ToolExport title={RUN_TITLE} filename="svg-drawing.html" html={run.html} react={run.react} />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

// ── Reading the shapes ──────────────────────────────────────────────────────

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A path whose data has several pieces (one M per piece), split into one path
 * per piece with the same attributes; null if it is one piece, or if it uses
 * relative commands, whose pieces depend on where the previous one ended.
 */
function splitPieces(el: Element): Element[] | null {
  if (el.localName !== 'path') return null;
  const d = el.getAttribute('d') ?? '';
  if (/[mlhvcsqtaz]/.test(d.replace(/\d[eE][+-]?\d/g, '0'))) return null;
  const pieces = d.split(/(?=M)/).map((p) => p.trim()).filter(Boolean);
  if (pieces.length < 2) return null;
  return pieces.map((piece) => {
    const copy = el.cloneNode(false) as Element;
    copy.setAttribute('d', piece);
    return copy;
  });
}

/**
 * A shape's length as scrollDraw measures it (getElementLength in
 * packages/svg-scroll-draw/src/core/geometry.ts), so the table shows the dash
 * length the library will use: 2πr for a circle, the perimeter for a rect, the
 * browser's getTotalLength() for the rest. (Chrome's own getTotalLength() for
 * a circle is slightly short.)
 */
function lengthOf(el: SVGGeometryElement): number {
  const n = (a: string) => parseFloat(el.getAttribute(a) ?? '0') || 0;
  if (el.localName === 'circle') return 2 * Math.PI * n('r');
  if (el.localName === 'rect') return 2 * (n('width') + n('height'));
  return el.getTotalLength();
}

/** "M 1 · C 3 · Z 1": how many of each command the path data uses. */
function summarize(d: string): string {
  const counts = new Map<string, number>();
  for (const c of d.match(/[MLHVCSQTAZ]/gi) ?? []) {
    const k = c.toUpperCase();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].map(([k, n]) => `${k} ${n}`).join(' · ') || '—';
}

function findProblems(shapes: Shape[], removed: Record<string, number>): string[] {
  const out: string[] = [];
  const noStroke = shapes.filter((s) => !s.stroke).map((s) => s.i);
  const filled = shapes.filter((s) => s.fill).map((s) => s.i);
  const ellipses = shapes.filter((s) => s.tag === 'ellipse').map((s) => s.i);
  const empty = shapes.filter((s) => s.length === 0).map((s) => s.i);
  const list = (ns: number[]) => ns.map((n) => `#${n}`).join(', ');
  if (noStroke.length) out.push(`No stroke on ${list(noStroke)}: a line drawing animates the stroke, so these would not be seen. Add stroke="currentColor" (Line view adds one for the preview).`);
  if (filled.length) out.push(`Fill on ${list(filled)}: the filled area shows before its outline draws. Set fill="none", or fade the fill in once the line is done.`);
  if (ellipses.length) out.push(`<ellipse> (${list(ellipses)}) is not in scrollDraw’s default selector, so it would not draw. Add it to the selector (selector: '${[...DRAWN].join(', ')}, ellipse') or draw it as a path.`);
  const nonScaling = shapes.filter((s) => s.nonScaling).map((s) => s.i);
  if (nonScaling.length) out.push(`vector-effect="non-scaling-stroke" on ${list(nonScaling)}: dashes are then measured in screen pixels but the length is in SVG units, so a drawing shown larger than its viewBox draws with gaps. Remove it for line drawings.`);
  const multi = shapes.filter((s) => s.pieces > 1);
  if (multi.length) out.push(`${multi.map((s) => `#${s.i} is one path of ${s.pieces} pieces`).join(', ')}: drawn as one line, the pieces trace one after another along a single dash. Split them into one path each (Line view does this for the preview) so they draw together.`);
  if (empty.length) out.push(`Zero length: ${list(empty)}. A shape with no length has nothing to draw.`);
  if (removed['<style>'] || removed['class="…"'] || removed['style="…"']) out.push('Styles from a <style> block, classes or style="" are not read here, so a stroke or fill set that way shows as none. Put them in attributes (stroke="…") to check them.');
  const ignored = Object.entries(removed).filter(([k]) => !/^<(title|desc|metadata|defs|style)>$|^(class|style)="…"$/.test(k));
  if (ignored.length) out.push(`Left out (not drawing shapes, or not safe to run): ${ignored.map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(', ')}.`);
  return out;
}

// ── The generated code ──────────────────────────────────────────────────────

function cssCode(): string {
  return `/* Add pathLength="1" to each shape: every length becomes 1,
   so one rule draws them all, whatever their real length. */
.drawing :is(path, line, polyline, polygon, rect, circle) {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw 2s ease forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}`;
}

/** Whether the code staggers: more than one shape that scrollDraw draws by default. */
function staggers(shapes: Shape[]): boolean {
  return shapes.filter((s) => DRAWN.has(s.tag)).length > 1;
}

const DRAW_NOTE = '// Draws as the drawing scrolls through the window.';
/** The JavaScript tab's call, which the page under the code runs as written. */
const drawCall = (many: boolean) => `scrollDraw('#drawing'${many ? `, { stagger: ${STAGGER} }` : ''});`;

function jsCode(many: boolean): string {
  return `// <div id="drawing"><svg …>…</svg></div>

import { scrollDraw } from 'svg-scroll-draw';

${DRAW_NOTE}
${drawCall(many)}`;
}

/** The React tab's component around `svg`, JSX lines already indented to sit in it. */
function drawingComponent(many: boolean, svg: string): string {
  return `export function Drawing() {
  return (
    <ScrollDraw${many ? ` stagger={${STAGGER}}` : ''}>
${svg}
    </ScrollDraw>
  );
}`;
}

function reactCode(many: boolean): string {
  return `import { ScrollDraw } from 'svg-scroll-draw/react';

${drawingComponent(many, '      <svg viewBox="…">{/* your paths */}</svg>')}`;
}

/**
 * The SVG written out one element to a line. As markup it carries the SVG
 * namespace, which a .svg file needs to open on its own (the rebuilt element
 * has it as its namespace, not as an attribute); as JSX the attributes take
 * React's names (stroke-width is strokeWidth).
 */
function markup(el: Element, jsx: boolean, depth = 0): string {
  const pad = '  '.repeat(depth);
  const attrs = Array.from(el.attributes)
    .filter((a) => a.name !== 'class')
    .map((a) => ` ${jsx ? a.name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) : a.name}="${escapeHtml(a.value)}"`);
  if (depth === 0 && !jsx && !el.hasAttribute('xmlns')) attrs.unshift(` xmlns="${SVG_NS}"`);
  const open = `${pad}<${el.localName}${attrs.join('')}`;
  const kids = Array.from(el.children);
  if (!kids.length) return `${open} />`;
  return [`${open}>`, ...kids.map((k) => markup(k, jsx, depth + 1)), `${pad}</${el.localName}>`].join('\n');
}

const indent = (s: string, n: number) => s.split('\n').map((l) => ' '.repeat(n) + l).join('\n');

// ── The page under the code ─────────────────────────────────────────────────

const RUN_TITLE = 'SVG drawing on scroll';
const RUN_INTRO = 'Scroll down: the drawing draws as it passes through the window, and undraws as you scroll back up.';
const RUN_OUTRO = 'That is scrollDraw’s default trigger: it starts as the drawing’s top comes into the bottom of the window and finishes as its bottom leaves the top.';
/**
 * A screen above the drawing, so it starts undrawn, and more than a screen
 * below: the default trigger ends when the drawing's bottom leaves the top of
 * the window, and with a stagger the later shapes end after that.
 */
const RUN_CSS = `body {
  margin: 0;
  font: 16px/1.6 system-ui, sans-serif;
  color: #18181b;
  background: #fafafa;
}
.intro, .outro {
  display: grid;
  place-content: center;
  min-height: 100vh;
  padding: 0 24px;
  text-align: center;
}
.outro { min-height: 150vh; }
svg {
  display: block;
  width: min(100% - 48px, 560px);
  height: auto;
  max-height: 80vh;
  margin: 0 auto;
}`;

/** The JavaScript tab as a page, around the drawing the preview shows. */
function htmlPage(svg: string, many: boolean, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: RUN_TITLE,
    css: RUN_CSS,
    body: [
      '<header class="intro">',
      `  <h1>${RUN_TITLE}</h1>`,
      `  <p>${RUN_INTRO}</p>`,
      '</header>',
      '<div id="drawing">',
      indent(svg, 2),
      '</div>',
      '<footer class="outro">',
      `  <p>${RUN_OUTRO}</p>`,
      '</footer>',
    ].join('\n'),
    script: [`import { scrollDraw } from '${cdnModule(version)}';`, '', DRAW_NOTE, drawCall(many)].join('\n'),
  });
}

/** The React tab's component with the drawing in it, as a Vite project. */
function reactProject(svgJsx: string, many: boolean, version: string): Omit<ReactProject, 'title'> {
  const app = [
    "import { ScrollDraw } from 'svg-scroll-draw/react';",
    '',
    drawingComponent(many, indent(svgJsx, 6)),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <header className="intro">',
    `        <h1>${RUN_TITLE}</h1>`,
    `        <p>${RUN_INTRO}</p>`,
    '      </header>',
    '      <Drawing />',
    '      <footer className="outro">',
    `        <p>${RUN_OUTRO}</p>`,
    '      </footer>',
    '    </main>',
    '  );',
    '}',
  ].join('\n');
  return { slug: SLUG, app, css: withSource(RUN_CSS, SLUG, 'css'), version };
}
